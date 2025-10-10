import { createEnv } from "@t3-oss/env-core";
import { z } from "zod/v4";

export const serverEnv = createEnv({
  server: {
    POSTGRES_URL: z.url(),
    WISE_REDIRECT_URL: z.url(),
    WISE_CLIENT_ID: z.string().min(1),
    WISE_CLIENT_SECRET: z.string().min(1),
    // Optional GCP/Cloud SQL settings
    INSTANCE_CONNECTION_NAME: z.string().optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
