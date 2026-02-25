import { getTossPaymentsConfig } from "@/lib/toss-payments/config";

export type ConfirmPaymentParams = {
  paymentKey: string;
  orderId: string;
  amount: number;
  idempotencyKey?: string;
};

export type CancelPaymentParams = {
  paymentKey: string;
  cancelReason: string;
  cancelAmount?: number;
  idempotencyKey?: string;
};

export type PaymentResult = {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount?: number;
  [key: string]: unknown;
};

type TossApiError = {
  code?: string;
  message?: string;
};

const TOSS_API_VERSION = "v1";

function getSecretKey(): string {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing Toss secret key");
  }
  return secretKey;
}

function getAuthorizationHeader(): string {
  const secretKey = getSecretKey();
  const encoded = Buffer.from(`${secretKey}:`).toString("base64");
  return `Basic ${encoded}`;
}

async function request<T>(
  path: string,
  init: RequestInit,
  idempotencyKey?: string
): Promise<T> {
  const { baseUrl } = getTossPaymentsConfig();
  const headers = new Headers(init.headers);

  headers.set("Authorization", getAuthorizationHeader());
  headers.set("Content-Type", "application/json");
  if (idempotencyKey) {
    headers.set("Idempotency-Key", idempotencyKey);
  }

  const response = await fetch(`${baseUrl}/${TOSS_API_VERSION}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as TossApiError;
    const message = errorBody.message ?? "Toss Payments API error";
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export const tossPaymentsClient = {
  async confirmPayment(params: ConfirmPaymentParams): Promise<PaymentResult> {
    return request<PaymentResult>(
      "/payments/confirm",
      {
        method: "POST",
        body: JSON.stringify({
          paymentKey: params.paymentKey,
          orderId: params.orderId,
          amount: params.amount,
        }),
      },
      params.idempotencyKey
    );
  },

  async cancelPayment(params: CancelPaymentParams): Promise<PaymentResult> {
    return request<PaymentResult>(
      `/payments/${params.paymentKey}/cancel`,
      {
        method: "POST",
        body: JSON.stringify({
          cancelReason: params.cancelReason,
          cancelAmount: params.cancelAmount,
        }),
      },
      params.idempotencyKey
    );
  },

  async getPayment(paymentKey: string): Promise<PaymentResult> {
    return request<PaymentResult>(`/payments/${paymentKey}`, { method: "GET" });
  },
};

export function verifyTossSignature(rawBody: string, signature: string): boolean {
  const webhookSecret = process.env.TOSS_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("Missing Toss webhook secret");
  }

  // TODO: implement actual HMAC verification when webhook spec is finalized.
  return rawBody.length > 0 && signature.length > 0;
}
