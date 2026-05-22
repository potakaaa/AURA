import dotenv from "dotenv";
import { z } from "zod";
import { DEFAULT_GOOGLE_OAUTH_SCOPES } from "../auth/google-scopes.js";

dotenv.config();

const defaultOpenAiBaseUrl = "https://api.openai.com/v1";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  LLM_PROVIDER: z
    .enum(["openai-compatible", "openai", "ollama", "gemini"])
    .default("openai-compatible"),
  LLM_BASE_URL: z.string().url().default(defaultOpenAiBaseUrl),
  LLM_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().default("gpt-4o-mini"),
  LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  GOOGLE_OAUTH_SCOPES: z
    .string()
    .default(DEFAULT_GOOGLE_OAUTH_SCOPES.join(" ")),
}).superRefine((value, ctx) => {
  if (["openai", "gemini"].includes(value.LLM_PROVIDER) && !value.LLM_API_KEY) {
    ctx.addIssue({
      code: "custom",
      path: ["LLM_API_KEY"],
      message: `LLM_API_KEY is required when LLM_PROVIDER=${value.LLM_PROVIDER}`,
    });
  }

  if (
    ["ollama", "gemini"].includes(value.LLM_PROVIDER) &&
    value.LLM_BASE_URL === defaultOpenAiBaseUrl
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["LLM_BASE_URL"],
      message: `LLM_BASE_URL must be set when LLM_PROVIDER=${value.LLM_PROVIDER}`,
    });
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => issue.message).join(", ");
  throw new Error(`Invalid environment configuration: ${issues}`);
}

export const env = parsed.data;
