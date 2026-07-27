from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.core.mixins import UserScopedMixin

if TYPE_CHECKING:
    from app.models.asset import Asset


class Portfolio(Base, UserScopedMixin):
    __tablename__ = "portfolios"

    name: Mapped[str] = mapped_column(String, nullable=False)

    assets: Mapped[list["Asset"]] = relationship(
        back_populates="portfolio", cascade="all, delete-orphan"
    )
