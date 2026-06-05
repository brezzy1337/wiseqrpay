resource "random_password" "db" {
  length  = 24
  special = false
}

resource "google_sql_database_instance" "main" {
  name             = var.service_name
  database_version = "POSTGRES_16"
  region           = var.region

  settings {
    tier = var.db_tier

    ip_configuration {
      ipv4_enabled = true
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
