import Retell from "retell-sdk";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const apiKey = process.env.RETELL_API_KEY;
    const agentId = process.env.RETELL_AGENT_ID;

    if (!apiKey || !agentId) {
      return NextResponse.json(
        { error: "RETELL_API_KEY 또는 RETELL_AGENT_ID가 없습니다." },
        { status: 500 }
      );
    }

    const client = new Retell({
      apiKey,
    });

    const webCallResponse = await client.call.createWebCall({
      agent_id: agentId,
    });

    return NextResponse.json({
      accessToken: webCallResponse.access_token,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "알 수 없는 오류" },
      { status: 500 }
    );
  }
}