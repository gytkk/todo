"""
Pytest configuration and shared fixtures.
"""
import asyncio
from typing import AsyncGenerator, Generator

import pytest
import pytest_asyncio
import redis.asyncio as redis
from fastapi.testclient import TestClient
from httpx import AsyncClient

from app.main import app
from app.core.config import settings


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def client() -> TestClient:
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest_asyncio.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Create an async test client for the FastAPI app."""
    from fastapi.testclient import TestClient
    with TestClient(app) as client:
        async with AsyncClient(base_url="http://test") as ac:
            yield ac


# Integration test fixtures
@pytest_asyncio.fixture(scope="session")
async def test_redis_client() -> AsyncGenerator[redis.Redis, None]:
    """
    Create Redis client for integration tests using a separate test database.
    """
    # Use a separate Redis DB for tests to avoid conflicts
    test_db = 15  # Use DB 15 for tests (typically unused)
    
    client = redis.Redis(
        host=settings.redis_host,
        port=settings.redis_port,
        password=settings.redis_password,
        db=test_db,  # Separate test database
        decode_responses=True,
        socket_connect_timeout=5,
        socket_timeout=5
    )
    
    try:
        # Test Redis connection
        await client.ping()
        print(f"Connected to Redis test DB {test_db}")
        
        # Clean up any existing test data
        await client.flushdb()
        
        yield client
        
    except redis.ConnectionError as e:
        pytest.skip(f"Redis not available for integration tests: {e}")
    except Exception as e:
        pytest.fail(f"Redis setup failed: {e}")
    finally:
        # Clean up test data
        try:
            await client.flushdb()
            await client.close()
        except Exception:
            pass  # Ignore cleanup errors


@pytest_asyncio.fixture
async def clean_test_redis(test_redis_client):
    """Clean Redis test database before each test."""
    await test_redis_client.flushdb()
    yield
    # Cleanup after test
    await test_redis_client.flushdb()


# Integration test markers
def pytest_configure(config):
    """Configure pytest markers."""
    config.addinivalue_line(
        "markers", "integration: mark test as integration test (requires Redis)"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running"
    )


def pytest_collection_modifyitems(config, items):
    """Automatically mark integration tests."""
    for item in items:
        if "test_integration" in str(item.fspath):
            item.add_marker(pytest.mark.integration)