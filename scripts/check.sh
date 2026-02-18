#!/usr/bin/env bash
set -euo pipefail

echo "[check] lint"
pnpm lint

echo "[check] typecheck"
pnpm typecheck

echo "[check] test"
pnpm test

echo "[check] done"
