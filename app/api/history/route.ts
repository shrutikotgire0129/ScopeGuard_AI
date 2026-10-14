import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  deleteRecentAnalyses,
  getRecentAnalyses,
  saveAnalysis,
  type SavedAnalysis,
} from "@/lib/history";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Sign in to access your history." },
        { status: 401 },
      );
    }

    const analyses = await getRecentAnalyses(userId);

    return NextResponse.json({
      success: true,
      analyses,
    });
  } catch (error) {
    console.error("GET /api/history failed:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve analysis history." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Sign in to save analysis history." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as Partial<SavedAnalysis>;

    if (
      !body ||
      typeof body.id !== "string" ||
      typeof body.createdAt !== "string" ||
      typeof body.agreement !== "string" ||
      typeof body.clientRequest !== "string" ||
      !body.analysis ||
      !["included", "potentially_out_of_scope", "needs_clarification"].includes(
        body.analysis.status,
      ) ||
      typeof body.analysis.reason !== "string" ||
      !Array.isArray(body.analysis.evidence) ||
      !body.analysis.evidence.every(
        (item) =>
          item !== null &&
          typeof item === "object" &&
          typeof item.agreementText === "string" &&
          typeof item.interpretation === "string",
      ) ||
      typeof body.analysis.recommendedAction !== "string"
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid analysis data." },
        { status: 400 },
      );
    }

    const record: SavedAnalysis = {
      id: `${userId}-${crypto.randomUUID()}`,
      userId,
      createdAt: new Date().toISOString(),
      agreement: body.agreement,
      clientRequest: body.clientRequest,
      analysis: body.analysis,
    };

    await saveAnalysis(record);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to save analysis." },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Sign in to clear your history." },
        { status: 401 },
      );
    }

    await deleteRecentAnalyses(userId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to clear cloud history." },
      { status: 500 },
    );
  }
}
