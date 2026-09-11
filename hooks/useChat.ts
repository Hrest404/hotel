"use client";

import { useCallback, useState } from "react";
import { business } from "@/data/business";
import { getBotResponse, getFallbackResponse } from "@/lib/chatBot";
import type { Message } from "@/types/chat.types";

type ImageData = { data: string; mimeType: string };

function createMessage(
  role: Message["role"],
  text: string,
  imageData?: ImageData,
): Message {
  return {
    id: crypto.randomUUID(),
    role,
    text,
    timestamp: Date.now(),
    imageData,
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([
    createMessage("bot", business.welcome),
  ]);
  const [isBotTyping, setIsBotTyping] = useState(false);

  const handleUserMessage = useCallback(
    async (raw: string, imageData?: ImageData) => {
      const text = raw.trim();
      if (!text && !imageData) return;

      const displayText = text || "Посмотрите на это фото";
      setMessages((prev) => [...prev, createMessage("user", displayText, imageData)]);
      setIsBotTyping(true);

      try {
        if (!imageData) {
          const local = getBotResponse(text);

          if (!local.isFallback) {
            await delay(350 + Math.floor(Math.random() * 150));
            setMessages((prev) => [...prev, createMessage("bot", local.text)]);
            return;
          }
        }

        let response: Response;
        try {
          response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: text || "",
              imageData: imageData ?? null,
            }),
          });
        } catch {
          setMessages((prev) => [...prev, createMessage("bot", business.offline)]);
          return;
        }

        const data = (await response.json()) as { reply?: string; error?: string };

        if (!response.ok) {
          setMessages((prev) => [
            ...prev,
            createMessage("bot", getFallbackResponse()),
          ]);
          return;
        }

        setMessages((prev) => [
          ...prev,
          createMessage("bot", data.reply?.trim() || getFallbackResponse()),
        ]);
      } finally {
        setIsBotTyping(false);
      }
    },
    [],
  );

  return {
    messages,
    isBotTyping,
    handleUserMessage,
  };
}
