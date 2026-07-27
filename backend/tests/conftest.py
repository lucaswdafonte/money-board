import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

import app.models
from app.core.config import settings
from app.core.db import Base, get_db
from app.main import app

engine = create_engine(settings.database_url)


@pytest.fixture(scope="session", autouse=True)
def _schema() -> None:
    """Ensure tables exist; idempotent alongside Alembic-managed schemas."""
    Base.metadata.create_all(bind=engine)


@pytest.fixture()
def db_session():
    """A session bound to a savepoint that's rolled back after each test.

    Using create_savepoint join mode lets app code call db.commit() (as the
    real request flow does) without that commit escaping to the outer
    transaction — the whole test's writes still vanish on rollback.
    """
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db_session: Session):
    app.dependency_overrides[get_db] = lambda: db_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
