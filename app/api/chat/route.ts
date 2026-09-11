import { NextResponse } from "next/server";
import { getFallbackResponse } from "@/lib/chatBot";
import { askGemini, IMAGE_DISCLAIMER, isGeminiConfigured } from "@/lib/gemini";
import { findAnswer, saveGeminiAnswer, trackUnansweredQuestion } from "@/lib/qaMatch";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      message?: string;
      imageData?: { data: string; mimeType: string };
    };
    const message = body.message?.trim();

    if (!message && !body.imageData) {
      return NextResponse.json({ error: "Пустое сообщение" }, { status: 400 });
    }

    const hasImage =
      body.imageData &&
      typeof body.imageData.data === "string" &&
      body.imageData.data.length > 0 &&
      body.imageData.data.length < MAX_IMAGE_SIZE &&
      ALLOWED_MIME.has(body.imageData.mimeType);

    if (!hasImage && message) {
      const faqAnswer = await findAnswer(message);
      if (faqAnswer) {
        return NextResponse.json({ reply: faqAnswer });
      }
    }

    if (!isGeminiConfigured()) {
      void trackUnansweredQuestion(message || "фото").catch(() => undefined);
      return NextResponse.json({ reply: getFallbackResponse() });
    }

    try {
      const reply = await askGemini(message || "Опиши изображение", hasImage ? body.imageData : undefined);
      try {
        await saveGeminiAnswer(message || "фото", reply);
      } catch {
        // База недоступна — ответ всё равно отдаём
      }
      const finalReply = hasImage ? reply + IMAGE_DISCLAIMER : reply;
      return NextResponse.json({ reply: finalReply });
    } catch {
      void trackUnansweredQuestion(message || "фото").catch(() => undefined);
      return NextResponse.json(
        { error: "Ошибка Gemini", reply: getFallbackResponse() },
        { status: 502 },
      );
    }
  } catch {
    return NextResponse.json({ error: "Не удалось обработать запрос" }, { status: 500 });
  }
}
