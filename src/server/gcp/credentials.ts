import { GoogleAuth } from "google-auth-library";

type GCPCredentials = {
  credentials: {
    client_email: string | undefined;
    private_key: string | undefined;
  };
  projectId?: string;
};

/**
 * Returns credentials suitable for @google-cloud/* SDK clients.
 * - On Vercel, reads GCP_* envs set by the integration.
 * - Locally/Cloud Run, returns empty so ADC (gcloud/SA) is used.
 */
export const getGCPCredentials = (): GCPCredentials | {} => {
  const projectId = process.env.GCP_PROJECT_ID;
  const clientEmail = process.env.GCP_SERVICE_ACCOUNT_EMAIL;
  const privateKeyRaw = process.env.GCP_PRIVATE_KEY;

  if (projectId && clientEmail && privateKeyRaw) {
    const privateKey = privateKeyRaw.replace(/\\n/g, "\n");
    return {
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      projectId,
    } satisfies GCPCredentials;
  }

  return {};
};

/**
 * Fetches a Google-signed ID token for calling a private Cloud Run URL.
 * Works on Vercel (using GCP_* envs) and locally/Cloud Run (using ADC).
 */

export const getIdTokenForAudience = async (audience: string): Promise<string> => {
  const creds = getGCPCredentials() as GCPCredentials | {};
  const auth = new GoogleAuth(
    "credentials" in creds
      ? { credentials: creds.credentials, projectId: creds.projectId }
      : undefined
  );

  const client = await auth.getIdTokenClient(audience);
  const headers = await client.getRequestHeaders();
  const authHeader = (headers["Authorization"] || headers["authorization"]) as string | undefined;
  if (!authHeader) throw new Error("Failed to obtain ID token");
  return authHeader.replace(/^Bearer\s+/i, "");
};