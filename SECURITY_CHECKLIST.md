# Security Checklist v1 (Template)

## A. Secrets / Env
- [ ] service_role / Stripe secret / Toss secret는 **서버 전용 환경변수**에만 존재한다.
- [ ] 브라우저 번들에 secret이 포함되지 않도록 빌드 결과(Preview)에서 키워드 검색을 해본다.
- [ ] Vercel 환경(Preview/Production)별 키가 분리되어 있다.
- [ ] 로그에 access token, refresh token, paymentKey, 카드/개인정보가 출력되지 않는다.

## B. Supabase Auth / Session
- [ ] SSR은 `@supabase/ssr` + 쿠키 기반 세션으로 구성되어 있다. :contentReference[oaicite:21]{index=21}
- [ ] admin 라우트는 middleware + 서버 컴포넌트에서 모두 권한을 확인한다(이중 잠금).
- [ ] 세션 만료/갱신 시나리오(로그인 유지, 로그아웃, 토큰 만료)가 테스트되어 있다.

## C. RLS (DB가 최종 방어선)
- [ ] 모든 `public` 테이블은 RLS가 ON이다. :contentReference[oaicite:22]{index=22}
- [ ] 각 테이블에 대해 SELECT/INSERT/UPDATE/DELETE 정책이 모두 정의되어 있다(누락 없음).
- [ ] 정책에서 `auth.uid()`가 null일 수 있음을 고려해 명시적으로 인증 조건을 둔다. :contentReference[oaicite:23]{index=23}
- [ ] ownership 정책은 `owner_id = uid` + `WITH CHECK owner_id = uid`가 짝으로 존재한다.
- [ ] admin/support override 정책이 필요한 테이블만 최소로 열려 있다(deny by default).
- [ ] RLS에서 참조하는 컬럼(owner_id 등)에 인덱스가 있다(성능/DoS 방지).

## D. service_role 사용 규칙
- [ ] service_role은 웹훅/배치/서버 내부 조치에만 사용한다. :contentReference[oaicite:24]{index=24}
- [ ] “service_role인데 RLS 에러” 같은 상황을 피하기 위해 Authorization 헤더/클라이언트 초기화 방식을 점검한다. :contentReference[oaicite:25]{index=25}

## E. Webhook (결제/구독)
- [ ] Stripe webhook은 raw body로 서명 검증을 한다. :contentReference[oaicite:26]{index=26}
- [ ] Toss webhook은 `transmission-id`를 이벤트 키로 저장하고 멱등 처리한다. :contentReference[oaicite:27]{index=27}
- [ ] webhook 이벤트는 원문(payload/headers)을 DB에 저장한다(추적/감사).
- [ ] webhook 처리는 (provider,event_id) unique로 멱등성이 보장된다.
- [ ] webhook는 항상 “상태 변경 신호”로 취급하고, 필요 시 PG API 조회/승인 결과로 교차검증한다.
- [ ] webhook 재전송(retried-count) 시에도 안전하게 동작한다. :contentReference[oaicite:28]{index=28}

## F. Payment Confirm / Order Integrity
- [ ] Toss 결제 승인(confirm)은 서버에서만 수행한다. :contentReference[oaicite:29]{index=29}
- [ ] confirm 전에 내부 주문 DB의 amount와 리다이렉트 amount를 비교한다(불일치 즉시 차단).
- [ ] orderId는 추측 불가능한 방식(ULID/UUID)으로 생성한다.
- [ ] confirm/취소/환불 API는 멱등키(또는 unique constraint)로 중복 호출을 안전하게 처리한다.

## G. Admin Surface
- [ ] Admin UI는 기본적으로 read-only로 시작하고, write 기능은 최소 단위로 확장한다.
- [ ] Admin의 write 액션은 감사로그(audit log)를 남긴다(누가/언제/무엇을).
- [ ] Admin에서 사용자 입력(검색/필터)도 서버에서 검증한다.

## H. Dependency / CI Gate
- [ ] PR마다 lint/typecheck/test + secret scanning이 돈다. :contentReference[oaicite:30]{index=30}
- [ ] main/release에는 CodeQL(또는 동급 스캔)이 돈다. :contentReference[oaicite:31]{index=31}
- [ ] 보안 이슈가 있는 패키지 업데이트는 릴리스 노트/영향 범위를 확인하고 반영한다.

## I. Storage (사용 시)
- [ ] Storage 버킷/오브젝트 접근은 RLS 정책으로 제한한다. :contentReference[oaicite:32]{index=32}
