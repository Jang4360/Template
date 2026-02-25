## 1. 활성화 조건
- 키워드: payment, 결제, 토스, Toss, webhook, refund, confirm, 승인
- 의도: 결제 승인/검증/환불/취소 플로우 구현
- 작업 위치: `src/domains/payment/`, `src/app/api/payment/`, `src/lib/toss-payments/`
- 코드 패턴: 결제 위젯/리다이렉트/confirm API/웹훅 처리

## 2. 필수 패턴
- 위젯 -> redirect -> confirm -> webhook 흐름 준수
- 서버에서 금액/주문ID 검증 후 승인
- idempotency key 사용
- webhook 서명 검증 필수

## 3. 보안 체크리스트
- [ ] 결제 금액 서버 검증
- [ ] idempotency key 적용
- [ ] webhook 서명 검증
- [ ] API 키는 환경변수만 사용

## 4. 코드 템플릿
```ts
// src/app/api/payment/confirm/route.ts
import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { tossPaymentsClient } from "@/lib/toss-payments/client";

export async function POST(req: Request) {
  try {
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
  } catch (err) {
    return NextResponse.json({ error: "Payment confirm failed" }, { status: 500 });
  }
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

  // TODO: process event and persist
  return NextResponse.json({ ok: true });
}
```

## 5. 테스트 체크리스트
- [ ] confirm에서 금액 불일치 시 실패
- [ ] idempotency key 중복 요청 처리
- [ ] webhook 서명 실패 시 401
- [ ] 환불/취소 API 정상 동작
