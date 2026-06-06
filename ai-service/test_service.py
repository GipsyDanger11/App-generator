#!/usr/bin/env python3
"""
Quick smoke test for the AI service — runs without starting the server.
Call: python test_service.py
"""
import asyncio
import sys
import os

# Add ai-service to path
sys.path.insert(0, os.path.dirname(__file__))

from config_schema import AppConfig, ensure_complete_app, is_usable_config
from generator import _extract_json, _fallback_for_prompt


def test_json_extraction():
    print("✓ Testing JSON extraction...")
    # Plain JSON
    raw = '{"name": "Test", "entities": [], "pages": []}'
    assert _extract_json(raw) is not None

    # Markdown fenced
    raw = '```json\n{"name": "Test"}\n```'
    assert _extract_json(raw) == {"name": "Test"}

    # Embedded JSON
    raw = 'Here is the config: {"name": "Test"}'
    assert _extract_json(raw) == {"name": "Test"}

    # Invalid
    assert _extract_json("not json at all") is None
    print("  All JSON extraction tests passed")


def test_pydantic_validation():
    print("✓ Testing Pydantic validation...")
    valid = {
        "name": "Test App",
        "entities": [{"name": "Item", "fields": [{"name": "title", "type": "string"}]}],
        "pages": [
            {"id": "home", "route": "/", "root": {"kind": "hero", "props": {"title": "Test"}}},
            {"id": "items", "route": "/items", "entity": "Item", "root": {"kind": "table", "props": {"entity": "Item"}}},
            {"id": "items-new", "route": "/items/new", "entity": "Item", "root": {"kind": "form", "props": {"entity": "Item", "mode": "create"}}},
        ],
    }
    cfg = AppConfig.model_validate(valid)
    assert cfg.name == "Test App"
    assert len(cfg.entities) == 1
    assert len(cfg.pages) == 3

    # Invalid field type gets coerced
    bad_field = {"name": "x", "type": "INVALID_TYPE"}
    from config_schema import FieldDef
    fd = FieldDef.model_validate(bad_field)
    assert fd.type == "string"  # coerced to default

    print("  All Pydantic validation tests passed")


def test_ensure_complete():
    print("✓ Testing ensure_complete_app...")
    # A config with just a hero page should get table+form pages added
    minimal = AppConfig.model_validate({
        "name": "Minimal App",
        "entities": [{"name": "Task", "fields": [{"name": "title", "type": "string"}]}],
        "pages": [{"id": "home", "route": "/", "root": {"kind": "hero", "props": {"title": "Hi"}}}],
    })
    completed = ensure_complete_app(minimal)
    page_kinds = [p.root.kind for p in completed.pages]
    assert "table" in page_kinds, f"No table page! Got: {page_kinds}"
    assert "form" in page_kinds, f"No form page! Got: {page_kinds}"
    assert "stats" in page_kinds, f"No stats page! Got: {page_kinds}"
    assert completed.theme is not None, "Theme should be set"
    assert is_usable_config(completed)
    print(f"  Completed: {len(completed.pages)} pages, theme={completed.theme.primary}")
    print("  All ensure_complete_app tests passed")


def test_fallback_templates():
    print("✓ Testing fallback templates...")
    for kw, expected_entity in [
        ("habit tracker app", "Habit"),
        ("crm for customers", "Customer"),
        ("task manager", "Task"),
        ("something random xyz", "Task"),  # default
    ]:
        cfg = _fallback_for_prompt(kw)
        completed = ensure_complete_app(cfg)
        assert is_usable_config(completed), f"Fallback for '{kw}' is not usable"
        page_kinds = [p.root.kind for p in completed.pages]
        assert "table" in page_kinds
        assert "form" in page_kinds
        print(f"  '{kw}' → '{completed.name}' ({len(completed.pages)} pages)")
    print("  All fallback template tests passed")


async def test_full_pipeline():
    """Test the full pipeline with a real AI call if keys are available."""
    from dotenv import load_dotenv
    from pathlib import Path
    env_path = Path(__file__).resolve().parent.parent / ".env.local"
    if env_path.exists():
        load_dotenv(env_path)
    else:
        load_dotenv(Path(__file__).resolve().parent.parent / ".env")

    has_any_key = any([
        os.getenv("GROQ_API_KEY"),
        os.getenv("OPENAI_API_KEY"),
        os.getenv("ANTHROPIC_API_KEY"),
        os.getenv("MISTRAL_API_KEY"),
    ])

    if not has_any_key:
        print("⚠ No API keys found — skipping live AI test")
        return

    print("✓ Testing live AI generation...")
    from generator import generate_config
    cfg = await generate_config("A simple todo list app with tasks and categories")
    assert is_usable_config(cfg), "Live config is not usable"
    print(f"  Generated: '{cfg.name}' with {len(cfg.entities)} entities, {len(cfg.pages)} pages")
    print("  Live AI test passed")


def main():
    print("\n=== AI Service Smoke Tests ===\n")
    try:
        test_json_extraction()
        test_pydantic_validation()
        test_ensure_complete()
        test_fallback_templates()
        asyncio.run(test_full_pipeline())
        print("\n✅ All tests passed!\n")
    except AssertionError as e:
        print(f"\n❌ Test FAILED: {e}\n")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}\n")
        import traceback; traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
