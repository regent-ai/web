import { convertToModelMessages, stepCountIs, streamText, UIMessage } from "ai";
import { tool } from "ai";
import z from "zod";
import { env } from "@/lib/env";

export const maxDuration = 30;

export const POST = async (request: Request) => {
  const { messages, model }: { messages: UIMessage[]; model: string } =
    await request.json();

  const result = streamText({
    model,
    tools: {
      "hello-local": tool({
        description: "Receive a greeting",
        inputSchema: z.object({
          name: z.string(),
        }),
        execute: async (args) => {
          return `Hello ${args.name}`;
        },
      }),
    },
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    system: "You are a helpful AI assistant.",
  });
  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
    messageMetadata: () => ({ network: env.NETWORK }),
  });
};
