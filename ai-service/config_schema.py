"""
Pydantic models that mirror the TypeScript AppConfig schema.
Used for strict validation of AI-generated configs — if the AI returns
something structurally wrong, Pydantic raises immediately instead of
letting garbage flow through.
"""

from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class FieldOption(BaseModel):
    value: str
    label: str


class FieldDef(BaseModel):
    name: str
    type: str = "string"
    label: str = ""
    required: bool = False
    unique: bool = False
    default: Optional[str] = None
    options: list[FieldOption] = Field(default_factory=list)
    entity: Optional[str] = None
    placeholder: str = ""
    helpText: str = ""
    showInList: bool = True
    sortable: bool = True
    searchable: bool = True

    @field_validator("type")
    @classmethod
    def validate_field_type(cls, v: str) -> str:
        allowed = {
            "string", "text", "number", "boolean", "date", "datetime",
            "email", "select", "multiselect", "relation", "json",
        }
        return v if v in allowed else "string"

    @field_validator("label", mode="before")
    @classmethod
    def default_label(cls, v, info):
        if not v and info.data.get("name"):
            return info.data["name"]
        return v or ""


class EntityDef(BaseModel):
    name: str
    label: str = ""
    labelPlural: str = ""
    fields: list[FieldDef] = Field(default_factory=list)
    defaultPage: Optional[str] = None

    @field_validator("label", mode="before")
    @classmethod
    def default_label(cls, v, info):
        return v or info.data.get("name", "")

    @field_validator("labelPlural", mode="before")
    @classmethod
    def default_label_plural(cls, v, info):
        name = info.data.get("name", "")
        return v or (f"{name}s" if name else "")


class StatsSource(BaseModel):
    entity: str
    op: str = "count"
    field: Optional[str] = None


class StatsItem(BaseModel):
    label: str
    source: StatsSource


class ComponentNode(BaseModel):
    id: Optional[str] = None
    kind: str
    props: dict = Field(default_factory=dict)
    children: list[ComponentNode] = Field(default_factory=list)

    @field_validator("kind")
    @classmethod
    def validate_kind(cls, v: str) -> str:
        allowed = {
            "hero", "heading", "text", "stats", "table", "form", "chart",
            "card", "button", "list", "iframe", "divider", "spacer",
            "kanban", "timeline",
        }
        if v not in allowed:
            raise ValueError(f"Unknown component kind: {v}")
        return v


class PageDef(BaseModel):
    id: str = ""
    route: str = "/"
    title: str = "Page"
    entity: Optional[str] = None
    layout: str = "default"
    root: ComponentNode

    @field_validator("route", mode="before")
    @classmethod
    def ensure_leading_slash(cls, v: str) -> str:
        v = v or "/"
        return v if v.startswith("/") else f"/{v}"


class ThemeDef(BaseModel):
    primary: Optional[str] = None
    accent: Optional[str] = None
    logoText: Optional[str] = None
    faviconEmoji: Optional[str] = None


class AppConfig(BaseModel):
    name: str = "Untitled app"
    description: str = ""
    theme: Optional[ThemeDef] = None
    entities: list[EntityDef] = Field(default_factory=list)
    pages: list[PageDef] = Field(default_factory=list)
    i18n: Optional[dict] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def is_usable_config(cfg: AppConfig) -> bool:
    """Check that a config has entities, at least one table, and one form."""
    if not cfg.entities:
        return False
    has_table = any(p.root.kind == "table" for p in cfg.pages)
    has_form = any(p.root.kind == "form" for p in cfg.pages)
    return has_table and has_form


def ensure_complete_app(cfg: AppConfig) -> AppConfig:
    """
    Fill in missing pages so every entity has a table + form page,
    and there's always a home hero + stats page.
    Mirrors the TypeScript `ensureCompleteApp` in parser.ts.
    """
    pages = list(cfg.pages)

    def has_route(route: str) -> bool:
        return any(p.route.lower() == route.lower() for p in pages)

    def has_table_for(entity_name: str) -> bool:
        return any(
            p.root.kind == "table"
            and (p.root.props.get("entity", "").lower() == entity_name.lower()
                 or (p.entity or "").lower() == entity_name.lower())
            for p in pages
        )

    def has_form_for(entity_name: str) -> bool:
        return any(
            p.root.kind == "form"
            and (p.root.props.get("entity", "").lower() == entity_name.lower()
                 or (p.entity or "").lower() == entity_name.lower())
            for p in pages
        )

    def slug_for(name: str) -> str:
        import re
        base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
        return base if base.endswith("s") else f"{base}s"

    # 1. Home page
    if not has_route("/"):
        pages.insert(0, PageDef(
            id="home", route="/", title=cfg.name,
            root=ComponentNode(kind="hero", props={
                "title": cfg.name,
                "subtitle": cfg.description or f"Manage your data with {cfg.name}.",
            }),
        ))

    # 2. Stats page on home
    has_stats = any(
        p.root.kind == "stats" or any(c.kind == "stats" for c in p.root.children)
        for p in pages
    )
    if not has_stats and cfg.entities:
        items = [
            {"label": f"Total {e.labelPlural or f'{e.name}s'}", "source": {"entity": e.name, "op": "count"}}
            for e in cfg.entities[:4]
        ]
        pages.append(PageDef(
            id="home-stats", route="/", title="Dashboard",
            root=ComponentNode(kind="stats", props={"items": items}),
        ))

    # 3. Table + form for every entity
    for e in cfg.entities:
        slug = slug_for(e.name)
        list_route = f"/{slug}"
        new_route = f"/{slug}/new"

        if not has_table_for(e.name):
            pages.append(PageDef(
                id=f"{slug}-list", route=list_route,
                title=e.labelPlural or f"{e.name}s", entity=e.name,
                root=ComponentNode(kind="table", props={"entity": e.name, "pageSize": 20}),
            ))

        if not has_form_for(e.name):
            pages.append(PageDef(
                id=f"{slug}-new", route=new_route,
                title=f"New {e.label or e.name}", entity=e.name,
                root=ComponentNode(kind="form", props={
                    "entity": e.name, "mode": "create", "successRoute": list_route,
                }),
            ))

    # 4. Ensure theme
    palette = [
        {"primary": "#7c3aed", "accent": "#a855f7"},
        {"primary": "#2563eb", "accent": "#60a5fa"},
        {"primary": "#059669", "accent": "#34d399"},
        {"primary": "#dc2626", "accent": "#f87171"},
        {"primary": "#d97706", "accent": "#fbbf24"},
        {"primary": "#0891b2", "accent": "#22d3ee"},
        {"primary": "#be185d", "accent": "#f472b6"},
        {"primary": "#7c3aed", "accent": "#818cf8"},
    ]
    idx = sum(ord(c) for c in cfg.name) % len(palette)
    default_theme = palette[idx]

    theme = ThemeDef(
        primary=cfg.theme.primary if cfg.theme and cfg.theme.primary else default_theme["primary"],
        accent=cfg.theme.accent if cfg.theme and cfg.theme.accent else default_theme["accent"],
        logoText=cfg.theme.logoText if cfg.theme and cfg.theme.logoText else cfg.name,
        faviconEmoji=cfg.theme.faviconEmoji if cfg.theme else None,
    )

    cfg_dict = cfg.model_dump()
    cfg_dict["pages"] = [p.model_dump() for p in pages]
    cfg_dict["theme"] = theme.model_dump(exclude_none=True)
    return AppConfig.model_validate(cfg_dict)
