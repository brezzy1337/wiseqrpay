output "service_uri" {
  description = "The URL of the deployed Cloud Run service"
  value       = google_cloud_run_v2_service.main.uri
}

output "db_connection_name" {
  description = "Cloud SQL instance connection name (PROJECT:REGION:INSTANCE)"
  value       = google_sql_database_instance.main.connection_name
}

output "artifact_registry_repo" {
  description = "Artifact Registry Docker repository URL"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${var.service_name}"
}

output "runtime_sa_email" {
  description = "Email of the Cloud Run runtime service account"
  value       = google_service_account.runtime.email
}

output "oauth_redirect_uri" {
  description = "URI to register in the Google OAuth Web client (Authorised redirect URIs)"
  value       = "${google_cloud_run_v2_service.main.uri}/api/auth/callback/google"
}
