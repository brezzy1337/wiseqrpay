/**
 * Wise service selector.
 *
 * Flips between the mock (default, no credentials) and live (sandbox) services
 * based on a single env var. Switching WISE_MODE=live changes ONLY which
 * implementation loads — callers consume the WiseService interface and never
 * touch axios directly.
 */

import { env } from "~/env.mjs";

import { liveWise } from "./live.ts";
import { mockWise } from "./mock.ts";

export const wise = env.WISE_MODE === "live" ? liveWise : mockWise;

export { type WiseService } from "./types.ts";
