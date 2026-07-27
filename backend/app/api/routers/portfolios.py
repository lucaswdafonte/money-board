import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.db import get_db
from app.models.portfolio import Portfolio
from app.models.user import User
from app.schemas.portfolio import PortfolioCreate, PortfolioRead, PortfolioUpdate
from app.services.portfolio_service import (
    PortfolioNotFoundError,
    create_portfolio,
    delete_portfolio,
    get_portfolio,
    list_portfolios,
    update_portfolio,
)

router = APIRouter(prefix="/portfolios", tags=["portfolios"])


@router.post("", response_model=PortfolioRead, status_code=status.HTTP_201_CREATED)
def create(
    payload: PortfolioCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Portfolio:
    return create_portfolio(db, user_id=current_user.id, name=payload.name)


@router.get("", response_model=list[PortfolioRead])
def list_all(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Portfolio]:
    return list_portfolios(db, user_id=current_user.id)


@router.get("/{portfolio_id}", response_model=PortfolioRead)
def get_one(
    portfolio_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Portfolio:
    try:
        return get_portfolio(db, user_id=current_user.id, portfolio_id=portfolio_id)
    except PortfolioNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found"
        ) from exc


@router.patch("/{portfolio_id}", response_model=PortfolioRead)
def update(
    portfolio_id: uuid.UUID,
    payload: PortfolioUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Portfolio:
    try:
        return update_portfolio(
            db, user_id=current_user.id, portfolio_id=portfolio_id, name=payload.name
        )
    except PortfolioNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found"
        ) from exc


@router.delete("/{portfolio_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(
    portfolio_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    try:
        delete_portfolio(db, user_id=current_user.id, portfolio_id=portfolio_id)
    except PortfolioNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found"
        ) from exc
