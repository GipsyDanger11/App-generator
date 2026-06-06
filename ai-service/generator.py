"""
Multi-provider AI generator with dynamic capabilities.

Key advantages over the TypeScript version:
- Pydantic validation catches structural errors immediately
- Iterative refinement: if the AI returns incomplete config, we re-prompt
- Async httpx for non-blocking provider calls
- Easy to extend with LangChain/agents later
"""

from __future__ import annotations

import json
import os
import re
import time
import logging
from typing import Optional

import httpx

from config_schema import AppConfig, is_usable_config, ensure_complete_app
from prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE, REFINEMENT_PROMPT

logger = logging.getLogger("ai-generator")

# ---------------------------------------------------------------------------
# Provider registry
# ---------------------------------------------------------------------------

PROVIDERS = ("groq", "openai", "anthropic", "mistral")

PROVIDER_DEFAULTS = {
    "groq":      {"model": "llama-3.3-70b-versatile",     "url": "https://api.groq.com/openai/v1/chat/completions"},
    "openai":    {"model": "gpt-4o-mini",                 "url": "https://api.openai.com/v1/chat/completions"},
    "anthropic": {"model": "claude-3-5-sonnet-latest",    "url": "https://api.anthropic.com/v1/messages"},
    "mistral":   {"model": "mistral-large-latest",        "url": "https://api.mistral.ai/v1/chat/completions"},
}

ENV_KEY_MAP = {
    "groq":      "GROQ_API_KEY",
    "openai":    "OPENAI_API_KEY",
    "anthropic": "ANTHROPIC_API_KEY",
    "mistral":   "MISTRAL_API_KEY",
}

ENV_MODEL_MAP = {
    "groq":      "GROQ_MODEL",
    "openai":    "OPENAI_MODEL",
    "anthropic": "ANTHROPIC_MODEL",
    "mistral":   "MISTRAL_MODEL",
}


def _get_api_key(provider: str) -> Optional[str]:
    return os.getenv(ENV_KEY_MAP.get(provider, ""))


def _get_model(provider: str) -> str:
    env_model = os.getenv(ENV_MODEL_MAP.get(provider, ""), "")
    return env_model or PROVIDER_DEFAULTS[provider]["model"]


def _get_primary_provider() -> str:
    p = os.getenv("AI_PROVIDER", "groq").lower()
    return p if p in PROVIDERS else "groq"


def _build_provider_chain() -> list[str]:
    """Primary provider first, then any other provider that has an API key."""
    primary = _get_primary_provider()
    chain = [primary]
    for p in PROVIDERS:
        if p != primary and _get_api_key(p):
            chain.append(p)
    return chain


# ---------------------------------------------------------------------------
# JSON extraction
# ---------------------------------------------------------------------------

def _extract_json(content: str) -> Optional[dict]:
    """Attempt to pull a JSON object from potentially messy AI output."""
    content = content.strip()
    # Strip markdown fences
    content = re.sub(r"^```(?:json)?\s*", "", content)
    content = re.sub(r"\s*```\s*$", "", content)
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass
    # Try to find the first { ... } block
    m = re.search(r"\{[\s\S]*\}", content)
    if m:
        try:
            return json.loads(m.group(0))
        except json.JSONDecodeError:
            pass
    return None


# ---------------------------------------------------------------------------
# Provider call functions
# ---------------------------------------------------------------------------

async def _call_openai_compatible(
    client: httpx.AsyncClient,
    api_key: str,
    url: str,
    model: str,
    messages: list[dict],
) -> Optional[str]:
    """Call OpenAI-compatible endpoints (Groq, OpenAI, Mistral)."""
    resp = await client.post(
        url,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        json={
            "model": model,
            "messages": messages,
            "response_format": {"type": "json_object"},
            "temperature": 0.3,
            "max_tokens": 4096,
        },
        timeout=60.0,
    )
    if resp.status_code != 200:
        logger.error(f"Provider returned HTTP {resp.status_code}: {resp.text[:300]}")
        return None
    data = resp.json()
    return data.get("choices", [{}])[0].get("message", {}).get("content")


