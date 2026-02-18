# Skill: full-gate-ci

## Purpose
Ensure CI security and quality gates.

## Triggers
- Creating new feature
- Merging to main
- Releasing

## Canonical References
- AGENTS.md
- SECURITY_CHECKLIST.md (CI section)

## Responsibilities
- Run Fast Gate on every PR
- Run Full Gate on main

## Implementation Steps
1. Fast Gate:
   - lint
   - typecheck
   - test
   - secret scan
2. Full Gate:
   - vulnerability scan
   - code scanning
   - webhook tests

## Required Artifacts
- .github/workflows/*.yml

## Verification
- CI passes
- No critical vulnerabilities
