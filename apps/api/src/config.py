from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List, Optional


class Settings(BaseSettings):
    # App
    app_name: str = "No Time To Lie"
    app_version: str = "0.1.0"
    debug: bool = False
    environment: str = "development"
    api_v1_prefix: str = "/v1"

    # Database
    database_url: str = Field("sqlite+aiosqlite:///./notimetolie.db", alias="DATABASE_URL")
    database_test_url: str = Field("sqlite+aiosqlite:///./notimetolie_test.db", alias="DATABASE_URL_TEST")

    # Redis
    redis_url: str = "redis://localhost:6379"
    redis_test_url: str = "redis://localhost:6380"

    # Meilisearch
    meilisearch_url: str = "http://localhost:7700"
    meilisearch_master_key: Optional[str] = None
    meilisearch_test_url: str = "http://localhost:7701"
    meilisearch_test_master_key: Optional[str] = None

    # Security
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # CORS
    cors_origins: str = Field("http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000", alias="CORS_ORIGINS")

    # File Storage
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "your-minio-access-key"
    minio_secret_key: str = "your-minio-secret-key"
    minio_bucket_name: str = "notimetolie"
    minio_test_endpoint: str = "localhost:9002"
    minio_test_access_key: str = "test-minio-access-key"
    minio_test_secret_key: str = "test-minio-secret-key"
    minio_test_bucket_name: str = "notimetolie_test"

    # Email Configuration
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    emails_from_email: Optional[str] = None

    # Monitoring
    sentry_dsn: Optional[str] = None
    plausible_analytics_url: Optional[str] = None
    plausible_domain: Optional[str] = None

    # Gamification
    xp_per_block_created: int = 10
    xp_per_suggestion_approved: int = 5
    xp_per_path_created: int = 20
    levels_xp_requirements: List[int] = [100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        env_nested_delimiter = "__"
        extra = "allow"


settings = Settings()
