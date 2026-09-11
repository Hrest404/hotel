import { GoogleGenerativeAI } from "@google/generative-ai";
import { business } from "@/data/business";

export const IMAGE_DISCLAIMER =
  "\n\nДля более точной информации свяжитесь по номеру +7 (495) 120-48-90 или оставьте свои данные через обратную связь.";

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function askGemini(
  userMessage: string,
  imageData?: { data: string; mimeType: string },
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY не задан");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
  });

  const roomLines = business.rooms
    .map((room) => `- ${room.title}: ${room.price}. ${room.text}`)
    .join("\n");
  const serviceLines = business.services
    .map((item) => `- ${item.title}: ${item.text}`)
    .join("\n");

  const system = imageData
    ? `Ты сдержанный консьерж бутик-отеля ${business.name}.
Пользователь прислал изображение. Опиши кратко, что ты видишь на фото,
и дай предварительный ответ, опираясь на факты ниже. Если не уверен — скажи об этом.
Телефон: ${business.phone}. Почта: ${business.email}. Адрес: ${business.address}.
Заезд ${business.checkIn}, выезд ${business.checkOut}. ${business.hours}.
Номера:
${roomLines}
Сервис:
${serviceLines}`
    : `Ты сдержанный консьерж бутик-отеля ${business.name}.
Отвечай кратко и тепло на русском. Опирайся только на факты ниже, не выдумывай занятость номеров.
Телефон: ${business.phone}. Почта: ${business.email}. Адрес: ${business.address}.
Заезд ${business.checkIn}, выезд ${business.checkOut}. ${business.hours}.
Номера:
${roomLines}
Сервис:
${serviceLines}
Если просят бронь — предложи форму на сайте или звонок консьержу.`;

  const content: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
    { text: system },
    { text: `Вопрос гостя: ${userMessage}` },
  ];

  if (imageData) {
    content.push({
      inlineData: { data: imageData.data, mimeType: imageData.mimeType },
    });
  }

  const result = await model.generateContent(content);

  const text = result.response.text()?.trim();
  if (!text) {
    throw new Error("Пустой ответ Gemini");
  }

  return text;
}
