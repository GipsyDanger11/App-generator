"""
FastAPI microservice for AI app generation.

Run with:  uvicorn main:app --host 0.0.0.0 --port 8000 --reload

The Next.js app calls POST /generate with {"prompt": "..."} and receives
back {"config": {...}} with a validated AppConfig.
"""

from __future__ import annotations

import logging
import os
import time
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from config_schema import AppConfig
from generator import generate_config

# Load .env from the project root (one level up from ai-service/)
env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    load_dotenv(env_path)
else:
    # Also try .env.local (Next.js convention)
    env_local = Path(__file__).resolve().parent.parent / ".env.local"
    if env_local.exists():
        load_dotenv(env_local)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("ai-service")

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="AI App Generator Service",
    description="Dynamic AI-powered app configuration generator",
    version="1.0.0",
)

# Allow Next.js dev server to call us
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        os.getenv("NEXTJS_URL", "http://localhost:3000"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class GenerateRequest(BaseModel):
    prompt: str


class GenerateResponse(BaseModel):
    config: dict
    meta: dict = {}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    """Health check for monitoring."""
    return {
        "status": "ok",
        "service": "ai-generator",
        "version": "1.0.0",
        "providers": {
            "groq": bool(os.getenv("GROQ_API_KEY")),
            "openai": bool(os.getenv("OPENAI_API_KEY")),
            "anthropic": bool(os.getenv("ANTHROPIC_API_KEY")),
            "mistral": bool(os.getenv("MISTRAL_API_KEY")),
        },
    }


@app.post("/generate", response_model=GenerateResponse)
async def generate(req: GenerateRequest):
    """
    Generate an AppConfig from a natural language prompt.
    Uses multi-provider AI with iterative refinement and Pydantic validation.
    """
    prompt = req.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="prompt is required")

    logger.info(f"Generate request: {prompt[:100]}...")
    start = time.time()

    try:
        config: AppConfig = await generate_config(prompt)
    except Exception as e:
        logger.error(f"Generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

    elapsed = time.time() - start
    logger.info(
        f"Generated '{config.name}' in {elapsed:.1f}s | "
        f"{len(config.entities)} entities, {len(config.pages)} pages"
    )

    return GenerateResponse(
        config=config.model_dump(exclude_none=True),
        meta={
            "generationTimeMs": int(elapsed * 1000),
            "entityCount": len(config.entities),
            "pageCount": len(config.pages),
        },
    )


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def startup():
    logger.info("=" * 60)
    logger.info("AI App Generator Service starting...")
    logger.info(f"Primary provider: {os.getenv('AI_PROVIDER', 'groq')}")
    for name, env_key in [("Groq", "GROQ_API_KEY"), ("OpenAI", "OPENAI_API_KEY"),
                           ("Anthropic", "ANTHROPIC_API_KEY"), ("Mistral", "MISTRAL_API_KEY")]:
        has_key = bool(os.getenv(env_key))
        logger.info(f"  {name}: {'✓ configured' if has_key else '✗ not configured'}")
    logger.info("=" * 60)
