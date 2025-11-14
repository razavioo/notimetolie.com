from pydantic_settings import BaseSettings
from pydantic import Field, validator, field_validator
from typing import List, Optional
import secrets
import warnings


class Settings(BaseSettings):
    # App
    app_name: str = "No Time To Lie"
    app_version: str = "0.1.0"
    debug: bool = False
    environment: str = "development"
    api_v1_prefix: str = "/v1"
    
    @field_validator("environment")
    @classmethod
    def validate_environment(cls, v):
        """Validate environment setting"""
        valid_envs = ["development", "test", "staging", "production"]
        if v not in valid_envs:
            raise ValueError(f"environment must be one of {valid_envs}")
        return v

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
    secret_key: str = Field(
        default_factory=lambda: secrets.token_urlsafe(32),
        description="Secret key for JWT signing - MUST be set in production"
    )
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    @field_validator("secret_key")
    @classmethod
    def validate_secret_key(cls, v, info):
        """Ensure secret key is secure in production"""
        # Get environment from values if available
        environment = info.data.get("environment", "development")
        
        # In production, secret key must be strong
        if environment == "production":
            if not v or len(v) < 32:
                raise ValueError("secret_key must be at least 32 characters in production")
            
            # Warn about common insecure values
            insecure_values = [
                "your-secret-key-change-in-production",
                "dev-secret-key",
                "secret",
                "password",
                "changeme",
            ]
            if any(insecure in v.lower() for insecure in insecure_values):
                raise ValueError(
                    "secret_key contains insecure values. "
                    "Generate a strong random key using: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
                )
        
        return v

    # Google OAuth
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    google_redirect_uri: str = "http://localhost:3000/auth/google/callback"

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
