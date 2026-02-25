#!/usr/bin/env python3
"""Scan built-in team recipes for missing per-role templates referenced by files.

Rule:
- For team recipes, for each agent role R and each file entry with template T,
  the recipe must define templates["R.<T>"] OR a shared templates["<T>"] (team root).

We only warn; fixes should add minimal missing templates.
"""

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Any, Dict, List, Tuple

import yaml


def extract_frontmatter(md: str) -> str | None:
    md = md.lstrip("\ufeff")
    if not md.startswith("---"):
        return None
    # frontmatter ends at a line that is exactly ---
    m = re.search(r"^---\s*$", md, flags=re.M)
    if not m:
        return None
    start = md.find("---")
    # find second --- after the first line
    # locate first newline after initial ---
    first_nl = md.find("\n")
    if first_nl == -1:
        return None
    m2 = re.search(r"^---\s*$", md[first_nl + 1 :], flags=re.M)
    if not m2:
        return None
    end = first_nl + 1 + m2.start()
    return md[first_nl + 1 : end]


def load_recipe(path: Path) -> Dict[str, Any] | None:
    text = path.read_text(encoding="utf-8")
    fm = extract_frontmatter(text)
    if not fm:
        return None
    try:
        data = yaml.safe_load(fm) or {}
        if not isinstance(data, dict):
            return None
        return data
    except Exception as e:
        print(f"{path}: YAML parse error: {e}")
        return None


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    recipe_dir = root / "recipes" / "default"

    problems: List[Tuple[str, str, str]] = []  # recipe, role, missingKey

    for p in sorted(recipe_dir.glob("*-team.md")):
        data = load_recipe(p)
        if not data:
            continue
        if str(data.get("kind")) != "team":
            continue

        files = data.get("files") or []
        agents = data.get("agents") or []
        templates = data.get("templates") or {}

        if not isinstance(files, list) or not isinstance(agents, list) or not isinstance(templates, dict):
            continue

        file_templates: List[str] = []
        for f in files:
            if not isinstance(f, dict):
                continue
            t = f.get("template")
            if isinstance(t, str) and t.strip():
                file_templates.append(t.strip())

        roles: List[str] = []
        for a in agents:
            if not isinstance(a, dict):
                continue
            r = a.get("role")
            if isinstance(r, str) and r.strip():
                roles.append(r.strip())

        # For each role, ensure role-specific templates exist for every file template.
        for role in roles:
            for t in file_templates:
                # allow shared team-root templates like "agents" or "tools".
                shared_ok = t in templates
                role_key = f"{role}.{t}"
                if not shared_ok and role_key not in templates:
                    problems.append((p.name, role, role_key))

    if not problems:
        print("OK: no missing per-role templates found")
        return 0

    # print grouped output
    by_recipe: Dict[str, List[Tuple[str, str]]] = {}
    for recipe, role, key in problems:
        by_recipe.setdefault(recipe, []).append((role, key))

    for recipe, items in by_recipe.items():
        print(f"\n{recipe}")
        for role, key in sorted(items):
            print(f"  - role={role}: missing templates.{key}")

    print(f"\nTotal missing templates: {len(problems)}")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
