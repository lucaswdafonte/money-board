import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.db import get_db
from app.models.asset import Asset
from app.models.user import User
from app.schemas.asset import AssetCreate, AssetRead, AssetUpdate
from app.services.asset_service import (
    AssetNotFoundError,
    DuplicateTickerError,
    create_asset,
    delete_asset,
    get_asset,
    list_assets,
    update_asset,
)
from app.services.portfolio_service import PortfolioNotFoundError

router = APIRouter(prefix="/portfolios/{portfolio_id}/assets", tags=["assets"])


def _portfolio_not_found() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")


def _asset_not_found() -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")


def _duplicate_ticker(ticker: str | None) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=f"Ticker '{ticker}' already registered in this portfolio",
    )


@router.post("", response_model=AssetRead, status_code=status.HTTP_201_CREATED)
def create(
    portfolio_id: uuid.UUID,
    payload: AssetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Asset:
    try:
        return create_asset(
            db,
            user_id=current_user.id,
            portfolio_id=portfolio_id,
            ticker=payload.ticker,
            name=payload.name,
            asset_class=payload.asset_class,
            currency=payload.currency,
            sector=payload.sector,
            country=payload.country,
        )
    except PortfolioNotFoundError as exc:
        raise _portfolio_not_found() from exc
    except DuplicateTickerError as exc:
        raise _duplicate_ticker(payload.ticker) from exc


@router.get("", response_model=list[AssetRead])
def list_all(
    portfolio_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Asset]:
    try:
        return list_assets(db, user_id=current_user.id, portfolio_id=portfolio_id)
    except PortfolioNotFoundError as exc:
        raise _portfolio_not_found() from exc


@router.get("/{asset_id}", response_model=AssetRead)
def get_one(
    portfolio_id: uuid.UUID,
    asset_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Asset:
    try:
        return get_asset(db, user_id=current_user.id, portfolio_id=portfolio_id, asset_id=asset_id)
    except AssetNotFoundError as exc:
        raise _asset_not_found() from exc


@router.patch("/{asset_id}", response_model=AssetRead)
def update(
    portfolio_id: uuid.UUID,
    asset_id: uuid.UUID,
    payload: AssetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Asset:
    updates = payload.model_dump(exclude_unset=True)
    try:
        return update_asset(
            db,
            user_id=current_user.id,
            portfolio_id=portfolio_id,
            asset_id=asset_id,
            updates=updates,
        )
    except AssetNotFoundError as exc:
        raise _asset_not_found() from exc
    except DuplicateTickerError as exc:
        raise _duplicate_ticker(updates.get("ticker")) from exc


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(
    portfolio_id: uuid.UUID,
    asset_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    try:
        delete_asset(db, user_id=current_user.id, portfolio_id=portfolio_id, asset_id=asset_id)
    except AssetNotFoundError as exc:
        raise _asset_not_found() from exc
