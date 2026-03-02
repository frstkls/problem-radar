import { cookies } from "next/headers";
import crypto from "crypto";

const SECRET = (() => {
  if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
    throw new Error(
      "[ProblemRadar] SESSION_SECRET environment variable must be set in production. " +
      "Add SESSION_SECRET to your Vercel/hosting environment variables."
    );
  }
  if (!process.env.SESSION_SECRET) {
    console.warn("[ProblemRadar] Using insecure dev SESSION_SECRET — set SESSION_SECRET env var before deploying");
  }
  return process.env.SESSION_SECRET || "pr-dev-secret-please-set-SESSION_SECRET-in-env";
})();

export const COOKIE = "pr_sess";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 365,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

function sign(obj) {
  const b = Buffer.from(JSON.stringify(obj)).toString("base64url");
  const s = crypto.createHmac("sha256", SECRET).update(b).digest("base64url");
  return `${b}.${s}`;
}

function verify(token) {
  try {
    const [b, s] = token.split(".");
    const expected = crypto
      .createHmac("sha256", SECRET)
      .update(b)
      .digest("base64url");
    if (s !== expected) return null;
    return JSON.parse(Buffer.from(b, "base64url").toString());
  } catch {
    return null;
  }
}

function thisMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fresh() {
  return {
    plan: "free",
    scansUsed: 0,
    month: thisMonth(),
    stripeCustomerId: null,
    stripeSubscriptionId: null,
  };
}

export function getSession() {
  const raw = cookies().get(COOKIE)?.value;
  const data = raw ? verify(raw) : null;
  if (!data) return fresh();
  // Reset scan counter on new calendar month
  if (data.month !== thisMonth()) return { ...data, scansUsed: 0, month: thisMonth() };
  return data;
}

export function saveSession(data) {
  cookies().set(COOKIE, sign(data), COOKIE_OPTIONS);
}

export function setSessionOnResponse(response, data) {
  response.cookies.set(COOKIE, sign(data), COOKIE_OPTIONS);
}

export function isPro(session) {
  return session.plan === "pro" || session.plan === "team";
}
