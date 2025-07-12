import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json(
        { error: "No text provided" },
        { status: 400 }
      );
    }

    const token = process.env["GITHUB_TOKEN"];
    const endpoint = "https://models.github.ai/inference";
    const model = "openai/gpt-4.1";

    const client = new OpenAI({ baseURL: endpoint, apiKey: token });

    const res = await client.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a medical assistant. When given a medical report, ONLY highlight values or findings that are concerning, abnormal, or require attention. For each, provide a relevant, actionable suggestion to improve or address the issue. Do NOT include normal findings, summaries, or general explanations. Format as: \n\n**Concerning Findings:**\n• <Finding>: <Value> (<Status>)\n• ...\n\n**Suggestions:**\n• <Suggestion for each finding>\n\nIf there are no concerning findings, simply say: 'No concerning findings. Your report looks good.'"
        },
        { role: "user", content: text }
      ],
      temperature: 1.0,
      top_p: 1.0,
      model: model
    });

    console.log(res.choices[0].message.content);

    const response = {
      message: res.choices[0].message.content,
      extractedText: text,
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