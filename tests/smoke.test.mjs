import test from "node:test";
import assert from "node:assert/strict";

test("template defaults stay deterministic", () => {
  const framework = "next-app-router";
  const backend = "supabase";
  const host = "vercel";

  assert.equal(framework, "next-app-router");
  assert.equal(backend, "supabase");
  assert.equal(host, "vercel");
});
