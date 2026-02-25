# Architecture Overview

## 1. 기술 스택 상세
- Frontend: Next.js 14+ App Router + Tailwind CSS
- Backend: Next.js API Routes + Supabase Edge Functions
- Database: Supabase PostgreSQL + RLS
- Auth: Supabase Auth (Google OAuth)
- Payment: Toss Payments
- Deploy: Vercel

## 2. 데이터 흐름 다이어그램 (텍스트)
사용자 -> Next.js -> Supabase Auth -> PostgreSQL (RLS)  
             -> Toss Payments API -> Webhook -> DB

## 3. 핵심 도메인 관계
- Auth -> User Profile
- Auth -> Payment -> 구독 상태 -> Feature Access
- Auth -> CS -> 문의 생성 -> 관리자 대시보드

## 4. 환경 구성
- development: 로컬 Supabase + Toss 테스트 키
- staging: Supabase staging + Toss 테스트 키
- production: Supabase prod + Toss 실제 키

## 5. API 엔드포인트 목록 (초안)
- Auth: POST /api/auth/callback, GET /api/auth/session
- Payment: POST /api/payment/confirm, POST /api/payment/webhook, POST /api/payment/refund
- CS: POST /api/cs/inquiry, GET /api/cs/inquiries, PATCH /api/cs/inquiry/[id]
