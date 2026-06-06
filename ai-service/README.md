# AI Service — Python Backend

A FastAPI microservice that provides **dynamic AI app generation** for the App Generator.

## Why Python?

| Feature | TypeScript (old) | Python (new) |
|---------|-----------------|--------------|
| AI provider calls | Static `fetch()` | Async `httpx` with retry |
| Output validation | Manual parsing | **Pydantic** strict schemas |
| Bad output handling | Return `null`, use template | **Re-prompt AI** with specific errors |
| Multi-turn refinement | ❌ | ✅ Up to 2 retry turns per provider |
| Framework extensibility | Hard | **LangChain / LangGraph ready** |

## Setup

### 1. Create a virtual environment

```bash
cd ai-service
python -m venv .venv

# Windows
.venv\Scripts\activate

# Mac/Linux
source .venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

The service reads API keys from the project root's `.env.local` or `.env`:

```env
AI_PROVIDER=groq          # groq | openai | anthropic | mistral
GROQ_API_KEY=gsk_...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
MISTRAL_API_KEY=...
```

### 4. Run the service

```bash
# Development (with hot-reload)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Production
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
```

### 5. Run smoke tests

```bash
python test_service.py
```

## How it works

```
Next.js Builder UI
      ↓
POST /api/apps/generate   (route.ts)
      ↓
POST http://localhost:8000/generate   ← Python microservice
      │
      ├── 1. Build prompt from template
      ├── 2. Call primary AI provider
      ├── 3. Validate response with Pydantic
      ├── 4. If invalid → re-prompt with specific issues (up to 2x)
      ├── 5. If provider fails → try next provider in chain
      └── 6. If all fail → return keyword-matched template
      ↓
Validated AppConfig JSON
      ↓
Next.js parses it with TypeScript parser (safety net)
      ↓
Saved to database / shown in Builder preview
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/health` | Service health + provider status |
| `POST` | `/generate` | Generate app config from prompt |

### POST /generate

**Request:**
```json
{ "prompt": "A CRM for managing customers and deals" }
```

**Response:**
```json
{
  "config": { ... },
  "meta": {
    "generationTimeMs": 3200,
    "entityCount": 2,
    "pageCount": 8
  }
}
```

## Adding LangChain (future)

The `generator.py` module is designed for easy extension. To add LangChain:

```bash
pip install langchain langchain-groq
```

Then replace `_call_provider()` with a LangChain chain that includes:
- `ConversationBufferMemory` for multi-turn context
- `PydanticOutputParser` for automatic schema validation
- `OutputFixingParser` for automatic error correction

## Fallback behavior

The Next.js route (`route.ts`) automatically falls back to the TypeScript provider chain if:
- The Python service is not running
- The Python service returns a non-200 response
- The request times out (90 seconds)

This means the app **always works** even without the Python service running.
