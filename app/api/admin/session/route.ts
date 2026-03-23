import { NextResponse } from "next/server";
import {
  attachAdminSession,
  clearAdminSession,
  hasAdminPassword,
  isAdminAuthenticated,
  verifyAdminPassword,
} from "../../../../lib/admin-auth";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    {
      authenticated: await isAdminAuthenticated(),
      configured: hasAdminPassword(),
    },
    { status: 200 }
  );
}

export async function POST(request: Request) {
  let password = "";

  try {
    const payload = (await request.json()) as { password?: string };
    password = payload.password || "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "Password incorrect." }, { status: 401 });
  }

  return attachAdminSession(
    NextResponse.json({ authenticated: true }, { status: 200 })
  );
}

export async function DELETE() {
  return clearAdminSession(
    NextResponse.json({ authenticated: false }, { status: 200 })
  );
}
