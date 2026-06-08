# WiseQRPay — GCP Infrastructure (Terraform)

Provisions everything needed to run the WiseQRPay demo on GCP Cloud Run. Every
provider/resource argument was verified against the live Terraform Registry
(`hashicorp/google` v7.x) before being written.

- **Artifact Registry** Docker repo (push your image here)
- **Cloud SQL** Postgres 16, `db-f1-micro`, public IP, Cloud SQL Auth Proxy socket mount
- **Secret Manager** secrets: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- **Cloud Run v2 service** — public ingress, port 8080, Cloud SQL volume mount, secret-backed env
- **IAM** — runtime service account with `roles/cloudsql.client` + `roles/secretmanager.secretAccessor` per secret; `allUsers` → `roles/run.invoker` (public pay page)

State is **local** (`terraform.tfstate`). Never commit it.

---

## Prerequisites

| Tool | Required |
|------|---------|
| `terraform` | >= 1.5 |
| `gcloud` CLI | authenticated |
| `docker` | for image builds |
| `cloud-sql-proxy` | for schema + seed step |

Provider pin: `hashicorp/google ~> 7.0` (verified latest at build time: 7.35.0),
`hashicorp/random ~> 3.6`.

---

## Bootstrap order

### 1. Authenticate and configure gcloud

```bash
gcloud auth login
gcloud auth application-default login
gcloud config set project YOUR_GCP_PROJECT_ID
```

### 2. Create your tfvars file

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with real values (gitignored)
```

Required inputs (no defaults):
- `project_id` — your GCP project ID
- `image` — Artifact Registry image URI (use a placeholder for the first apply; see step 3)
- `auth_secret` — generate with `openssl rand -base64 32`
- `auth_google_id` / `auth_google_secret` — from the Google OAuth 2.0 Web client (Console)

### 3. First apply — bootstrap APIs and Artifact Registry

Because Cloud Run needs an image to exist, use a public placeholder for `var.image` on the
first apply. Then push your real image and re-apply.

**Option A — placeholder image (simplest):**

Set `image = "us-docker.pkg.dev/cloudrun/container/hello"` in `terraform.tfvars`, then:

```bash
terraform init
terraform apply
```

**Option B — target only APIs + Registry first:**

```bash
terraform init
terraform apply \
  -target=google_project_service.run \
  -target=google_project_service.sqladmin \
  -target=google_project_service.secretmanager \
  -target=google_project_service.artifactregistry \
  -target=google_project_service.iam \
  -target=google_artifact_registry_repository.main
```

Then build/push (step 4), then `terraform apply` with the real image.

### 4. Build and push your Docker image

```bash
# Authenticate Docker to Artifact Registry
gcloud auth configure-docker asia-southeast1-docker.pkg.dev

# Get the repo URL from Terraform output
REPO=$(terraform output -raw artifact_registry_repo)

# Build and push
docker build -t "$REPO/wiseqrpay:latest" ../
docker push "$REPO/wiseqrpay:latest"
```

### 5. Apply with the real image

```bash
terraform apply -var "image=$REPO/wiseqrpay:latest"
```

### 5b. Set the public URL for Auth.js (`AUTH_URL`) and re-apply

Auth.js can't infer its public origin behind Cloud Run's proxy, so it must be told
explicitly — otherwise OAuth callbacks are built against `localhost:8080` and Google
sign-in fails. Now that the service exists, read its URL and set `auth_url`:

```bash
terraform output -raw service_uri   # e.g. https://wiseqrpay-xxxx-as.a.run.app
```

Set `auth_url` to that value in `terraform.tfvars`, then re-apply:

```bash
terraform apply -var "image=$REPO/wiseqrpay:latest"
```

This adds the `AUTH_URL` env var to a new revision. (`auth_url` is empty by default, so
the first bootstrap apply works before the URL is known.)

### 6. Register the OAuth redirect URI

Terraform outputs the URI you must register. Get it:

```bash
terraform output oauth_redirect_uri
```

Go to [GCP Console > APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials),
edit your OAuth 2.0 Web client, and add the URI above to **Authorised redirect URIs**. This is
the one step Terraform cannot automate.

### 7. Schema + seed (Cloud SQL Proxy)

The on-disk Prisma migrations are stale (they include a `post` migration from before the
`Merchant` model was added). Do NOT run `prisma migrate deploy` — use `db push` instead, which
is the demo convention.

```bash
# In a separate terminal — keep this running
DB_CONNECTION=$(terraform output -raw db_connection_name)
cloud-sql-proxy "$DB_CONNECTION" --port=5432

# In your project root (../), set the local DATABASE_URL to the proxy:
export DATABASE_URL="postgresql://wiseqrpay:YOUR_DB_PASSWORD@localhost:5432/wiseqrpay"

# Push schema
npm run db:push

# Seed demo data
npm run db:seed
```

The DB password is the randomly generated value stored in Secret Manager. Retrieve it with:

```bash
gcloud secrets versions access latest --secret="DATABASE_URL"
# Extract the password from the DSN, or read it from Terraform state (local only)
```

---

## Outputs

After apply, useful outputs:

```bash
terraform output service_uri          # Cloud Run URL (open in browser)
terraform output oauth_redirect_uri   # Register this in Google OAuth console
terraform output artifact_registry_repo  # Push images here
terraform output runtime_sa_email     # Runtime service account email
terraform output db_connection_name   # Cloud SQL connection name
```

---

## Wise mode

The demo defaults to `wise_mode = "mock"` — the pay page generates a deterministic Wise
deep-link QR without any Wise API token. No Wise credentials are needed.

To switch to live Wise Sandbox, set `wise_mode = "live"` in `terraform.tfvars` and add
`WISE_API_TOKEN` manually as an env variable or additional Secret Manager secret (not
Terraformed in this slice — add it when the live integration is tested).

---

## Teardown

```bash
terraform destroy
```

`deletion_protection = false` is set on both Cloud SQL and Cloud Run so destroy works without
manual console intervention.
