# Skill: pr-sequencing-worktree

## Purpose
Enforce small, reviewable PR units.

## Triggers
- Large feature
- Auth/Admin/Billing change

## Responsibilities
- Slice into minimal PRs
- Follow PR-SEQUENCE.md

## Implementation Steps
1. Identify smallest atomic change.
2. Open worktree branch.
3. Link to checklist in PR description.
4. Run Fast Gate before request review.

## Required Artifacts
- docs/product/PR-SEQUENCE.md
- .github/PULL_REQUEST_TEMPLATE.md

## Verification
- Each PR remains rollbackable and reviewable
- PR scope maps to a single sequence stage
