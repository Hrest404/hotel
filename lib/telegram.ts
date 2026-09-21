export async function sendTelegramFeedback(text: string): Promise<void> {
  const res = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Telegram send failed: ${res.status} ${res.statusText}`);
  }
}