async def _call_anthropic(
    client: httpx.AsyncClient,
    api_key: str,
    model: str,
    messages: list[dict],
    system: str,
) -> Optional[str]:
    """Call Anthropic Messages API."""
    resp = await client.post(
        PROVIDER_DEFAULTS["anthropic"]["url"],
        headers={
            "Content-Type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
        },
        json={
            "model": model,
            "max_tokens": 4096,
            "system": system,
            "messages": messages,
            "temperature": 0.3,
        },
        timeout=60.0,
    )
    if resp.status_code != 200:
        logger.error(f"Anthropic returned HTTP {resp.status_code}: {resp.text[:300]}")
        return None
    data = resp.json()
    return (data.get("content") or [{}])[0].get("text", "")


async def _call_provider(
    client: httpx.AsyncClient,
    provider: str,
    messages: list[dict],
    system_prompt: str,
) -> Optional[str]:
    """Dispatch to the correct provider."""
    api_key = _get_api_key(provider)
    if not api_key:
        logger.warning(f"No API key for {provider}, skipping")
        return None

    model = _get_model(provider)
    url = PROVIDER_DEFAULTS[provider]["url"]

    logger.info(f"Calling {provider} ({model})...")
    start = time.time()

    try:
        if provider == "anthropic":
            # Anthropic uses a different API shape
            user_messages = [m for m in messages if m["role"] != "system"]
            raw = await _call_anthropic(client, api_key, model, user_messages, system_prompt)
        else:
            full_messages = [{"role": "system", "content": system_prompt}] + [
                m for m in messages if m["role"] != "system"
            ]
            raw = await _call_openai_compatible(client, api_key, url, model, full_messages)
    except Exception as e:
        logger.error(f"Provider {provider} exception: {e}")
        return None

    elapsed = time.time() - start
    logger.info(f"{provider} responded in {elapsed:.1f}s")
    return raw


# ---------------------------------------------------------------------------
# Core generation with iterative refinement
# ---------------------------------------------------------------------------

async def _try_provider(
    client: httpx.AsyncClient,
    provider: str,
    prompt: str,
    max_retries: int = 2,
) -> Optional[AppConfig]:
    """
    Try a single provider with iterative refinement.
    If the first response is invalid, re-prompt with specific issues.
    This is the KEY advantage of the Python approach — dynamic multi-turn.
    """
    user_content = USER_PROMPT_TEMPLATE.format(prompt=prompt)
    messages = [{"role": "user", "content": user_content}]

    for attempt in range(1, max_retries + 1):
        raw_text = await _call_provider(client, provider, messages, SYSTEM_PROMPT)
        if not raw_text:
            return None

        raw_json = _extract_json(raw_text)
        if not raw_json:
            logger.warning(f"[{provider}] Attempt {attempt}: could not extract JSON")
            # Ask for a fix
            messages.append({"role": "assistant", "content": raw_text})
            messages.append({"role": "user", "content": REFINEMENT_PROMPT.format(
                issues="The response was not valid JSON. Return ONLY a JSON object."
            )})
            continue

        # Validate with Pydantic
        try:
            cfg = AppConfig.model_validate(raw_json)
        except Exception as e:
            logger.warning(f"[{provider}] Attempt {attempt}: Pydantic validation failed: {e}")
            messages.append({"role": "assistant", "content": raw_text})
            messages.append({"role": "user", "content": REFINEMENT_PROMPT.format(
                issues=f"Pydantic validation error: {e}"
            )})
            continue

        # Ensure complete app (add missing pages)
        cfg = ensure_complete_app(cfg)

        # Check usability
        if is_usable_config(cfg):
            logger.info(
                f"[{provider}] Success on attempt {attempt}: "
                f"{len(cfg.entities)} entities, {len(cfg.pages)} pages"
            )
            return cfg

        # Not usable — build issue list and re-prompt
        issues = []
        if not cfg.entities:
            issues.append("No entities defined.")
        if not any(p.root.kind == "table" for p in cfg.pages):
            issues.append("No table pages found.")
        if not any(p.root.kind == "form" for p in cfg.pages):
            issues.append("No form pages found.")

        logger.warning(f"[{provider}] Attempt {attempt}: config not usable: {issues}")
        messages.append({"role": "assistant", "content": raw_text})
        messages.append({"role": "user", "content": REFINEMENT_PROMPT.format(
            issues="\n".join(f"- {i}" for i in issues)
        )})

    return None


