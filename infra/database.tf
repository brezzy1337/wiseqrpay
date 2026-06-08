resource "random_password" "db" {
  length  = 24
  special = false
}

# Cloud SQL reserves a deleted instance's name for ~1 week, which would 409 a
# re-apply after `terraform destroy`. A random suffix keeps teardown/re-create
# clean. connection_name is read dynamically, so dependents need no change.
resource "random_id" "db_suffix" {
  byte_length = 4
}

resource "google_sql_database_instance" "main" {
  name             = "${var.service_name}-${random_id.db_suffix.hex}"
  database_version = "POSTGRES_16"
  region           = var.region

  settings {
    tier = var.db_tier

    ip_configuration {
      ipv4_enabled = true
      # Force TLS on the public IP. Compatible with the Cloud SQL Auth Proxy
      # socket mount used by Cloud Run (the proxy always connects over TLS).
      ssl_mode = "ENCRYPTED_ONLY"
    }
  }

  deletion_protection = false

  depends_on = [google_project_service.sqladmin]
}

resource "google_sql_database" "main" {
  name     = var.db_name
  instance = google_sql_database_instance.main.name
}

resource "google_sql_user" "main" {
  name     = var.db_user
  instance = google_sql_database_instance.main.name
  password = random_password.db.result
}
