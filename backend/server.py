from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")


class FunnelStage(BaseModel):
    stage_name: str
    users: int
    avg_time_hours: float
    target_sla_hours: float


class FunnelData(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    revenue_per_activated_user: float
    stages: List[FunnelStage]
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class FunnelDataCreate(BaseModel):
    revenue_per_activated_user: float
    stages: List[FunnelStage]


class RecoveryAction(BaseModel):
    action_name: str
    expected_lift_percent: float


class RecoveryRequest(BaseModel):
    stage_index: int
    action: RecoveryAction
    current_users: int
    revenue_per_activated_user: float


@api_router.get("/")
async def root():
    return {"message": "ActivateFlow API"}


@api_router.post("/funnel", response_model=FunnelData)
async def save_funnel_data(input: FunnelDataCreate):
    funnel_obj = FunnelData(**input.model_dump())
    
    doc = funnel_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.funnel_data.insert_one(doc)
    return funnel_obj


@api_router.get("/funnel/latest", response_model=Optional[FunnelData])
async def get_latest_funnel():
    funnel = await db.funnel_data.find_one(
        {},
        {"_id": 0},
        sort=[("timestamp", -1)]
    )
    
    if not funnel:
        return None
    
    if isinstance(funnel['timestamp'], str):
        funnel['timestamp'] = datetime.fromisoformat(funnel['timestamp'])
    
    return funnel


@api_router.post("/recovery/calculate")
async def calculate_recovery(request: RecoveryRequest):
    lift_decimal = request.action.expected_lift_percent / 100
    recovered_users = int(request.current_users * lift_decimal)
    revenue_recovered = recovered_users * request.revenue_per_activated_user
    
    return {
        "recovered_users": recovered_users,
        "revenue_recovered": round(revenue_recovered, 2),
        "new_conversion_rate": round((request.current_users + recovered_users) / request.current_users * 100, 2) if request.current_users > 0 else 0
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()