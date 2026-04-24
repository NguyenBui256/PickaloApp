"""
Application configuration using Pydantic Settings.

Environment variables are loaded from .env files with fallback to defaults.
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = Field(default="ALOBO Booking API", description="Application name")
    app_version: str = Field(default="0.1.0", description="API version")
    environment: Literal["development", "staging", "production"] = Field(
        default="development", description="Deployment environment"
    )
    debug: bool = Field(default=True, description="Debug mode")

    # Server
    host: str = Field(default="0.0.0.0", description="Server host")
    port: int = Field(default=8000, description="Server port")

    # Database
    database_url: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/alobo_dev",
        description="PostgreSQL database URL",
    )
    db_echo: bool = Field(default=False, description="Echo SQL queries")

    # Security
    secret_key: str = Field(
        default="change-this-secret-key-in-production",
        description="JWT secret key",
    )
    algorithm: str = Field(default="HS256", description="JWT algorithm")
    access_token_expire_minutes: int = Field(
        default=30, description="Access token expiration in minutes"
    )
    refresh_token_expire_days: int = Field(
        default=7, description="Refresh token expiration in days"
    )

    # CORS
    cors_origins: list[str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:8081",
            "http://admin-dashboard:3000",
        ],
        description="Allowed CORS origins",
    )

    # Payment - VNPay
    vnpay_tmn_code: str = Field(default="", description="VNPay terminal code")
    vnpay_hash_secret: str = Field(default="", description="VNPay hash secret")
    vnpay_payment_url: str = Field(
        default="https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
        description="VNPay payment URL",
    )
    vnpay_return_url: str = Field(
        default="http://localhost:8081/payment/vnpay-return",
        description="VNPay return URL",
    )

    # Payment - Momo
    momo_partner_code: str = Field(default="", description="Momo partner code")
    momo_access_key: str = Field(default="", description="Momo access key")
    momo_secret_key: str = Field(default="", description="Momo secret key")
    momo_payment_url: str = Field(
        default="https://test-payment.momo.vn/gw_payment/transactionProcessor",
        description="Momo payment URL",
    )
    momo_return_url: str = Field(
        default="http://localhost:8081/payment/momo-return",
        description="Momo return URL",
    )

    # Redis (for caching, optional)
    redis_url: str = Field(
        default="redis://localhost:6379/0", description="Redis URL"
    )

    # MinIO Object Storage (for images)
    minio_endpoint: str = Field(default="minio:9000", description="MinIO server endpoint")
    minio_access_key: str = Field(default="minioadmin", description="MinIO access key")
    minio_secret_key: str = Field(default="minioadmin", description="MinIO secret key")
    minio_secure: bool = Field(default=False, description="Use HTTPS for MinIO")
    minio_bucket_name: str = Field(default="pickalo-images", description="MinIO bucket name")
    minio_public_url: str = Field(default="http://localhost:9000", description="Public MinIO URL")

    # Timezone (fixed for Hanoi)
    timezone: str = Field(default="Asia/Ho_Chi_Minh", description="Application timezone")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | list[str]) -> list[str]:
        """Parse CORS origins from comma-separated string or list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v


@lru_cache
def get_settings() -> Settings:
    """
    Get cached settings instance.

    Returns:
        Settings: Cached application settings
    """
    return Settings()


# Global settings instance
settings = get_settings()
