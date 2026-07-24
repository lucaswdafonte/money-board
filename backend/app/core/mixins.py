import uuid
from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column


class UserScopedMixin:
    """Mixin for every table that stores user-owned data.

    ARCHITECTURE.md mandates a user_id on all user-owned tables from the
    first migration, even while auth is single-user/hardcoded, so the
    schema doesn't need a disruptive retrofit when multi-tenancy (SaaS)
    lands. Every query against a table using this mixin MUST filter by
    user_id.
    """

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
