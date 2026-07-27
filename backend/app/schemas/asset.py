import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.asset import AssetClass


class AssetCreate(BaseModel):
    ticker: str = Field(min_length=1, max_length=20)
    name: str = Field(min_length=1, max_length=200)
    asset_class: AssetClass
    sector: str | None = Field(default=None, max_length=100)
    country: str | None = Field(default=None, max_length=100)
    currency: str = Field(min_length=3, max_length=3, pattern=r"^[A-Z]{3}$")


class AssetUpdate(BaseModel):
    ticker: str | None = Field(default=None, min_length=1, max_length=20)
    name: str | None = Field(default=None, min_length=1, max_length=200)
    asset_class: AssetClass | None = None
    sector: str | None = Field(default=None, max_length=100)
    country: str | None = Field(default=None, max_length=100)
    currency: str | None = Field(default=None, min_length=3, max_length=3, pattern=r"^[A-Z]{3}$")


class AssetRead(BaseModel):
    id: uuid.UUID
    portfolio_id: uuid.UUID
    ticker: str
    name: str
    asset_class: AssetClass
    sector: str | None
    country: str | None
    currency: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
