import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/admin-auth";
import { runAiProfileAction } from "../../../../lib/profile-ai";
import type { ProfileData } from "../../../../lib/site-data";

export const runtime = "nodejs";

type AdminAiPayload = {
  mode?: "import" | "polish";
  profile?: ProfileData;
  sourceText?: string;
  instruction?: string;
};

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) {
    return authError;
  }

  let payload: AdminAiPayload | null = null;

  try {
    payload = (await request.json()) as AdminAiPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!payload?.profile || (payload.mode !== "import" && payload.mode !== "polish")) {
    return NextResponse.json({ error: "Missing required AI fields." }, { status: 422 });
  }

  try {
    const profile = await runAiProfileAction({
      mode: payload.mode,
      currentProfile: payload.profile,
      sourceText: payload.sourceText,
      instruction: payload.instruction,
    });

    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI action failed." },
      { status: 500 }
    );
  }
}
