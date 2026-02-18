# Skill: billing-toss-stripe

## Purpose
Implement payment and subscription logic with Toss (primary) and Stripe (secondary).

## Triggers
- Adding payment flow
- Implementing subscription
- Creating webhook endpoints

## Canonical References
- SECURITY_CHECKLIST.md (Webhook + Payment)
- AGENTS.md

## Responsibilities
- Enforce idempotency
- Store raw webhook payloads
- Validate order integrity

## Implementation Steps
1. Create billing tables:
   - billing_customers
   - billing_subscriptions
   - billing_payments
   - billing_webhook_events
2. Add unique(provider,event_id).
3. Insert webhook event first.
4. If conflict -> return 200.
5. If new -> process state inside transaction.
6. Validate payment confirm against DB amount.

## Required Artifacts
- packages/billing/*
- app/api/webhooks/*
- migrations/*.sql

## Verification
- Duplicate webhook does not duplicate effects
- Payment confirm mismatch is rejected
