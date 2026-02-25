# Conventions

## 코드 규칙
- TypeScript strict 모드를 유지한다.
- 함수형 컴포넌트와 React Hooks만 사용한다.
- 서버 컴포넌트를 우선하고, 클라이언트는 `use client`를 명시한다.

## 폴더/도메인 규칙
- 도메인별 기능은 해당 도메인 폴더에만 작성한다.
- 도메인 간 직접 import 금지, `shared/`를 통해 통신한다.
- API는 `src/app/api/` 하위에 도메인별로 구성한다.

## 보안 규칙
- 환경변수 외 API 키 하드코딩 금지
- 결제 웹훅 서명 검증 필수
- idempotency key로 중복 결제 방지
- 모든 테이블 RLS 정책 적용
- raw SQL 금지, Supabase SDK만 사용

## 작업 규칙
- 한 번에 1-2개 파일만 수정한다.
- 작업 완료 시 체크리스트를 업데이트한다.
- 보안 코드 수정 시 리뷰를 요청한다.
- 에러 처리 누락은 즉시 보완한다.

## 네이밍 규칙
- 컴포넌트: PascalCase
- 함수/변수: camelCase
- 파일명: kebab-case
- 타입/인터페이스: PascalCase + 접두어 없음
- 상수: UPPER_SNAKE_CASE
