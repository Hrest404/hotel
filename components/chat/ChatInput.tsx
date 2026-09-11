"use client";

import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type ImageData = { data: string; mimeType: string };

type ChatInputProps = {
  disabled: boolean;
  onSend: (text: string, imageData?: ImageData) => void;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

function getSpeechRecognition(): SpeechRecognitionLike | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  if (w.SpeechRecognition) return new w.SpeechRecognition();
  if (w.webkitSpeechRecognition) return new w.webkitSpeechRecognition();
  return null;
}

export function ChatInput({ disabled, onSend }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [image, setImage] = useState<ImageData | null>(null);
  const [listening, setListening] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    if (!disabled && !listening) ref.current?.focus();
  }, [disabled, listening]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  function submit() {
    if (disabled) return;
    if (!value.trim() && !image) return;

    onSend(value.trim(), image ?? undefined);
    setValue("");
    setImage(null);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    submit();
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Можно прикрепить только изображение");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Фото слишком большое — до 10 МБ");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const match = result.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!match) return;
      setImage({ mimeType: match[1], data: match[2] });
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function toggleVoice() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = getSpeechRecognition();
    if (!recognition) {
      alert("Голосовой ввод не поддерживается этим браузером");
      return;
    }

    recognition.lang = "ru-RU";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const result = event.results[event.resultIndex];
      const transcript = result?.[0]?.transcript ?? "";
      setValue((prev) => (prev ? `${prev} ${transcript}` : transcript).trim());
    };

    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border-t border-vespera-border p-3"
    >
      {image ? (
        <div className="mb-2 flex items-center gap-2 rounded-vespera-sm border border-vespera-border bg-vespera-bg/50 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:${image.mimeType};base64,${image.data}`}
            alt="Предпросмотр фото"
            className="h-14 w-14 rounded-vespera-sm object-cover"
          />
          <span className="flex-1 truncate text-xs text-vespera-text">
            Фото прикреплено
          </span>
          <button
            type="button"
            onClick={() => setImage(null)}
            aria-label="Убрать фото"
            className="rounded-vespera-sm border border-vespera-border px-2 py-1 text-xs text-vespera-text transition hover:border-vespera-border-strong hover:text-vespera-accent"
          >
            Убрать
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2">
        <textarea
          ref={ref}
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ваш вопрос…"
          aria-label="Сообщение консьержу"
          className="min-h-11 resize-none rounded-vespera-sm border border-vespera-border bg-vespera-bg/65 px-3 py-2.5 text-sm text-vespera-text outline-none focus-visible:border-vespera-border-strong disabled:opacity-60"
        />
        <button
          type="button"
          onClick={toggleVoice}
          disabled={disabled}
          aria-label={listening ? "Остановить запись" : "Голосовой ввод"}
          title={listening ? "Остановить запись" : "Голосовой ввод"}
          className={`rounded-vespera-sm border px-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vespera-accent disabled:opacity-50 ${
            listening
              ? "border-vespera-accent bg-vespera-accent/20 text-vespera-accent animate-pulse"
              : "border-vespera-border bg-vespera-bg/65 text-vespera-text hover:border-vespera-border-strong"
          }`}
        >
          {listening ? (
            <span aria-hidden className="block h-2.5 w-2.5 rounded-full bg-current" />
          ) : (
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <path d="M12 19v3" />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          aria-label="Прикрепить фото"
          title="Прикрепить фото"
          className="rounded-vespera-sm border border-vespera-border bg-vespera-bg/65 px-3 text-sm font-semibold text-vespera-text transition hover:border-vespera-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vespera-accent disabled:opacity-50"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M4 20h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-2l-2-3h-8L6 7H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1Z" />
            <circle cx="12" cy="13" r="3.5" />
          </svg>
        </button>
        <button
          type="submit"
          disabled={disabled || (!value.trim() && !image)}
          className="rounded-vespera-sm bg-vespera-accent px-3.5 text-sm font-semibold text-[#1a1712] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vespera-accent disabled:opacity-50"
        >
          Отправить
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
        aria-hidden
        tabIndex={-1}
      />

      {listening ? (
        <p className="mt-1.5 text-xs text-vespera-text">
          Слушаю… говорите по-русски
        </p>
      ) : null}
    </form>
  );
}