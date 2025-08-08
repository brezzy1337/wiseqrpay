# Multi-stage Dockerfile for Next.js + Prisma on Cloud Run
# Use debian-slim (not alpine) to avoid Prisma binary issues

FROM node:20-slim AS base
ENV CI=true \
    NODE_ENV=production

WORKDIR /app

# Install OS deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates openssl libc6 libstdc++6 curl && \
    rm -rf /var/lib/apt/lists/*

FROM base AS deps
WORKDIR /app

# Install dependencies based on lockfile (skip postinstall)
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline --ignore-scripts

FROM deps AS build
WORKDIR /app

# Copy source and generate Prisma client, then build Next
COPY prisma ./prisma
COPY src ./src
COPY public ./public
COPY next.config.ts ./
COPY package.json ./
COPY tsconfig.json ./
COPY postcss.config.js ./
COPY tailwind.config.ts ./
COPY prettier.config.js ./

# Avoid env validation during container build
ENV SKIP_ENV_VALIDATION=true

# Generate Prisma Client with dev deps available
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app

# Copy only the necessary runtime artifacts
ENV NEXT_TELEMETRY_DISABLED=1 \
    PORT=8080

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY package.json ./package.json
COPY prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# Prisma needs generated client at runtime
RUN node -e "require('fs').existsSync('./node_modules/.prisma/client') || process.exit(1)"

EXPOSE 8080

# Use Next.js standalone server
CMD ["npm", "run", "start", "--", "-p", "8080"]


