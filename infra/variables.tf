variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region for Cloud Run and Artifact Registry"
  type        = string
  default     = "asia-southeast1"
}

variable "service_name" {
  description = "Name used for the Cloud Run service, Artifact Registry repo, and related resources"
  type        = string
  default     = "wiseqrpay"
}

variable "db_tier" {
  description = "Cloud SQL machine tier"
  type        = string
  default     = "db-f1-micro"
}

variable "db_name" {
  description = "Name of the Postgres database to create inside the Cloud SQL instance"
  type        = string
  default     = "wiseqrpay"
}

variable "db_user" {
  description = "Postgres user to create for the application"
  type        = string
  default     = "wiseqrpay"
}

variable "image" {
  description = "Full Artifact Registry image URI to deploy (e.g. asia-southeast1-docker.pkg.dev/PROJECT/wiseqrpay/wiseqrpay:TAG)"
  type        = string
}

variable "wise_mode" {
  description = "Wise integration mode: 'mock' for deterministic deep-link QR (demo), 'live' for real Wise Sandbox"
  type        = string
  default     = "mock"
}

variable "auth_secret" {
  description = "AUTH_SECRET for Auth.js v5 (generate with: openssl rand -base64 32)"
  type        = string
  sensitive   = true
}

variable "auth_google_id" {
  description = "Google OAuth 2.0 Web client ID (AUTH_GOOGLE_ID)"
  type        = string
  sensitive   = true
}

variable "auth_google_secret" {
  description = "Google OAuth 2.0 Web client secret (AUTH_GOOGLE_SECRET)"
  type        = string
  sensitive   = true
}
