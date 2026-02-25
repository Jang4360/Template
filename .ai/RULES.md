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
- 결제 webhook 서명 검증 필수
- idempotency key로 이중 결제 방지
- 모든 테이블에 RLS 정책 적용
- raw SQL 금지, Supabase SDK만 사용

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
