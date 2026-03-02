# Project Rules (Must Read Before Any Task)

## 1. 기본 원칙
- 기술 스택: Next.js 14 App Router, Supabase, Toss Payments, Vercel
- TypeScript strict 모드 유지
- 모든 API 키는 환경변수로만 관리

## 2. DDD 구조 규칙
- 비즈니스 도메인 = 폴더명
- 도메인 간 직접 import 금지, `shared/` 통해 통신
- 새 기능은 해당 도메인 폴더 안에 생성

## 3. 코드 스타일
- 함수형 컴포넌트 + React Hooks
- 서버 컴포넌트 우선, 클라이언트는 `use client` 명시
- API 라우트는 `src/app/api/` 하위에 도메인별 정리

## 4. 보안 규칙

### 결제
- 결제 confirm 전에 반드시 서버 사이드에서 금액 검증 (DB amount vs callback amount)
- 주문 소유권 검증 필수 (orderId가 현재 사용자의 것인지)
- 멱등성은 DB 유니크 제약으로 강제 (애플리케이션 로직 의존 금지)
- 웹훅 원문(헤더 + 바디)을 반드시 저장 (분쟁/CS 증거)
- 웹훅 서명 검증 또는 결제 조회 API로 교차검증 필수
- 권한(entitlement)은 결제/구독 상태와 분리된 별도 테이블로 관리
- 결제 상태 머신 필수: READY → PENDING → DONE → CANCELLED/FAILED/EXPIRED
- confirm/환불 엔드포인트에 CSRF 방어 적용
- 자동결제는 결제 완료 웹훅을 안 보낼 수 있으므로 타입별 이벤트 분리 설계

### RLS
- 모든 테이블에 RLS 활성화 필수
- 4가지 operation(SELECT/INSERT/UPDATE/DELETE) 각각에 정책 명시
- UPDATE 정책에는 반드시 WITH CHECK 포함 (owner 변경 방지)
- auth.uid() IS NOT NULL을 모든 정책 조건에 포함
- RLS 조건 컬럼에 인덱스 필수 (full scan 방지)
- Security Definer 함수 내부에서도 auth.uid() 기반 필터 적용
- 클라이언트 코드에서 service_role 키 import 금지

### 인증
- Supabase Auth + Google OAuth만 사용
- 서버 사이드 세션 (SSR 호환)
- service_role 키는 서버에서만, 최소 범위로 사용
- raw SQL 금지, Supabase SDK만 사용

### 일반
- 모든 API 키와 시크릿은 환경변수로 관리 (.env 커밋 금지)
- 민감한 데이터(API 키 등)는 해싱 저장

## 5. AI 작업 규칙
- 한 번에 1-2개 파일만 수정
- 작업 완료 시 체크리스트 업데이트
- 보안 코드 수정 시 리뷰 요청
- 에러 처리 누락 시 즉시 추가

## 6. 네이밍 규칙
- 컴포넌트: PascalCase
- 함수/변수: camelCase
- 파일명: kebab-case
- 타입/인터페이스: PascalCase + 접두어 없음
- 상수: UPPER_SNAKE_CASE
