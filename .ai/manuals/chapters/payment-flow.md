## Payment Flow Guide

### 개요
- 결제 흐름은 위젯 -> redirect -> confirm -> webhook 순서를 따른다.
- 금액 검증, idempotency, webhook 서명 검증은 필수다.

### 결제 승인 흐름
1. 클라이언트에서 위젯 호출 및 결제 요청
2. 리다이렉트로 결제 결과 수신
3. 서버에서 confirm API로 승인
4. webhook 수신 및 DB 상태 반영

### 코드 예시
```ts
// src/app/api/payment/confirm/route.ts
import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { tossPaymentsClient } from "@/lib/toss-payments/client";

export async function POST(req: Request) {
  const supabase = getServerSupabaseClient();
  const body = await req.json();
  const { orderId, amount, paymentKey } = body;

  const { data: order } = await supabase
    .from("orders")
    .select("id, amount")
    .eq("id", orderId)
    .single();

  if (!order || order.amount !== amount) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const confirmRes = await tossPaymentsClient.confirmPayment({
    paymentKey,
    orderId,
    amount,
    idempotencyKey: `${orderId}:${paymentKey}`,
  });

  return NextResponse.json(confirmRes);
}
```

```ts
// src/app/api/payment/webhook/route.ts
import { NextResponse } from "next/server";
import { verifyTossSignature } from "@/lib/toss-payments/client";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("toss-signature") ?? "";

  if (!verifyTossSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // TODO: process event
  return NextResponse.json({ ok: true });
}
```

### 주의사항
- 금액 검증 없이 승인 금지
- idempotency key 누락 금지
- webhook 서명 검증 누락 금지

### 자주 하는 실수
- 클라이언트 값으로 금액 신뢰
- confirm 전에 주문 상태 갱신
- webhook 이벤트 중복 처리
