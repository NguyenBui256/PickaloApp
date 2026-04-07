"""
Main application tests.

Tests root endpoint, health check, and basic API functionality.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_root_endpoint(client: AsyncClient) -> None:
    """Test root endpoint returns API information."""
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "app" in data
    assert "version" in data
    assert "docs" in data


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient) -> None:
    """Test health check endpoint."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_v1_health_check(client: AsyncClient) -> None:
    """Test v1 health check endpoint."""
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "service" in data
    assert "version" in data


@pytest.mark.asyncio
async def test_v1_root(client: AsyncClient) -> None:
    """Test v1 API root endpoint."""
    response = await client.get("/api/v1/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
