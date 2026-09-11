import type { Message } from "@/types/chat.types";

type MessageBubbleProps = {
  role: Message["role"];
  text: string;
  imageData?: Message["imageData"];
};

export function MessageBubble({ role, text, imageData }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex max-w-[85%] flex-col gap-1.5 rounded-vespera-sm border px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? "border-vespera-border bg-vespera-accent/15 text-vespera-text"
            : "border-vespera-border bg-vespera-bg/80 text-vespera-text"
        }`}
      >
        {imageData ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`data:${imageData.mimeType};base64,${imageData.data}`}
            alt="Прикреплённое фото"
            className="max-h-56 w-full max-w-[240px] rounded-vespera-sm object-cover"
          />
        ) : null}
        {text ? (
          <span className="whitespace-pre-wrap">{text}</span>
        ) : null}
      </div>
    </div>
  );
}