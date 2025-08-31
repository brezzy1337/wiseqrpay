// In the T3 stack there is a seperate db folder
// which is composed of a `index.ts` and `schema.ts` files

import { PrismaClient } from "@prisma/client";
import { Connector, IpAddressTypes } from "@google-cloud/cloud-sql-connector";

import { env } from "~/env.mjs";

// const createPrismaClient = () =>
//   new PrismaClient({
//     log:
//       env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
//   });

// Initialize Cloud SQL Connector
const connector = new Connector();

const prismaClientSingleton = async () => {
  // Check if Cloud SQL Connector should be used
  if (env.CLOUD_SQL_CONNECTION_NAME && env.DB_USER && env.DB_PASS && env.DB_NAME) {
    // Use Cloud SQL Connector for secure connection
    const clientOpts = await connector.getOptions({
      instanceConnectionName: env.CLOUD_SQL_CONNECTION_NAME,
      ipType: IpAddressTypes.PUBLIC, // or IpAddressTypes.PRIVATE if using private IP
    });

    // Extract host and port from the options
    const connectionConfig = {
      host: (clientOpts as any).host || 'localhost',
      port: (clientOpts as any).port || 5432,
    };

    return new PrismaClient({
      datasources: {
        db: {
          url: `postgresql://${env.DB_USER}:${env.DB_PASS}@${connectionConfig.host}:${connectionConfig.port}/${env.DB_NAME}?sslmode=require`,
        },
      },
      log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  } else {
    // Fallback to traditional DATABASE_URL connection
    return new PrismaClient({
      log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  }
};

const extendedPrismaClientSingleton = async () => {
  const client = await prismaClientSingleton();
  return client.$extends({
    query: {
      $allOperations({ operation, model, args, query }) {
        const start = performance.now();
        return query(args).finally(() => {
          const end = performance.now();
          // logger.info(`${model}.${operation} took ${end - start}ms`);
        });
      },
    },
  });
};

type PrismaClientSingleton = Awaited<ReturnType<typeof prismaClientSingleton>>;
type ExtendedPrismaClientSingleton = Awaited<ReturnType<typeof extendedPrismaClientSingleton>>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
  extendedPrisma: ExtendedPrismaClientSingleton | undefined;
  prismaPromise: Promise<PrismaClientSingleton> | undefined;
  extendedPrismaPromise: Promise<ExtendedPrismaClientSingleton> | undefined;
};

// Initialize promises for lazy loading
const prismaPromise = globalForPrisma.prismaPromise ?? prismaClientSingleton();
const extendedPrismaPromise = globalForPrisma.extendedPrismaPromise ?? extendedPrismaClientSingleton();

// Cache the promises globally in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaPromise = prismaPromise;
  globalForPrisma.extendedPrismaPromise = extendedPrismaPromise;
}

// Export the promises - consumers will need to await them
export const prisma = prismaPromise;
export const extendedPrisma = extendedPrismaPromise;

// Synchronous client for NextAuth (falls back to DATABASE_URL)
export const authPrisma = new PrismaClient({
  log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

export async function initializePrisma() {
  try {
    const client = await prisma;
    await client.$connect();
    // logger.info('Prisma initialized successfully');
  } catch (error) {
    // logger.error('Failed to connect to the database. Exiting...', { error });
    process.exit(1);
  }
}

export async function getPrismaClient() {
  return await prisma;
}

export async function getExtendedPrismaClient() {
  return await extendedPrisma;
}

// Cleanup function to close the connector
export async function closeDatabaseConnections() {
  try {
    const client = await prisma;
    await client.$disconnect();
    connector.close();
  } catch (error) {
    console.error('Error closing database connections:', error);
  }
}