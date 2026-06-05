resource "google_artifact_registry_repository" "main" {
  location      = var.region
  repository_id = var.service_name
  format        = "DOCKER"
  description   = "Docker images for ${var.service_name}"

  depends_on = [google_project_service.artifactregistry]
}
