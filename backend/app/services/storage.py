"""
MinIO-based object storage service for image management.
"""

import uuid
import os
from io import BytesIO
from typing import BinaryIO
from minio import Minio
from minio.error import S3Error
from fastapi import UploadFile, HTTPException, status

from app.core.config import settings


class StorageService:
    """MinIO-based object storage for images."""

    def __init__(self):
        self.client = Minio(
            endpoint=settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_secure
        )
        self.bucket_name = settings.minio_bucket_name
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        """Create bucket if it doesn't exist."""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                # Set bucket policy for public read access
                self._set_public_policy()
        except S3Error as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to initialize storage: {str(e)}"
            )

    def _set_public_policy(self):
        """Set bucket policy for public read access."""
        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"AWS": "*"},
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{self.bucket_name}/*"]
                }
            ]
        }
        import json
        try:
            self.client.set_bucket_policy(self.bucket_name, json.dumps(policy))
        except S3Error as e:
            # Log but don't fail - policy might already be set
            print(f"Warning: Could not set bucket policy: {str(e)}")

    async def upload_user_avatar(
        self,
        user_id: uuid.UUID,
        file: UploadFile
    ) -> str:
        """Upload user avatar image."""
        self._validate_image_file(file)

        # Generate unique filename
        file_extension = self._get_file_extension(file.filename)
        object_name = f"avatars/{user_id}/{uuid.uuid4()}{file_extension}"

        # Upload to MinIO
        file_data = await file.read()
        self._validate_file_size(len(file_data))

        self.client.put_object(
            bucket_name=self.bucket_name,
            object_name=object_name,
            data=BytesIO(file_data),
            length=len(file_data),
            content_type=file.content_type
        )

        # Return public URL
        return f"{settings.minio_public_url}/{self.bucket_name}/{object_name}"

    async def upload_venue_images(
        self,
        venue_id: uuid.UUID,
        files: list[UploadFile]
    ) -> list[str]:
        """Upload multiple venue images."""
        image_urls = []
        for file in files:
            self._validate_image_file(file)

            file_extension = self._get_file_extension(file.filename)
            object_name = f"venues/{venue_id}/{uuid.uuid4()}{file_extension}"

            file_data = await file.read()
            self._validate_file_size(len(file_data))

            self.client.put_object(
                bucket_name=self.bucket_name,
                object_name=object_name,
                data=BytesIO(file_data),
                length=len(file_data),
                content_type=file.content_type
            )

            image_urls.append(f"{settings.minio_public_url}/{self.bucket_name}/{object_name}")

        return image_urls

    async def upload_court_images(
        self,
        court_id: uuid.UUID,
        files: list[UploadFile]
    ) -> list[str]:
        """Upload multiple court images."""
        image_urls = []
        for file in files:
            self._validate_image_file(file)

            file_extension = self._get_file_extension(file.filename)
            object_name = f"courts/{court_id}/{uuid.uuid4()}{file_extension}"

            file_data = await file.read()
            self._validate_file_size(len(file_data))

            self.client.put_object(
                bucket_name=self.bucket_name,
                object_name=object_name,
                data=BytesIO(file_data),
                length=len(file_data),
                content_type=file.content_type
            )

            image_urls.append(f"{settings.minio_public_url}/{self.bucket_name}/{object_name}")

        return image_urls

    async def upload_payment_proof(
        self,
        user_id: uuid.UUID,
        file: UploadFile
    ) -> str:
        """Upload payment proof image for a booking."""
        self._validate_image_file(file)

        # Generate unique filename
        file_extension = self._get_file_extension(file.filename)
        object_name = f"payments/{user_id}/{uuid.uuid4()}{file_extension}"

        # Upload to MinIO
        file_data = await file.read()
        self._validate_file_size(len(file_data))

        self.client.put_object(
            bucket_name=self.bucket_name,
            object_name=object_name,
            data=BytesIO(file_data),
            length=len(file_data),
            content_type=file.content_type
        )

        # Return public URL
        return f"{settings.minio_public_url}/{self.bucket_name}/{object_name}"

    def delete_image(self, image_url: str) -> bool:
        """Delete image from storage."""
        try:
            # Extract object name from URL
            object_name = image_url.split(f"/{self.bucket_name}/")[-1]
            self.client.remove_object(self.bucket_name, object_name)
            return True
        except (S3Error, IndexError, ValueError):
            return False

    def _validate_image_file(self, file: UploadFile):
        """Validate image file type."""
        allowed_types = ["image/jpeg", "image/png", "image/jpg", "image/webp"]

        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
            )

    def _validate_file_size(self, size: int):
        """Validate file size (max 5MB)."""
        max_size = 5 * 1024 * 1024  # 5MB
        if size > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Maximum size: {max_size / (1024*1024)}MB"
            )

    def _get_file_extension(self, filename: str) -> str:
        """Extract file extension from filename."""
        extension = os.path.splitext(filename)[1] if filename else '.jpg'
        return extension if extension else '.jpg'