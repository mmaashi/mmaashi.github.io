import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, stockContext } = body as {
      messages: { role: "user" | "assistant"; content: string }[];
      stockContext?: {
        ticker: string;
        name: string;
        price: number | null;
        changePct: number | null;
        pe: string | null;
        eps: number | null;
        revenue: string | null;
        netMargin: string | null;
        divYield: string | null;
        sector: string | null;
        fairValue: number | null;
      };
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    const systemPrompt = stockContext
      ? `You are SŪQAI Assistant, an AI analyst for the Saudi Stock Exchange (Tadawul). You help investors understand stocks and make informed decisions.

You are currently helping with: ${stockContext.ticker} — ${stockContext.name}

Current data:
- Price: ${stockContext.price ? `SAR ${stockContext.price}` : "N/A"}
- Change: ${stockContext.changePct !== null ? `${stockContext.changePct > 0 ? "+" : ""}${stockContext.changePct?.toFixed(2)}%` : "N/A"}
- P/E Ratio: ${stockContext.pe ?? "N/A"}
- EPS: ${stockContext.eps ? `SAR ${stockContext.eps}` : "N/A"}
- Revenue: ${stockContext.revenue ? `SAR ${stockContext.revenue}` : "N/A"}
- Net Margin: ${stockContext.netMargin ?? "N/A"}
- Dividend Yield: ${stockContext.divYield ?? "N/A"}
- Sector: ${stockContext.sector ?? "N/A"}
- Fair Value Estimate: ${stockContext.fairValue ? `SAR ${stockContext.fairValue}` : "N/A"}

Guidelines:
- Be concise and factual (3-5 sentences per response)
- Always add a brief disclaimer that this is not investment advice
- You can answer in Arabic if the user writes in Arabic
- Focus on the data provided — don't invent numbers
- You can explain financial ratios, what metrics mean, and general stock concepts
- Never recommend specific buy/sell actions with certainty`
      : `You are SŪQAI Assistant, an AI analyst for the Saudi Stock Exchange (Tadawul). Answer questions about Saudi stocks, financial concepts, and market data. Be concise. Always add a disclaimer that this is not investment advice. You can respond in Arabic if the user writes in Arabic.`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: systemPrompt,
      messages: messages.slice(-10), // keep last 10 turns for context
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const reply = textBlock ? textBlock.text : "Sorry, I couldn't generate a response.";

    return NextResponse.json({ reply });
  } catch (err: unknown) {
    console.error("[/api/chat]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("API key") || message.includes("authentication")) {
      return NextResponse.json(
        { error: "AI assistant is not configured. Please add ANTHROPIC_API_KEY to environment variables." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Failed to get AI response" }, { status: 500 });
  }
}
