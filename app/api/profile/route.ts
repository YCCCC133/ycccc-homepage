import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../../lib/admin-auth";
import {
  getProfile,
  saveProfile,
  ProfileData,
} from "../../../lib/site-data";
import { hasCosConfig } from "../../../lib/tencent-cos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const profile = await getProfile();
  return NextResponse.json(profile, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function PUT(request: Request) {
  const authError = await requireAdmin();
  if (authError) {
    return authError;
  }

  if (!hasCosConfig()) {
    return NextResponse.json(
      {
        error:
          "Tencent COS is not configured. Set the COS env vars before saving profile data.",
      },
      { status: 503 }
    );
  }

  let payload: ProfileData | null = null;
  try {
    payload = (await request.json()) as ProfileData;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  if (!payload || typeof payload.displayName !== "string") {
    return NextResponse.json(
      { error: "Missing required profile fields." },
      { status: 422 }
    );
  }

  const saved = await saveProfile(payload);
  revalidatePath("/");
  return NextResponse.json(saved, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
