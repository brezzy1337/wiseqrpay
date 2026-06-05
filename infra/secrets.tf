resource "google_secret_manager_secret" "database_url" {
  secret_id = "DATABASE_URL"

  replication {
    auto {}
  }

  depends_on = [google_project_service.secretmanager]
}

resource "google_secret_manager_secret_version" "database_url" {
  secret      = google_secret_manager_secret.database_url.id
  secret_data = "postgresql://${var.db_user}:${random_password.db.result}@/${var.db_name}?host=/cloudsql/${google_sql_database_instance.main.connection_name}&sslmode=disable"
}

resource "google_secret_manager_secret" "auth_secret" {
  secret_id = "AUTH_SECRET"

  replication {
    auto {}
  }

  depends_on = [google_project_service.secretmanager]
}

resource "google_secret_manager_secret_version" "auth_secret" {
  secret      = google_secret_manager_secret.auth_secret.id
  secret_data = var.auth_secret
}

resource "google_secret_manager_secret" "auth_google_id" {
  secret_id = "AUTH_GOOGLE_ID"

  replication {
    auto {}
  }

  depends_on = [google_project_service.secretmanager]
}

resource "google_secret_manager_secret_version" "auth_google_id" {
  secret      = google_secret_manager_secret.auth_google_id.id
  secret_data = var.auth_google_id
}

resource "google_secret_manager_secret" "auth_google_secret" {
  secret_id = "AUTH_GOOGLE_SECRET"

  replication {
    auto {}
  }

  depends_on = [google_project_service.secretmanager]
}

resource "google_secret_manager_secret_version" "auth_google_secret" {
  secret      = google_secret_manager_secret.auth_google_secret.id
  secret_data = var.auth_google_secret
}
