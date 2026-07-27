import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class PortfolioCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)


class PortfolioUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=200)


class PortfolioRead(BaseModel):
    id: uuid.UUID
    name: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
