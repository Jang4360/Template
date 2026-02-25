export type TossPaymentsEnv = "development" | "staging" | "production";

export type TossPaymentsConfig = {
  clientKey: string;
  baseUrl: string;
};

const ENV: TossPaymentsEnv =
  (process.env.NEXT_PUBLIC_APP_ENV as TossPaymentsEnv) ?? "development";

const BASE_URLS: Record<TossPaymentsEnv, string> = {
  development: "https://api.tosspayments.com",
  staging: "https://api.tosspayments.com",
  production: "https://api.tosspayments.com",
};

export function getTossPaymentsConfig(): TossPaymentsConfig {
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
  if (!clientKey) {
    throw new Error("Missing Toss client key");
  }

  return {
    clientKey,
    baseUrl: BASE_URLS[ENV],
  };
}
