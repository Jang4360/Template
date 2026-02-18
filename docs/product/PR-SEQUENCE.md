# Admin/Auth/Payment PR Sequence (Worktree/PR Unit)

목표: PR 하나가 너무 커져서 “보안 검토가 불가능”해지는 걸 방지.
(각 PR은 “롤백 가능한 단위”로 자릅니다.)

## PR-00: Repo Baseline / Guardrails

### 내용
- pnpm workspace 세팅, eslint/tsconfig/환경변수 zod 스키마
- GitHub Actions: Fast Gate( lint/typecheck/test + gitleaks )
- docs 뼈대 + AGENTS.md 초안

### 산출
- “아무 기능 없어도 보안게이트는 돈다”

## PR-01: Supabase SSR Auth 기반(세션/쿠키)

### 내용
- packages/auth: createBrowserClient, createServerClient
- middleware.ts: 세션 refresh/쿠키 업데이트(표준 패턴)
- /login UI(최소)

### 수용 기준
- SSR 페이지에서 getUser()가 안정적으로 동작

## PR-02: Roles/Profiles 스키마 + RLS 기본틀

### 내용
- public.profiles(role) 생성
- helper 함수( is_admin, is_support )
- 핵심 테이블 1~2개에 ownership RLS 템플릿 적용

### 수용 기준
- auth.uid() null 케이스 고려
- RLS ON + 정책 누락 없음

## PR-03: Admin Shell(레이아웃/라우팅/가드)

### 내용
- packages/admin: admin 레이아웃, nav, 기본 페이지
- requireRole('admin'|'support') 서버 가드
- middleware에서도 /admin 차단(이중 잠금)

### 수용 기준
- 일반 user는 admin 진입 불가(서버에서 최종 차단)

## PR-04: Admin 기능 1개(“read-only 운영 기능”부터)

### 예시
- 유저 목록 조회(민감정보 제외)
- 결제 이벤트 조회(원문 payload는 admin만)

### 수용 기준
- 최소 권한 원칙(A01 방지 방향)

## PR-05: Billing DB 스키마(공통) + 상태 모델

### 내용
- billing_* 테이블 생성
- status enum 표준화
- billing_webhook_events unique(provider,event_id)

### 수용 기준
- 멱등/감사 가능(이벤트 원문 저장)

## PR-06: Toss “단건 결제” (Order → Confirm) 공통 구현

### 내용
- order 생성 API
- confirm API(서버) + amount/orderId 검증
- 토스 confirm은 10분 제한 고려

### 수용 기준
- 중복 confirm 호출에도 안전(멱등)
- 결제 성공/실패 상태가 DB에 일관되게 남음

## PR-07: Webhook 공통 파이프라인(멱등/저장/재처리)

### 내용
- /api/webhooks/toss, /api/webhooks/stripe
- 이벤트 저장 → 멱등 체크 → 상태 반영
- Toss는 transmission-id 저장
- Stripe는 raw body 서명 검증

### 수용 기준
- 동일 이벤트 10번 보내도 DB 상태 1번만 반영

## PR-08: Stripe 구독(옵션/2순위) + 제품별 플랜 맵핑

### 내용
- plan_key ↔ Stripe priceId 맵핑
- subscription webhook 처리(상태 변화)

### 수용 기준
- “플랜 변경/취소/연장”이 DB status로 안정 반영

## PR-09: Full Gate 확장(CodeQL 등) + Runbook 최소 작성

### 내용
- main/release에 CodeQL
- RUNBOOK에 “웹훅 실패/재처리/결제 불일치” 절차 추가

### 수용 기준
- 운영자가 “다음 행동”을 바로 할 수 있는 수준
