# Skill: security-headers-csp

## Purpose
Apply secure HTTP headers and Content Security Policy.

## Triggers
- Deploying to Vercel
- Introducing third-party scripts
- Hardening production

## Canonical References
- SECURITY_CHECKLIST.md

## Responsibilities
- Configure CSP (Report-Only first)
- Add security headers

## Implementation Steps
1. Configure next.config headers.
2. Add CSP header.
3. Use Report-Only mode initially.
4. Monitor violations.

## Required Artifacts
- next.config.js

## Verification
- Headers visible in response
- No critical CSP violations
