import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const database = client.db("scopeguard");

    await database.command({ ping: 1 });

    return NextResponse.json({
      success: true,
      message: "MongoDB Atlas connection successful.",
      database: "scopeguard",
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message:
          "MongoDB Atlas connection failed. Check your server configuration and Atlas network access.",
      },
      { status: 500 },
    );
  }
}
