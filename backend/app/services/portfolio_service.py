import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.portfolio import Portfolio


class PortfolioNotFoundError(Exception):
    pass


def create_portfolio(db: Session, user_id: uuid.UUID, name: str) -> Portfolio:
    portfolio = Portfolio(user_id=user_id, name=name)
    db.add(portfolio)
    db.commit()
    db.refresh(portfolio)
    return portfolio


def list_portfolios(db: Session, user_id: uuid.UUID) -> list[Portfolio]:
    return list(
        db.scalars(
            select(Portfolio).where(Portfolio.user_id == user_id).order_by(Portfolio.created_at)
        )
    )


def get_portfolio(db: Session, user_id: uuid.UUID, portfolio_id: uuid.UUID) -> Portfolio:
    portfolio = db.scalar(
        select(Portfolio).where(Portfolio.id == portfolio_id, Portfolio.user_id == user_id)
    )
    if portfolio is None:
        raise PortfolioNotFoundError(portfolio_id)
    return portfolio


def update_portfolio(db: Session, user_id: uuid.UUID, portfolio_id: uuid.UUID, name: str) -> Portfolio:
    portfolio = get_portfolio(db, user_id, portfolio_id)
    portfolio.name = name
    db.commit()
    db.refresh(portfolio)
    return portfolio


def delete_portfolio(db: Session, user_id: uuid.UUID, portfolio_id: uuid.UUID) -> None:
    portfolio = get_portfolio(db, user_id, portfolio_id)
    db.delete(portfolio)
    db.commit()
