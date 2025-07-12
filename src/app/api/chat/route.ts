import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { history } = body;

    if (!history || !Array.isArray(history)) {
      return NextResponse.json(
        { error: "History array is required" },
        { status: 400 }
      );
    }

    const token = process.env["GITHUB_TOKEN"];
    const endpoint = "https://models.github.ai/inference";
    const modelName = "openai/gpt-4o-mini";

    const client = new OpenAI({ baseURL: endpoint, apiKey: token });

    const res = await client.chat.completions.create({
      messages: history,
      model: modelName,
    });

    const response = {
      message: res.choices[0].message.content,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error processing chat request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 