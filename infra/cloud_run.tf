resource "google_cloud_run_v2_service" "main" {
  name     = var.service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  deletion_protection = false

  template {
    service_account = google_service_account.runtime.email

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.main.connection_name]
      }
    }

    containers {
      image = var.image

      ports {
        container_port = 8080
      }

      # Plain environment variables
      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "WISE_MODE"
        value = var.wise_mode
      }

      env {
        name  = "AUTH_TRUST_HOST"
        value = "true"
      }

      # Auth.js needs its public origin to build correct OAuth callback URLs. Behind
      # Cloud Run's proxy, `next start` can't infer it (it falls back to localhost:8080),
      # so set AUTH_URL explicitly once the service URL is known. Emitted only when
      # auth_url is non-empty so the first (URL-unknown) apply still works.
      dynamic "env" {
        for_each = var.auth_url != "" ? [1] : []
        content {
          name  = "AUTH_URL"
          value = var.auth_url
        }
      }

      # Secret-backed environment variables
      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.database_url.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "AUTH_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.auth_secret.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "AUTH_GOOGLE_ID"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.auth_google_id.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "AUTH_GOOGLE_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.auth_google_secret.secret_id
            version = "latest"
          }
        }
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }
    }
  }

  depends_on = [
    google_project_service.run,
    google_project_service.sqladmin,
    google_project_service.secretmanager,
    # The secret-backed envs resolve version = "latest" at deploy time, so the
    # versions must exist before the service is created (otherwise a first apply
    # fails resolving "latest"). The secret_key_ref only implies a dependency on
    # the secret, not the version, so order it explicitly here.
    google_secret_manager_secret_version.database_url,
    google_secret_manager_secret_version.auth_secret,
    google_secret_manager_secret_version.auth_google_id,
    google_secret_manager_secret_version.auth_google_secret,
    # Cloud Run v2 validates at deploy time that the runtime SA can read each
    # referenced secret. IAM propagation is async, so the accessor grants must
    # exist before the service is created or the first apply fails permission-denied.
    google_secret_manager_secret_iam_member.runtime_database_url,
    google_secret_manager_secret_iam_member.runtime_auth_secret,
    google_secret_manager_secret_iam_member.runtime_auth_google_id,
    google_secret_manager_secret_iam_member.runtime_auth_google_secret,
    # The Cloud SQL client role is checked at instance-connect time, not deploy
    # time, but order it here too for symmetry with the secret bindings so a
    # re-derived depends_on stays correct.
    google_project_iam_member.runtime_cloudsql,
  ]
}

resource "google_cloud_run_v2_service_iam_member" "public_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.main.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
