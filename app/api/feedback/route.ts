import { NextRequest, NextResponse } from "next/server";
import { sendTelegramFeedback } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const { name, contact, message, website } = body as {
    name?: string;
    contact?: string;
    message?: string;
    website?: string;
  };

  // Honeypot: если бот заполнил скрытое поле — тихо «успех»
  if (website) {
    return NextResponse.json({ success: true });
  }

  // Валидация: сообщение обязательно
  if (!message || message.trim().length === 0) {
    return NextResponse.json({ success: false }, { status: 422 });
  }

  const lines: string[] = [];

  lines.push("📬 Новое сообщение с сайта");
  lines.push("");

  if (name?.trim()) {
    lines.push(`👤 Имя: ${name.trim()}`);
  }

  if (contact?.trim()) {
    lines.push(`📞 Контакт: ${contact.trim()}`);
  }

  lines.push("");
  lines.push(`💬 Сообщение:\n${message.trim()}`);

  const text = lines.join("\n");

  try {
    await sendTelegramFeedback(text);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[feedback] Telegram error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
