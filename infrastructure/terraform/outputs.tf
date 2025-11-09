# Terraform Outputs

output "api_endpoint" {
  description = "The API endpoint URL"
  value       = aws_lb.api_lb.dns_name
}

output "web_endpoint" {
  description = "The web application endpoint URL"
  value       = aws_lb.web_lb.dns_name
}

output "database_endpoint" {
  description = "The database endpoint URL"
  value       = aws_rds_cluster_postgresql.ntl_db.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "The Redis endpoint URL"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "meilisearch_endpoint" {
  description = "The Meilisearch endpoint URL"
  value       = aws_lb.meilisearch_lb.dns_name
}