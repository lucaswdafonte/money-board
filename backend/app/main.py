from fastapi import FastAPI

from app.api.routers import health

app = FastAPI(title="Money Board API")

app.include_router(health.router)
