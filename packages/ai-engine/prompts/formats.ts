/**
 * Structured output formats expected from AURA responses.
 *
 * Design note:
 * - Schemas are strict (`additionalProperties: false`) so backend parsing in W5
 *   can fail fast when model output drifts.
 */

type JsonSchemaType =
  | "object"
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "array"
  | "null";

export type OutputFormatSchema = {
  readonly type?: JsonSchemaType;
  readonly description?: string;
  readonly properties?: Readonly<Record<string, OutputFormatSchema>>;
  readonly required?: readonly string[];
  readonly enum?: readonly string[];
  readonly items?: OutputFormatSchema;
  readonly additionalProperties?: boolean;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly minimum?: number;
  readonly maximum?: number;
};

export type OutputFormatId = "action_plan" | "summary" | "confirmation";

export type ActionPlanOutput = {
  readonly format: "action_plan";
  readonly goal: string;
  readonly steps: readonly {
    readonly id: string;
    readonly title: string;
    readonly status: "pending" | "blocked" | "ready";
    readonly rationale?: string;
  }[];
  readonly risks: readonly string[];
  readonly requiresConfirmation: boolean;
};

export type SummaryOutput = {
  readonly format: "summary";
  readonly topic: string;
  readonly bullets: readonly string[];
  readonly confidence: "low" | "medium" | "high";
  readonly citations?: readonly string[];
};

export type ConfirmationOutput = {
  readonly format: "confirmation";
  readonly action: string;
  readonly preview: string;
  readonly expiresInMinutes: number;
  readonly confirmLabel: string;
  readonly cancelLabel: string;
};

/**
 * Action-plan format:
 * - Requires explicit steps and risks so the UI can render actionable plans.
 */
export const ACTION_PLAN_SCHEMA: OutputFormatSchema = {
  type: "object",
  additionalProperties: false,
  required: ["format", "goal", "steps", "risks", "requiresConfirmation"],
  properties: {
    format: { type: "string", enum: ["action_plan"] },
    goal: { type: "string", minLength: 1, maxLength: 500 },
    steps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "title", "status"],
        properties: {
          id: { type: "string", minLength: 1, maxLength: 50 },
          title: { type: "string", minLength: 1, maxLength: 240 },
          status: {
            type: "string",
            enum: ["pending", "blocked", "ready"],
          },
          rationale: { type: "string", maxLength: 500 },
        },
      },
    },
    risks: { type: "array", items: { type: "string" } },
    requiresConfirmation: { type: "boolean" },
  },
};

/**
 * Summary format:
 * - Captures concise summary text with confidence for downstream trust UX.
 */
export const SUMMARY_SCHEMA: OutputFormatSchema = {
  type: "object",
  additionalProperties: false,
  required: ["format", "topic", "bullets", "confidence"],
  properties: {
    format: { type: "string", enum: ["summary"] },
    topic: { type: "string", minLength: 1, maxLength: 240 },
    bullets: { type: "array", items: { type: "string" } },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    citations: { type: "array", items: { type: "string" } },
  },
};

/**
 * Confirmation format:
 * - Forces a preview and expiry window to support safe action execution flows.
 */
export const CONFIRMATION_SCHEMA: OutputFormatSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "format",
    "action",
    "preview",
    "expiresInMinutes",
    "confirmLabel",
    "cancelLabel",
  ],
  properties: {
    format: { type: "string", enum: ["confirmation"] },
    action: { type: "string", minLength: 1, maxLength: 240 },
    preview: { type: "string", minLength: 1, maxLength: 2_000 },
    expiresInMinutes: { type: "integer", minimum: 1, maximum: 60 },
    confirmLabel: { type: "string", minLength: 1, maxLength: 40 },
    cancelLabel: { type: "string", minLength: 1, maxLength: 40 },
  },
};

export const OUTPUT_FORMAT_SCHEMAS: Readonly<
  Record<OutputFormatId, OutputFormatSchema>
> = {
  action_plan: ACTION_PLAN_SCHEMA,
  summary: SUMMARY_SCHEMA,
  confirmation: CONFIRMATION_SCHEMA,
};

