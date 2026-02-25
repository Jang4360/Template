## 도메인 매칭 규칙

### Auth
- 키워드: auth, login, logout, session, oauth, google
- 의도: 인증/세션/접근 제어/프로필 연동
- 파일경로: `src/domains/auth/`, `src/app/api/auth/`, `src/lib/supabase/`
- 코드패턴: OAuth callback, 세션 검사, 보호 라우트

### Payment
- 키워드: payment, 결제, toss, confirm, webhook, refund
- 의도: 결제 승인/검증/취소/환불
- 파일경로: `src/domains/payment/`, `src/app/api/payment/`, `src/lib/toss-payments/`
- 코드패턴: 위젯/redirect/confirm/webhook

### CS
- 키워드: cs, 문의, support, ticket, attachment
- 의도: 문의 CRUD, 상태 관리, 첨부파일 처리
- 파일경로: `src/domains/cs/`, `src/app/api/cs/`, `src/shared/`
- 코드패턴: inquiry 생성/목록/상세/답변

### Backend
- 키워드: api, route, backend, server, transaction
- 의도: 서버 로직, 에러 처리, 인증 체크
- 파일경로: `src/app/api/`, `src/lib/supabase/`
- 코드패턴: try/catch, status code, session check
