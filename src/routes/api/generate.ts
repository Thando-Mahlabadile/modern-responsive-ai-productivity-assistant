import { createLovableAiGatewayRunIdFetch } from "@/lib/ai-gateway.server";
import { createOpenAI } from "@ai-sdk/openai";
import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";
import { z } from "zod";

const requestSchema = z.discriminatedUnion("task", [
  z.object({
    task: z.literal("email"),
    purpose: z.string().trim().min(1).max(500),
    context: z.string().trim().min(1).max(5000),
    tone: z.enum(["Formal", "Friendly", "Persuasive"]),
  }),
  z.object({
    task: z.literal("meeting"),
    notes: z.string().trim().min(40).max(30000),
    concise: z.boolean(),
  }),
]);

function promptFor(input: z.infer<typeof requestSchema>) {
  if (input.task === "email") {
    return `Write a complete, ready-to-send workplace email. Include a useful subject line, natural greeting, clear body, any appropriate next step, and a professional sign-off without inventing the sender's name.\n\nPurpose: ${input.purpose}\nRecipient and context: ${input.context}\nTone: ${input.tone}\n\nReturn only the email.`;
  }

  return `Analyse the meeting notes and return exactly five sections using these markers, each on its own line:\n[SUMMARY]\n[ACTION ITEMS]\n[DECISIONS]\n[DEADLINES]\n[KEY POINTS]\n\nUse bullet points where appropriate. Do not invent facts, owners, decisions, or dates; explicitly say when none were captured. ${input.concise ? "Keep every section concise." : "Include useful detail while remaining clear."}\n\nMeeting notes:\n${input.notes}`;
}

function statusFromError(error: unknown) {
  const candidate = error as { statusCode?: number; status?: number };
  return candidate.statusCode ?? candidate.status ?? 500;
}

export const Route = createFileRoute("/api/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = requestSchema.safeParse(await request.json());
        if (!parsed.success) {
          return Response.json({ error: "Please check the information and try again." }, { status: 400 });
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) {
          return Response.json({ error: "AI is not configured yet." }, { status: 500 });
        }

        try {
          const runIdFetch = createLovableAiGatewayRunIdFetch();
          const gateway = createOpenAI({
            baseURL: "https://ai.gateway.lovable.dev/v1",
            apiKey: key,
            headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
            fetch: runIdFetch.fetch,
          });
          const result = streamText({
            model: gateway.responses("openai/gpt-6-astra"),
            prompt: promptFor(parsed.data),
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
          const text = await result.text;
          if (!text.trim()) throw new Error("The AI returned an empty response.");
          return Response.json({ text });
        } catch (error) {
          const status = statusFromError(error);
          const message = error instanceof Error ? error.message : "The AI request failed.";
          return Response.json({ error: message }, { status });
        }
      },
    },
  },
});