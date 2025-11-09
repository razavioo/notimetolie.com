# Terraform Variables

variable "project_name" {
  description = "The name of the project"
  type        = string
  default     = "notimetolie"
}

variable "environment" {
  description = "The deployment environment"
  type        = string
  default     = "production"
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "database_password" {
  description = "Password for the PostgreSQL database"
  type        = string
  sensitive   = true
}

variable "meilisearch_master_key" {
  description = "Master key for Meilisearch"
  type        = string
  sensitive   = true
}

variable "minio_access_key" {
  description = "Access key for MinIO"
  type        = string
  sensitive   = true
}

variable "minio_secret_key" {
  description = "Secret key for MinIO"
  type        = string
  sensitive   = true
}