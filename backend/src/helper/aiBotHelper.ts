import OpenAI from "openai";
import type { Response } from "express";
import { GoogleGenAI } from "@google/genai";

const googleKey = process.env.GEMINI_API_KEY;
const gptKey = process.env.GPT_API_KEY;

// Shared shape for chat history entries coming from the mobile app.
type ChatHistoryItem = { role: "user" | "assistant"; content: string };

const genAI = new GoogleGenAI({ apiKey: googleKey ?? "" });

const openaiClient = new OpenAI({
  apiKey: gptKey,
});

// Ensure SSE headers are set even if the failure happens before the try block flushed them.
const ensureSseHeaders = (res: Response) => {
  if (res.headersSent) return;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
};

export const handleGemini = async (
  message: string,
  history: ChatHistoryItem[],
  model: string,
  res: Response,
) => {
  try {
    ensureSseHeaders(res);

    // Map mobile-side history to Gemini's Content[] shape:
    //   assistant -> "model", user -> "user", content -> parts[{text}]
    const geminiHistory = (history ?? []).map((h) => ({
      role: h?.role === "assistant" ? "model" : "user",
      parts: [{ text: h?.content ?? "" }],
    }));

    // Gemini requires the first turn to be "user" — drop any leading "model" turns.
    while (geminiHistory.length && geminiHistory[0]?.role === "model") {
      geminiHistory.shift();
    }

    // New @google/genai SDK: chats.create(...) returns a Chat, then sendMessageStream({ message }).
    const chat = genAI.chats.create({
      model,
      history: geminiHistory,
    });

    const stream = await chat.sendMessageStream({ message });

    for await (const chunk of stream) {
      // In @google/genai, `chunk.text` is a getter returning string | undefined (not a method).
      const token = chunk.text ?? "";
      if (token) {
        res.write(
          `data: ${JSON.stringify({ text: token, isDone: false })}\n\n`,
        );
      }
    }

    res.write(`data: ${JSON.stringify({ text: "", isDone: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error("Gemini error:", err);
    ensureSseHeaders(res);
    res.write(
      `data: ${JSON.stringify({ error: "Gemini request failed" })}\n\n`,
    );
    res.end();
  }
};

export const handleGpt = async (
  message: string,
  history: ChatHistoryItem[],
  model: string,
  res: Response,
) => {
  try {
    ensureSseHeaders(res);

    const messages = [
      ...(history ?? []).map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

    const gptResponse = await openaiClient.chat.completions.create({
      model,
      // The OpenAI SDK types are stricter than what we pass, but the runtime
      // shape is identical — cast to satisfy the compiler.
      messages: messages as any,
      stream: true,
    });

    for await (const chunk of gptResponse) {
      const token = chunk.choices[0]?.delta?.content || "";
      if (token) {
        res.write(
          `data: ${JSON.stringify({ text: token, isDone: false })}\n\n`,
        );
      }
    }

    res.write(`data: ${JSON.stringify({ text: "", isDone: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error("GPT error:", error);
    ensureSseHeaders(res);
    res.write(`data: ${JSON.stringify({ error: "GPT request failed" })}\n\n`);
    res.end();
  }
};
