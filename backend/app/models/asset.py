import enum
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.core.mixins import UserScopedMixin

if TYPE_CHECKING:
    from app.models.portfolio import Portfolio


class AssetClass(str, enum.Enum):
    STOCK = "stock"
    FIXED_INCOME = "fixed_income"
    FUND = "fund"
    REAL_ESTATE = "real_estate"
    CRYPTO = "crypto"
    CASH = "cash"
    OTHER = "other"


class Asset(Base, UserScopedMixin):
    __tablename__ = "assets"
    __table_args__ = (UniqueConstraint("portfolio_id", "ticker", name="uq_assets_portfolio_ticker"),)

    portfolio_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False, index=True
    )
    ticker: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    asset_class: Mapped[AssetClass] = mapped_column(Enum(AssetClass, name="asset_class"), nullable=False)
    sector: Mapped[str | None] = mapped_column(String, nullable=True)
    country: Mapped[str | None] = mapped_column(String, nullable=True)
    currency: Mapped[str] = mapped_column(String, nullable=False)

    portfolio: Mapped["Portfolio"] = relationship(back_populates="assets")