async def generate_config(prompt: str) -> AppConfig:
    """
    Main entry point. Tries providers in chain order with iterative refinement.
    Falls back to a simple template if everything fails.
    """
    chain = _build_provider_chain()
    logger.info(f"Generation started | chain={chain} | prompt={prompt[:100]}...")

    async with httpx.AsyncClient() as client:
        for i, provider in enumerate(chain):
            logger.info(f"Trying provider {i+1}/{len(chain)}: {provider}")
            result = await _try_provider(client, provider, prompt)
            if result:
                return result
            if i < len(chain) - 1:
                logger.warning(f"Falling back from {provider} to {chain[i+1]}")

    # All providers failed — return a generic fallback
    logger.warning("All providers failed, using fallback template")
    return _fallback_for_prompt(prompt)


# ---------------------------------------------------------------------------
# Template fallback (mirrors TypeScript fallbackForPrompt)
# ---------------------------------------------------------------------------

_FALLBACK_TEMPLATES: dict[str, dict] = {
    "habit": {
        "name": "Habit Tracker", "description": "Track daily habits and build streaks",
        "entities": [
            {"name": "Habit", "label": "Habit", "labelPlural": "Habits", "fields": [
                {"name": "name", "type": "string", "label": "Name", "required": True},
                {"name": "category", "type": "select", "label": "Category", "options": [
                    {"value": "health", "label": "Health"}, {"value": "productivity", "label": "Productivity"},
                    {"value": "learning", "label": "Learning"}, {"value": "fitness", "label": "Fitness"},
                ]},
                {"name": "frequency", "type": "select", "label": "Frequency", "options": [
                    {"value": "daily", "label": "Daily"}, {"value": "weekly", "label": "Weekly"},
                ]},
                {"name": "streak", "type": "number", "label": "Current Streak"},
                {"name": "active", "type": "boolean", "label": "Active"},
            ]},
        ],
        "pages": [],
    },
    "crm": {
        "name": "Simple CRM", "description": "Manage customers and deals",
        "entities": [
            {"name": "Customer", "label": "Customer", "labelPlural": "Customers", "fields": [
                {"name": "name", "type": "string", "label": "Name", "required": True},
                {"name": "email", "type": "email", "label": "Email"},
                {"name": "company", "type": "string", "label": "Company"},
                {"name": "status", "type": "select", "label": "Status", "options": [
                    {"value": "lead", "label": "Lead"}, {"value": "active", "label": "Active"},
                    {"value": "churned", "label": "Churned"},
                ]},
            ]},
            {"name": "Deal", "label": "Deal", "labelPlural": "Deals", "fields": [
                {"name": "title", "type": "string", "label": "Title", "required": True},
                {"name": "amount", "type": "number", "label": "Amount"},
                {"name": "stage", "type": "select", "label": "Stage", "options": [
                    {"value": "prospect", "label": "Prospect"}, {"value": "negotiation", "label": "Negotiation"},
                    {"value": "won", "label": "Won"}, {"value": "lost", "label": "Lost"},
                ]},
                {"name": "customer", "type": "relation", "label": "Customer", "entity": "Customer"},
            ]},
        ],
        "pages": [],
    },
    "tasks": {
        "name": "Task Manager", "description": "Manage tasks and projects",
        "entities": [
            {"name": "Task", "label": "Task", "labelPlural": "Tasks", "fields": [
                {"name": "title", "type": "string", "label": "Title", "required": True},
                {"name": "description", "type": "text", "label": "Description"},
                {"name": "status", "type": "select", "label": "Status", "options": [
                    {"value": "todo", "label": "To Do"}, {"value": "doing", "label": "In Progress"},
                    {"value": "done", "label": "Done"},
                ]},
                {"name": "priority", "type": "select", "label": "Priority", "options": [
                    {"value": "low", "label": "Low"}, {"value": "medium", "label": "Medium"},
                    {"value": "high", "label": "High"},
                ]},
                {"name": "dueDate", "type": "date", "label": "Due Date"},
            ]},
        ],
        "pages": [],
    },
}

_KEYWORD_MAP = {
    "habit":     "habit",
    "crm":       "crm",
    "customer":  "crm",
    "deal":      "crm",
    "sales":     "crm",
    "task":      "tasks",
    "todo":      "tasks",
    "project":   "tasks",
    "management":"tasks",
}


def _fallback_for_prompt(prompt: str) -> AppConfig:
    """Pick a template based on keywords, validate, and ensure completeness."""
    p = prompt.lower()
    template_key = "tasks"  # default
    for keyword, key in _KEYWORD_MAP.items():
        if keyword in p:
            template_key = key
            break

    raw = _FALLBACK_TEMPLATES[template_key]
    cfg = AppConfig.model_validate(raw)
    return ensure_complete_app(cfg)
