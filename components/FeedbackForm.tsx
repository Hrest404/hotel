"use client";

import { useState, useRef } from "react";

type Status = "idle" | "loading" | "success" | "error";

export function FeedbackForm() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  // Honeypot ref — читаем значение при сабмите, не используем controlled state
  const honeypotRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (status === "loading") return;

    setStatus("loading");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          contact,
          message,
          website: honeypotRef.current?.value ?? "",
        }),
      });

      const json = (await res.json()) as { success: boolean };

      if (json.success) {
        setStatus("success");
        setName("");
        setContact("");
        setMessage("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <form
      className="feedback-form"
      onSubmit={handleSubmit}
      noValidate
      aria-label="Форма обратной связи"
    >
      {/* Honeypot — скрыт от пользователя, виден ботам */}
      <input
        ref={honeypotRef}
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          opacity: 0,
          pointerEvents: "none",
          width: 0,
          height: 0,
        }}
      />

      <div className="feedback-form__field">
        <label htmlFor="feedback-name" className="feedback-form__label">
          Имя
        </label>
        <input
          id="feedback-name"
          type="text"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Как к вам обращаться?"
          autoComplete="name"
          className="feedback-form__input"
          disabled={status === "loading"}
        />
      </div>

      <div className="feedback-form__field">
        <label htmlFor="feedback-contact" className="feedback-form__label">
          Телефон или e-mail
        </label>
        <input
          id="feedback-contact"
          type="text"
          name="contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="+7 900 000-00-00 или mail@example.com"
          autoComplete="off"
          className="feedback-form__input"
          disabled={status === "loading"}
        />
      </div>

      <div className="feedback-form__field">
        <label htmlFor="feedback-message" className="feedback-form__label">
          Сообщение <span aria-hidden="true" className="feedback-form__required">*</span>
        </label>
        <textarea
          id="feedback-message"
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ваш вопрос, пожелание или запрос..."
          required
          rows={4}
          className="feedback-form__input feedback-form__input--textarea"
          disabled={status === "loading"}
        />
      </div>

      <button
        type="submit"
        className="btn btn--primary feedback-form__submit"
        disabled={status === "loading" || message.trim().length === 0}
        aria-busy={status === "loading"}
      >
        {status === "loading" ? (
          <>
            <span className="feedback-form__spinner" aria-hidden="true" />
            Отправка…
          </>
        ) : (
          "Отправить сообщение"
        )}
      </button>

      {status === "success" && (
        <p role="status" className="feedback-form__status feedback-form__status--ok">
          Спасибо, мы получили ваше сообщение
        </p>
      )}

      {status === "error" && (
        <p role="alert" className="feedback-form__status feedback-form__status--err">
          Не удалось отправить, попробуйте позже
        </p>
      )}
    </form>
  );
}
