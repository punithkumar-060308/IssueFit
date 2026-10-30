"""
conftest.py — configure anyio backend for tests that need it.
Route tests use TestClient (sync), so we do NOT mark them as async.
"""
import pytest


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"

