import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { EVENT_CATEGORIES, labelToCategory } from "@/lib/constants";
import { suggestCategorySchema } from "@/lib/validations/event";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = suggestCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Title and description are required" },
      { status: 400 },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI service not configured" },
      { status: 503 },
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are classifying campus events for the Petroleum Training Institute (PTI).

Given the event title and description below, return ONLY one category from this exact list:
${EVENT_CATEGORIES.join(", ")}

Return only the category name, nothing else.

Title: ${parsed.data.title}
Description: ${parsed.data.description}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const categoryValue = labelToCategory(text);

    if (!categoryValue) {
      return NextResponse.json(
        { error: "Could not determine category. Please select manually." },
        { status: 422 },
      );
    }

    const category =
      categoryValue.charAt(0).toUpperCase() + categoryValue.slice(1);

    return NextResponse.json({ category });
  } catch {
    return NextResponse.json(
      { error: "AI service unavailable. Please select manually." },
      { status: 503 },
    );
  }
}
