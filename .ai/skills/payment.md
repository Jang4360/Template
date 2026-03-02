## 1. 활성화 조건
- 키워드: payment, 결제, 토스, Toss, webhook, refund, confirm, 승인
- 의도: 결제 승인/검증/환불/취소 플로우 구현
- 작업 위치: `src/domains/payment/`, `src/app/api/payment/`, `src/lib/toss-payments/`
- 코드 패턴: 결제 위젯/리다이렉트/confirm API/웹훅 처리

## 2. 결제 흐름 상세 (Toss Payments)

#### 클라이언트
- 결제창 띄우기 (토스 위젯 또는 리다이렉트)
- 성공 URL에서 서버 confirm API 호출

#### 서버 (Route Handler) — confirm 흐름
1. 로그인 사용자 확인 (세션 검증)
2. 내 DB에서 주문(order) 조회
3. amount 일치 검증 (콜백 amount vs DB 주문 amount)
4. 멱등 락 확보 (DB 유니크 제약으로 강제)
5. 토스 승인 API 호출
6. DB에 결제 확정 + 권한(entitlement) 반영

#### 웹훅 (Route Handler) — 비동기 상태 보정
1. 이벤트 원문 저장 (원문 + 헤더 포함)
2. `transmission-id` 기반 멱등 처리
3. 필요 시 "결제 조회 API"로 교차검증 후 DB 상태 보정

#### 운영 루프
- 성공 URL에서 confirm을 빠르게 호출
- 실패/지연 시 웹훅 또는 조회 API로 복구
- 권한(entitlement)은 결제/구독 상태가 아닌 별도의 최종 결과 테이블로 결정

### 멱등성 구현 — DB 유니크 제약으로 강제

멱등은 애플리케이션 로직이 아니라 DB 제약으로 강제한다:

| 대상 | 유니크 제약 |
|------|-----------|
| Webhook | `billing_webhook_events(provider, event_id)` UNIQUE |
| Confirm | `billing_payments(provider, provider_payment_key)` UNIQUE |
| Refund | `billing_refunds(provider, provider_refund_id)` UNIQUE |
| Entitlement | `entitlements(user_id, plan_key)` UNIQUE + upsert |

### 토스페이먼츠 승인(Confirm) 서버 검증 체크리스트

confirm 코드를 작성하거나 리뷰할 때 반드시 확인:

- [ ] confirm 전에 내 DB 주문 금액과 callback amount를 비교하는가?
- [ ] 멱등성이 DB 유니크 제약으로 강제되는가?
- [ ] 승인 API 호출이 서버에서만 일어나는가? (클라이언트에서 직접 호출 금지)
- [ ] 성공/실패/중복 호출 시 상태가 항상 동일한 최종 상태로 수렴하는가?
- [ ] 주문 소유권 검증: orderId가 현재 로그인 사용자의 것인지 확인하는가?

### 웹훅 처리 체크리스트

- [ ] DB에 원문 먼저 저장 + unique(provider, event_id)로 멱등 처리
- [ ] 재전송은 정상: retried-count 헤더가 존재함을 인지
- [ ] transmission-id를 이벤트 고유 키로 사용
- [ ] 자동결제는 결제 완료 웹훅을 안 보낼 수 있음
  → 토스 문서에 자동결제는 완료 시 웹훅을 전송하지 않는다고 명시
  → 결제 타입별로 어떤 이벤트가 오는지 분리 설계 필요
- [ ] 이벤트 원문(JSON) + 헤더를 반드시 저장 (분쟁/CS 시 증거)

### 놓치기 쉬운 결제 취약점 체크리스트

코드 리뷰 시 반드시 확인:

- [ ] amount 검증 누락
  → 성공 URL로 들어온 amount를 그대로 신뢰하면 금액 조작 가능

- [ ] 주문 소유권 검증 누락
  → orderId가 다른 유저 것인데도 confirm 처리되는 경우

- [ ] 멱등성 없음
  → 웹훅/confirm 중복 호출에 결제/권한이 중복 반영

- [ ] 웹훅 위조 대비 부족
  → 서명/교차검증 없이 웹훅 받으면 paid 처리되는 경우

- [ ] 상태 머신 부재
  → paid/failed만 두고 예외 케이스(만료/재시도/환불)가 운영에서 폭발
  → 최소 상태: READY → PENDING → DONE → CANCELLED / FAILED / EXPIRED

- [ ] 원문 저장 없음
  → 분쟁/CS 시 로그·증거가 없어 역추적 불가

- [ ] 비동기/timeout 고려 부족
  → 서버리스 환경에서 긴 처리(외부 API 다수 호출)로 실패율 증가
  → Vercel Serverless Function 기본 10초 타임아웃 주의

