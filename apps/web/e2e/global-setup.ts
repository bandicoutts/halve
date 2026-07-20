import { request } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import path from "node:path";
import fs from "node:fs";

/**
 * Authenticates once via the dev-only /api/dev-login route (see that file's
 * header comment for its safety gates) and saves the resulting cookies as a
 * Playwright storage state, reused by every test. Avoids hitting real email
 * delivery / magic links in the suite.
 */
export default async function globalSetup() {
  loadEnv({ path: path.join(__dirname, "..", ".env.local") });

  const secret = process.env.DEV_LOGIN_SECRET;
  if (!secret) {
    throw new Error(
      "DEV_LOGIN_SECRET is not set in apps/web/.env.local — required for the E2E suite's dev-login auth. " +
        "See src/app/api/dev-login/route.ts.",
    );
  }

  const ctx = await request.newContext({ baseURL: "http://localhost:3000" });
  const res = await ctx.post(`/api/dev-login?secret=${secret}`);
  if (!res.ok()) {
    throw new Error(`dev-login failed (${res.status()}): ${await res.text()}`);
  }

  const stateDir = path.join(__dirname, ".auth");
  fs.mkdirSync(stateDir, { recursive: true });
  await ctx.storageState({ path: path.join(stateDir, "storage-state.json") });
  await ctx.dispose();
}
