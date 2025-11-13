"""
MinIO file storage service for handling images, videos, and other media.
"""
import asyncio
import io
import uuid
from typing import Optional, BinaryIO
from datetime import timedelta
from minio import Minio
from minio.error import S3Error
import aiofiles
import os

from src.config import settings


class StorageService:
    """Service for managing file storage with MinIO."""
    
    def __init__(self):
        self.endpoint = os.getenv("MINIO_ENDPOINT", "localhost:9000")
        self.access_key = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
        self.secret_key = os.getenv("MINIO_SECRET_KEY", "minioadmin")
        self.bucket = os.getenv("MINIO_BUCKET", "notimetolie")
        self.secure = os.getenv("MINIO_SECURE", "false").lower() == "true"
        
        self.client = Minio(
            self.endpoint,
            access_key=self.access_key,
            secret_key=self.secret_key,
            secure=self.secure
        )
        
        # Ensure bucket exists
        self._ensure_bucket()
    
    def _ensure_bucket(self):
        """Create bucket if it doesn't exist."""
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
                print(f"Created MinIO bucket: {self.bucket}")
        except S3Error as e:
            print(f"Error creating bucket: {e}")
    
    async def upload_file(
        self,
        file_data: bytes,
        content_type: str,
        folder: str = "uploads",
        filename: Optional[str] = None
    ) -> str:
        """
        Upload file to MinIO.
        
        Args:
            file_data: Binary file data
            content_type: MIME type (e.g., 'image/png')
            folder: Folder path in bucket
            filename: Optional filename, generated if not provided
        
        Returns:
            Object path in MinIO
        """
        if filename is None:
            ext = content_type.split("/")[-1]
            filename = f"{uuid.uuid4()}.{ext}"
        
        object_path = f"{folder}/{filename}"
        
        try:
            # Upload to MinIO in executor to avoid blocking
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                lambda: self.client.put_object(
                    self.bucket,
                    object_path,
                    io.BytesIO(file_data),
                    len(file_data),
                    content_type=content_type
                )
            )
            
            return object_path
        except S3Error as e:
            print(f"Error uploading file: {e}")
            raise
    
    async def upload_from_url(
        self,
        url: str,
        folder: str = "ai-generated",
        filename: Optional[str] = None
    ) -> str:
        """
        Download file from URL and upload to MinIO.
        
        Args:
            url: URL to download from
            folder: Folder path in bucket
            filename: Optional filename
        
        Returns:
            Object path in MinIO
        """
        import httpx
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            response.raise_for_status()
            
            content_type = response.headers.get("content-type", "application/octet-stream")
            
            return await self.upload_file(
                response.content,
                content_type,
                folder,
                filename
            )
    
    async def get_file_url(
        self,
        object_path: str,
        expires: int = 3600
    ) -> str:
        """
        Get presigned URL for accessing file.
        
        Args:
            object_path: Path to object in bucket
            expires: URL expiration in seconds
        
        Returns:
            Presigned URL
        """
        try:
            loop = asyncio.get_event_loop()
            url = await loop.run_in_executor(
                None,
                lambda: self.client.presigned_get_object(
                    self.bucket,
                    object_path,
                    expires=timedelta(seconds=expires)
                )
            )
            return url
        except S3Error as e:
            print(f"Error getting file URL: {e}")
            raise
    
    async def delete_file(self, object_path: str) -> bool:
        """
        Delete file from MinIO.
        
        Args:
            object_path: Path to object in bucket
        
        Returns:
            True if successful
        """
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                lambda: self.client.remove_object(self.bucket, object_path)
            )
            return True
        except S3Error as e:
            print(f"Error deleting file: {e}")
            return False
    
    async def list_files(
        self,
        prefix: str = "",
        max_results: int = 100
    ) -> list:
        """
        List files in bucket.
        
        Args:
            prefix: Filter by prefix
            max_results: Maximum number of results
        
        Returns:
            List of object information
        """
        try:
            loop = asyncio.get_event_loop()
            objects = await loop.run_in_executor(
                None,
                lambda: list(self.client.list_objects(
                    self.bucket,
                    prefix=prefix,
                    recursive=True
                ))
            )
            
            return [
                {
                    "path": obj.object_name,
                    "size": obj.size,
                    "last_modified": obj.last_modified.isoformat(),
                    "etag": obj.etag
                }
                for obj in objects[:max_results]
            ]
        except S3Error as e:
            print(f"Error listing files: {e}")
            return []


# Global storage service instance
_storage_service: Optional[StorageService] = None


def get_storage_service() -> StorageService:
    """Get or create storage service instance."""
    global _storage_service
    if _storage_service is None:
        _storage_service = StorageService()
    return _storage_service
