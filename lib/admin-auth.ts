import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const ADMIN_COOKIE = "site_admin_session";
const SESSION_PAYLOAD = "authenticated";

function readAdminPassword(): string {
  return process.env.SITE_ADMIN_PASSWORD || "";
}

function readSessionSecret(): string {
  return process.env.SITE_ADMIN_SESSION_SECRET || readAdminPassword() || "site-admin-secret";
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function sign(value: string): string {
  return createHmac("sha256", readSessionSecret()).update(value).digest("hex");
}

function createSessionToken(): string {
  return `${SESSION_PAYLOAD}.${sign(SESSION_PAYLOAD)}`;
}

function verifySessionToken(token: string): boolean {
  const [payload, signature] = token.split(".");
  if (!payload || !signature || payload !== SESSION_PAYLOAD) {
    return false;
  }

  return safeEqual(signature, sign(payload));
}

function buildCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export function hasAdminPassword(): boolean {
  return Boolean(readAdminPassword());
}

export function verifyAdminPassword(input: string): boolean {
  const password = readAdminPassword();
  if (!password || !input) {
    return false;
  }

  return safeEqual(input, password);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value || "";
  return verifySessionToken(token);
}

export async function requireAdmin() {
  const authenticated = await isAdminAuthenticated();
  if (authenticated) {
    return null;
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function attachAdminSession(response: NextResponse): NextResponse {
  response.cookies.set(ADMIN_COOKIE, createSessionToken(), buildCookieOptions());
  return response;
}

export function clearAdminSession(response: NextResponse): NextResponse {
  response.cookies.set(ADMIN_COOKIE, "", {
    ...buildCookieOptions(),
    maxAge: 0,
  });
  return response;
}
