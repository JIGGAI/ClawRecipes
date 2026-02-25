#!/usr/bin/env python3
"""Add shared templates.tools/status/notes to built-in team recipes when missing.

These shared templates are used as fallback for per-role file scaffolding when role-specific
templates like lead.tools are absent.

This avoids having to duplicate boilerplate templates per role.
"""

from __future__ import annotations

import re
from pathlib import Path

TEMPLATES_BLOCK = (
    "  tools: |\n"
    "    # TOOLS.md\n"
    "\n"
    "    # Agent-local notes (paths, conventions, env quirks).\n"
    "\n"
    "  status: |\n"
    "    # STATUS.md\n"
    "\n"
    "    - (empty)\n"
    "\n"
    "  notes: |\n"
    "    # NOTES.md\n"
    "\n"
    "    - (empty)\n"
)


def has_key(md: str, key: str) -> bool:
    return re.search(rf"^\s{{2}}{re.escape(key)}:\s*\|\s*$", md, flags=re.M) is not None


def patch_file(path: Path) -> bool:
    md = path.read_text(encoding="utf-8")

    # Only patch team recipes with templates:
    m = re.search(r"^templates:\s*$", md, flags=re.M)
    if not m:
        return False

    changed = False
    need_any = False
    for k in ("tools", "status", "notes"):
        if not has_key(md, k):
            need_any = True

    if not need_any:
        return False

    # Insert the shared templates immediately after `templates:` line.
    insert_at = m.end()
    md2 = md[:insert_at] + "\n" + TEMPLATES_BLOCK + md[insert_at:]

    path.write_text(md2, encoding="utf-8")
    return True


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    recipe_dir = root / "recipes" / "default"

    targets = [
        "business-team.md",
        "clinic-team.md",
        "construction-team.md",
        "crypto-trader-team.md",
        "financial-planner-team.md",
        "law-firm-team.md",
    ]

    any_changed = False
    for name in targets:
        p = recipe_dir / name
        if not p.exists():
            continue
        if patch_file(p):
            print(f"patched: {name}")
            any_changed = True
        else:
            print(f"skip: {name}")

    return 0 if any_changed else 0


if __name__ == "__main__":
    raise SystemExit(main())
