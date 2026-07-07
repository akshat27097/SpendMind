import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from routes import analyze, forecast, train, summary


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs("saved_models", exist_ok=True)
    yield


app = FastAPI(title="SpendMind AI Engine", version="2.0.0", lifespan=lifespan)

_raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5000")
ALLOWED_ORIGINS = [o.strip() for o in _raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(train.router,    prefix="/train",    tags=["Training"])
app.include_router(analyze.router,  prefix="/analyze",  tags=["Analysis"])
app.include_router(forecast.router, prefix="/forecast", tags=["Forecast"])
app.include_router(summary.router,  prefix="/summary",  tags=["Summary"])


@app.get("/")
def health_check():
    return {"status": "ok", "service": "SpendMind AI Engine", "version": "1.0.0"}