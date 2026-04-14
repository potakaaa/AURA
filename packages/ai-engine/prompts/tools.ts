/**
 * Tool definitions for Claude tool-use registration.
 *
 * Design note:
 * - We keep this shape close to Anthropic's `name` + `description` +
 *   `input_schema` contract so backend wiring in W5 is trivial.
 */

type JsonSchemaType =
  | "object"
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "array"
  | "null";

export type ToolInputSchema = {
  readonly type?: JsonSchemaType;
  readonly description?: string;
  readonly properties?: Readonly<Record<string, ToolInputSchema>>;
  readonly required?: readonly string[];
  readonly enum?: readonly string[];
  readonly items?: ToolInputSchema;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly additionalProperties?: boolean;
};

export type ClaudeToolDefinition = {
  readonly name: string;
  readonly description: string;
  readonly input_schema: ToolInputSchema;
};

/**
 * Calendar-read schema:
 * - Date range is optional so the model can call with sensible defaults.
 * - Timezone is explicit to avoid silent date-shift bugs.
 */
const READ_CALENDAR_SCHEMA: ToolInputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    startDate: {
      type: "string",
      description: "Inclusive range start in ISO-8601 date/time.",
    },
    endDate: {
      type: "string",
      description: "Inclusive range end in ISO-8601 date/time.",
    },
    timezone: {
      type: "string",
      description: "IANA timezone (for example: Asia/Manila).",
    },
    limit: {
      type: "integer",
      description: "Maximum number of events to return.",
      minimum: 1,
      maximum: 100,
    },
  },
};

/**
 * Event creation schema:
 * - `title` and `startTime` are required minimums for a useful event draft.
 * - `requiresConfirmation` defaults true in backend policy for safe writes.
 */
const CREATE_EVENT_SCHEMA: ToolInputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "startTime"],
  properties: {
    title: {
      type: "string",
      minLength: 1,
      maxLength: 200,
      description: "Event title.",
    },
    startTime: {
      type: "string",
      description: "Event start in ISO-8601 date/time.",
    },
    endTime: {
      type: "string",
      description: "Event end in ISO-8601 date/time.",
    },
    timezone: {
      type: "string",
      description: "IANA timezone used for the event.",
    },
    description: {
      type: "string",
      description: "Optional event notes.",
      maxLength: 5_000,
    },
    attendees: {
      type: "array",
      description: "Optional attendee email list.",
      items: { type: "string" },
    },
    location: {
      type: "string",
      description: "Optional event location.",
      maxLength: 300,
    },
    requiresConfirmation: {
      type: "boolean",
      description: "Whether execution should wait for explicit user approval.",
    },
  },
};

/**
 * Drive search schema:
 * - `query` is required to prevent expensive unbounded search calls.
 */
const SEARCH_DRIVE_SCHEMA: ToolInputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["query"],
  properties: {
    query: {
      type: "string",
      minLength: 1,
      maxLength: 400,
      description: "Natural language or keyword query for drive files.",
    },
    mimeTypes: {
      type: "array",
      description: "Optional MIME type filters.",
      items: { type: "string" },
    },
    modifiedAfter: {
      type: "string",
      description: "Optional ISO-8601 lower bound for modified time.",
    },
    limit: {
      type: "integer",
      description: "Maximum number of files to return.",
      minimum: 1,
      maximum: 50,
    },
  },
};

/**
 * Email read schema:
 * - Allow either folder-based fetch or sender/thread filtering.
 * - Keep `includeBody` optional because some flows only need metadata.
 */
const READ_EMAIL_SCHEMA: ToolInputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    folder: {
      type: "string",
      enum: ["inbox", "important", "starred", "sent"],
      description: "Mailbox folder to read from.",
    },
    from: {
      type: "string",
      description: "Optional sender email filter.",
    },
    unreadOnly: {
      type: "boolean",
      description: "If true, return only unread messages.",
    },
    threadId: {
      type: "string",
      description: "Optional thread identifier for focused reads.",
    },
    includeBody: {
      type: "boolean",
      description: "If true, include message body excerpts.",
    },
    limit: {
      type: "integer",
      description: "Maximum number of messages to return.",
      minimum: 1,
      maximum: 50,
    },
  },
};

/**
 * Generic action schema:
 * - Gives AURA a bridge for non-calendar/email/drive actions in MVP.
 * - `previewOnly` supports confirmation-first flows before side effects.
 */
const EXECUTE_ACTION_SCHEMA: ToolInputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["actionType", "target"],
  properties: {
    actionType: {
      type: "string",
      description: "Action verb/category (for example: open_app, send_message).",
      minLength: 1,
      maxLength: 100,
    },
    target: {
      type: "string",
      description: "Primary action target identifier.",
      minLength: 1,
      maxLength: 300,
    },
    parameters: {
      type: "object",
      description: "Action-specific argument map.",
    },
    previewOnly: {
      type: "boolean",
      description: "If true, return execution preview without side effects.",
    },
    requiresConfirmation: {
      type: "boolean",
      description: "If true, require explicit user approval before execution.",
    },
  },
};

export const CLAUDE_TOOLS: readonly ClaudeToolDefinition[] = [
  {
    name: "read_calendar",
    description:
      "Read calendar events in a date range for planning/summarization. Example: check tomorrow's meetings before proposing new schedule.",
    input_schema: READ_CALENDAR_SCHEMA,
  },
  {
    name: "create_event",
    description:
      "Create a calendar event draft from user intent. Example: schedule a team sync next Monday at 10:00.",
    input_schema: CREATE_EVENT_SCHEMA,
  },
  {
    name: "search_drive",
    description:
      "Search cloud drive files by query and optional filters. Example: find the latest budget spreadsheet.",
    input_schema: SEARCH_DRIVE_SCHEMA,
  },
  {
    name: "read_email",
    description:
      "Read recent or filtered emails for summarization/action. Example: summarize unread emails from finance.",
    input_schema: READ_EMAIL_SCHEMA,
  },
  {
    name: "execute_action",
    description:
      "Execute or preview a generic app/system action with parameters. Example: preview sending a reminder message before confirming.",
    input_schema: EXECUTE_ACTION_SCHEMA,
  },
];