- [ ] CSRF 방어 누락
  → 세션 쿠키 기반 API + 상태 변경 엔드포인트에서 빠뜨리기 쉬움
  → confirm/환불 엔드포인트에 SameSite/Origin 검증/CSRF 토큰 적용

### 권한(Entitlement) 설계 원칙

결제 상태와 사용자 권한을 직접 연결하지 않는다:
모든 상태 전이는 DB에 기록하고, 잘못된 전이(예: DONE → READY)는 애플리케이션에서 차단한다.

## 3. 보안 체크리스트
- [ ] 결제 금액 서버 검증
- [ ] 주문 소유권 검증
- [ ] DB 유니크 제약 기반 멱등 처리
- [ ] webhook 서명/교차검증 적용
- [ ] 이벤트 원문(JSON + 헤더) 저장
- [ ] API 키는 환경변수만 사용

## 4. 코드 템플릿
### 코드 템플릿 — confirm API
```typescript
// src/domains/payment/api/confirm-payment.ts
export async function confirmPayment(
  userId: string,
  paymentKey: string,
  orderId: string,
  amount: number
) {
  // 1. 주문 조회 + 소유권 검증
  const order = await getOrder(orderId);
  if (!order) throw new OrderNotFoundError();
  if (order.userId !== userId) throw new OrderOwnershipError();

  // 2. 금액 검증 (콜백 amount vs DB amount)
  if (order.amount !== amount) throw new AmountMismatchError();

  // 3. 멱등성 체크 (DB 유니크 제약으로 강제)
  const existing = await getPaymentByProviderKey("toss", paymentKey);
  if (existing?.status === "DONE") return existing; // 이미 처리됨

  // 4. 상태 전이 검증
  if (order.status !== "READY" && order.status !== "PENDING") {
    throw new InvalidOrderStatusError(order.status);
  }

  // 5. 토스 승인 API 호출 (서버에서만!)
  const tossResult = await tossClient.confirmPayment({
    paymentKey, orderId, amount
  });

  // 6. DB 트랜잭션: 결제 기록 + 주문 상태 + entitlement 업데이트
  await db.transaction(async (tx) => {
    await tx.insertPayment({
      provider: "toss",
      providerPaymentKey: paymentKey, // UNIQUE 제약
      orderId, userId, amount,
      status: "DONE",
      rawResponse: JSON.stringify(tossResult), // 원문 저장!
      approvedAt: new Date()
    });

    await tx.updateOrderStatus(orderId, "DONE");

    // 권한은 별도 테이블로 관리
    await tx.upsertEntitlement({
      userId,
      planKey: order.planKey,
      expiresAt: calculateExpiry(order.planKey)
    });
  });

  return tossResult;
}
```

### 코드 템플릿 — webhook 처리
```typescript
// src/domains/payment/api/handle-webhook.ts
export async function handleWebhook(
  headers: Record<string, string>,
  rawBody: string
) {
  const event = JSON.parse(rawBody);

  // 1. 원문 + 헤더 먼저 저장 (증거 보전)
  // unique(provider, event_id)로 멱등 처리
  const isDuplicate = await saveWebhookEvent({
    provider: "toss",
    eventId: headers["transmission-id"] || event.eventNo,
    eventType: event.eventType,
    rawHeaders: JSON.stringify(headers),
    rawBody: rawBody
  });

  if (isDuplicate) {
    return { status: 200, message: "already processed" };
  }

  // 2. 서명/교차검증
  const isValid = await verifyWebhookSignature(headers, rawBody);
  if (!isValid) {
    // 위조 의심: 로깅 후 거부
    console.error("Webhook signature verification failed");
    return { status: 401, message: "invalid signature" };
  }

  // 3. 이벤트 타입별 처리
  // 주의: 자동결제는 결제 완료 웹훅을 안 보낼 수 있음
  switch (event.eventType) {
    case "PAYMENT_STATUS_CHANGED":
      await handlePaymentStatusChange(event);
      break;
    case "BILLING_KEY_STATUS_CHANGED":
      await handleBillingKeyChange(event);
      break;
    default:
      console.log(`Unhandled webhook event: ${event.eventType}`);
  }

  // 4. 항상 200 반환 (토스 재전송 방지)
  return { status: 200, message: "ok" };
}
```

## 5. 테스트 체크리스트
- [ ] confirm에서 금액 불일치 시 실패
- [ ] idempotency key 중복 요청 처리
- [ ] webhook 서명 실패 시 401
- [ ] 환불/취소 API 정상 동작
