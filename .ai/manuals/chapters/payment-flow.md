# 결제 흐름 상세 가이드 (Toss Payments)

## 이 문서를 읽어야 하는 시점
- "결제", "payment", "환불", "구독", "webhook" 키워드가 포함된 작업 시
- `src/domains/payment/` 또는 `src/app/api/payment/` 수정 시

## 전체 결제 아키텍처

### 정상 흐름
```
클라이언트                    서버                          토스
  │ 결제 요청 ──────────────→ │                              │
  │                          │ 주문 생성 (DB: READY)          │
  │ ←── 결제 위젯 URL ────── │                              │
  │ 결제 진행 ─────────────────────────────────────────────→ │
  │ ←── 성공 redirect (paymentKey, orderId, amount) ─────── │
  │ confirm 요청 ──────────→ │                              │
  │                          │ 1. 세션 검증                   │
  │                          │ 2. 주문 조회 + 소유권 확인       │
  │                          │ 3. amount 검증                 │
  │                          │ 4. 멱등 락 (DB UNIQUE)          │
  │                          │ 5. 승인 API ───────────────→  │
  │                          │ ←── 승인 결과 ──────────────  │
  │                          │ 6. DB 트랜잭션:                │
  │                          │    결제 기록 + 주문 상태         │
  │                          │    + entitlement 업데이트       │
  │ ←── 결과 응답 ─────────── │                              │
```

### 복구 흐름 (비동기 보정)
- confirm 성공 전에 클라이언트가 이탈할 수 있으므로 webhook/조회 API 보정 루프가 필요하다.
- webhook 이벤트는 중복/지연/역순 도착을 가정하고 설계한다.
- entitlement은 결제 이벤트 원본이 아니라 "최종 확정 상태"에서만 갱신한다.

## 상태 머신 설계

### 주문/결제 상태
- 최소 상태: `READY -> PENDING -> DONE -> CANCELLED | FAILED | EXPIRED`
- 금지 전이 예시: `DONE -> READY`, `FAILED -> PENDING` (명시적 재시도 주문 생성 없이)
- 모든 상태 전이는 DB에 기록하고, 애플리케이션에서 허용 전이만 통과시킨다.

### 전이 검증 규칙
- confirm 진입 가능 상태: `READY`, `PENDING`
- DONE 확정 이후 동일 paymentKey 재호출: 기존 DONE 결과 반환(멱등)
- webhook로 상태 보정 시에도 전이 검증 동일 적용

## DB 모델링 원칙

### 멱등성은 DB 제약으로 강제
| 대상 | 유니크 제약 |
|------|-----------|
| Webhook | `billing_webhook_events(provider, event_id)` UNIQUE |
| Confirm | `billing_payments(provider, provider_payment_key)` UNIQUE |
| Refund | `billing_refunds(provider, provider_refund_id)` UNIQUE |
| Entitlement | `entitlements(user_id, plan_key)` UNIQUE + upsert |

### 원문 보전
- `billing_webhook_events`에 `raw_headers`, `raw_body`, `received_at` 저장
- `billing_payments`에 `raw_response` 저장
- 분쟁/CS 대응을 위해 원문(JSON)과 핵심 헤더를 반드시 남긴다

## Confirm API 구현 가이드

### 필수 검증 순서
1. 세션 사용자 확인 (`userId` 확보)
2. 주문 조회 + 소유권 검증 (`order.userId === userId`)
3. 금액 검증 (`order.amount === callback.amount`)
4. 멱등 처리 (`provider_payment_key` UNIQUE + 기존 DONE 반환)
5. 상태 전이 검증 (`READY/PENDING`만 허용)
6. 토스 confirm API 호출(서버에서만)
7. DB 트랜잭션(결제 기록 + 주문 상태 + entitlement)

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

## Webhook 구현 가이드

### 처리 원칙
- 저장 먼저, 검증 다음: 원문을 먼저 저장해 증거를 남긴다
- 이벤트 키: `transmission-id` 우선, 없으면 provider event id 보조
- 재전송은 정상 동작으로 간주(`retried-count` 고려)
- 자동결제는 결제 완료 웹훅이 없을 수 있으므로 결제 타입별 분기 필요

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

## 보안 체크리스트
- [ ] confirm 전에 DB 주문 금액과 callback amount를 비교한다
- [ ] 주문 소유권 검증을 수행한다
- [ ] 승인 API는 서버에서만 호출한다
- [ ] DB 유니크 제약으로 멱등성을 강제한다
- [ ] webhook 서명 검증 또는 조회 API 교차검증을 수행한다
- [ ] 이벤트 원문(JSON + 헤더)을 저장한다
- [ ] API 키는 환경변수로만 관리한다
- [ ] CSRF 방어(SameSite/Origin/CSRF 토큰)를 상태 변경 API에 적용한다

## 리뷰 시 취약점 점검
- [ ] amount 검증 누락 여부
- [ ] 주문 소유권 검증 누락 여부
- [ ] DONE 이후 역전이 등 잘못된 상태 전이 허용 여부
- [ ] webhook/confirm 중복 호출 시 중복 반영 여부
- [ ] webhook 위조 대비 부족 여부
- [ ] 서버리스 타임아웃(예: 10초) 초과 가능성
- [ ] 원문 저장 누락 여부

## 테스트 시나리오
- [ ] amount 불일치 시 confirm 실패
- [ ] 타인 orderId로 confirm 시 403/실패
- [ ] 동일 paymentKey 중복 confirm 시 결과 재사용(멱등)
- [ ] webhook 동일 이벤트 재전송 시 1회만 반영
- [ ] webhook 서명 실패 시 거부
- [ ] 정상 결제 후 entitlement upsert 확인
- [ ] 실패/취소/만료 상태 전이 검증

## 운영 가이드
- confirm은 성공 URL 진입 직후 빠르게 호출한다
- confirm 실패/지연은 webhook 또는 결제 조회 API로 보정한다
- 재처리 배치는 "미확정(PENDING) 오래 지속" 건만 대상으로 제한한다
- 운영 대시보드에 `orderId`, `paymentKey`, `transmission-id` 검색 경로를 제공한다
