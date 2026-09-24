import { createLovableAiGatewayRunIdFetch } from "@/lib/ai-gateway.server";
import { createOpenAI } from "@ai-sdk/openai";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

type ChatRequest = { messages?: unknown; concise?: boolean };

const SYSTEM_PROMPT = `You are Workmate, an expert workplace productivity assistant. Help with workplace writing, planning, summarising, brainstorming, communication, meetings, and productivity. Give specific, useful answers tailored to the user's request. Use clear markdown when it improves readability. Ask one focused follow-up question only when essential. Never claim to have completed external actions. Remind users to review high-stakes workplace advice when relevant.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatRequest;
        if (!Array.isArray(body.messages)) {
          return Response.json({ error: "Messages are required." }, { status: 400 });
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) {
          return Response.json({ error: "AI is not configured yet." }, { status: 500 });
        }

        const runIdFetch = createLovableAiGatewayRunIdFetch(
          request.headers.get("X-Lovable-AIG-Run-ID") ?? undefined,
        );
        const gateway = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey: key,
          headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
          fetch: runIdFetch.fetch,
        });

        const result = streamText({
          model: gateway.responses("openai/gpt-6-astra"),
          system: `${SYSTEM_PROMPT}\n${body.concise ? "Prefer concise answers." : "Provide useful detail and examples when appropriate."}`,
          messages: await convertToModelMessages(body.messages as UIMessage[]),
          maxRetries: 0,
          providerOptions: {
            openai: {
              forceReasoning: true,
              reasoningEffort: "medium",
              reasoningSummary: "auto",
              store: false,
              include: ["reasoning.encrypted_content"],
            },
          },
        });

        return result.toUIMessageStreamResponse({
          originalMessages: body.messages as UIMessage[],
          sendReasoning: true,
          onError: (error) => (error instanceof Error ? error.message : "The AI request failed."),
        });
      },
    },
  },
});
