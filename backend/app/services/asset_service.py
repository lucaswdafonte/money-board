import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.asset import Asset, AssetClass
from app.services.portfolio_service import get_portfolio


class AssetNotFoundError(Exception):
    pass


class DuplicateTickerError(Exception):
    pass


def create_asset(
    db: Session,
    user_id: uuid.UUID,
    portfolio_id: uuid.UUID,
    ticker: str,
    name: str,
    asset_class: AssetClass,
    currency: str,
    sector: str | None = None,
    country: str | None = None,
) -> Asset:
    get_portfolio(db, user_id, portfolio_id)

    asset = Asset(
        user_id=user_id,
        portfolio_id=portfolio_id,
        ticker=ticker,
        name=name,
        asset_class=asset_class,
        sector=sector,
        country=country,
        currency=currency,
    )
    db.add(asset)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise DuplicateTickerError(ticker) from exc
    db.refresh(asset)
    return asset


def list_assets(db: Session, user_id: uuid.UUID, portfolio_id: uuid.UUID) -> list[Asset]:
    get_portfolio(db, user_id, portfolio_id)
    return list(
        db.scalars(
            select(Asset)
            .where(Asset.portfolio_id == portfolio_id, Asset.user_id == user_id)
            .order_by(Asset.created_at)
        )
    )


def get_asset(db: Session, user_id: uuid.UUID, portfolio_id: uuid.UUID, asset_id: uuid.UUID) -> Asset:
    asset = db.scalar(
        select(Asset).where(
            Asset.id == asset_id, Asset.portfolio_id == portfolio_id, Asset.user_id == user_id
        )
    )
    if asset is None:
        raise AssetNotFoundError(asset_id)
    return asset


def update_asset(
    db: Session,
    user_id: uuid.UUID,
    portfolio_id: uuid.UUID,
    asset_id: uuid.UUID,
    updates: dict[str, Any],
) -> Asset:
    asset = get_asset(db, user_id, portfolio_id, asset_id)
    for field, value in updates.items():
        setattr(asset, field, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise DuplicateTickerError(updates.get("ticker")) from exc
    db.refresh(asset)
    return asset


def delete_asset(db: Session, user_id: uuid.UUID, portfolio_id: uuid.UUID, asset_id: uuid.UUID) -> None:
    asset = get_asset(db, user_id, portfolio_id, asset_id)
    db.delete(asset)
    db.commit()
