import { Router } from "express";
import { z } from "zod";
import {
  GoogleCalendarError,
  GoogleCalendarService,
  findOverlappingEvents,
} from "../services/google-calendar-service.js";
import type {
  CalendarEvent,
  CalendarEventInput,
} from "../services/google-calendar-service.js";

const DEFAULT_EVENT_DURATION_MS = 60 * 60 * 1000;
const DEFAULT_RANGE_DAYS = 7;

const calendarQuerySchema = z.object({
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional(),
  timezone: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const createEventSchema = z.object({
  title: z.string().trim().min(1).max(200),
  startTime: z.string().datetime({ offset: true }),
  endTime: z.string().datetime({ offset: true }).optional(),
  timezone: z.string().min(1).default("UTC"),
  description: z.string().max(5_000).optional(),
  attendees: z.array(z.string().email()).optional(),
  location: z.string().max(300).optional(),
  confirmed: z.boolean().default(false),
});

export type CalendarRouteOptions = {
  fetchFn?: typeof fetch;
  now?: () => Date;
};

export function createCalendarRoute(options: CalendarRouteOptions = {}) {
  const route = Router();
  const now = options.now ?? (() => new Date());

  route.get("/calendar", async (req, res) => {
    const auth = readBearerToken(req.headers.authorization);
    if (!auth) {
      return res.status(401).json({
        error: "Please connect Google Calendar before asking AURA to read events.",
        code: "missing_calendar_auth",
      });
    }

    const parsed = calendarQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Please provide a valid calendar date range.",
        code: "invalid_date_range",
        details: parsed.error.flatten(),
      });
    }

    const range = resolveRange(parsed.data.startDate, parsed.data.endDate, now());
    if (!range.ok) {
      return res.status(400).json(range.error);
    }

    try {
      const calendar = new GoogleCalendarService({
        accessToken: auth,
        fetchFn: options.fetchFn,
      });
      const events = await calendar.listEvents({
        startTime: range.startTime,
        endTime: range.endTime,
        limit: parsed.data.limit,
      });

      return res.json({
        range: {
          startTime: range.startTime,
          endTime: range.endTime,
          timezone: parsed.data.timezone ?? "UTC",
        },
        events,
      });
    } catch (error) {
      return writeCalendarError(res, error);
    }
  });

  route.post("/calendar", async (req, res) => {
    const auth = readBearerToken(req.headers.authorization);
    if (!auth) {
      return res.status(401).json({
        error: "Please connect Google Calendar before asking AURA to create events.",
        code: "missing_calendar_auth",
      });
    }

    const parsed = createEventSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Please provide a valid event title and start/end time.",
        code: "invalid_event",
        details: parsed.error.flatten(),
      });
    }

    const eventInput = withResolvedEndTime(parsed.data);
    const invalidTime = validateEventTimes(eventInput.startTime, eventInput.endTime);
    if (invalidTime) {
      return res.status(400).json(invalidTime);
    }

    try {
      const calendar = new GoogleCalendarService({
        accessToken: auth,
        fetchFn: options.fetchFn,
      });
      const conflicts = await calendar.listEvents({
        startTime: eventInput.startTime,
        endTime: eventInput.endTime,
        limit: 20,
      });
      const overlappingEvents = findOverlappingEvents(
        { start: eventInput.startTime, end: eventInput.endTime },
        conflicts,
      );
      const preview = toEventPreview(eventInput);

      if (!parsed.data.confirmed) {
        return res.status(202).json({
          requiresConfirmation: true,
          message: overlappingEvents.length
            ? "This event overlaps with existing calendar events. Please confirm before AURA creates it."
            : "Please confirm before AURA creates this calendar event.",
          preview,
          conflicts: overlappingEvents,
        });
      }

      const createdEvent = await calendar.createEvent(eventInput);
      return res.status(201).json({
        event: createdEvent,
        conflicts: overlappingEvents,
        warning: overlappingEvents.length
          ? "Created after confirmation, but it overlaps with existing events."
          : undefined,
      });
    } catch (error) {
      return writeCalendarError(res, error);
    }
  });

  return route;
}

export const calendarRoute = createCalendarRoute();

function readBearerToken(header: string | undefined): string | undefined {
  const match = /^Bearer\s+(.+)$/i.exec(header ?? "");
  return match?.[1];
}

function resolveRange(
  startDate: string | undefined,
  endDate: string | undefined,
  now: Date,
):
  | { ok: true; startTime: string; endTime: string }
  | { ok: false; error: { error: string; code: string } } {
  const start = startDate ? new Date(startDate) : now;
  const end = endDate
    ? new Date(endDate)
    : new Date(start.getTime() + DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return {
      ok: false,
      error: {
        error: "AURA could not understand that calendar date range.",
        code: "invalid_date_range",
      },
    };
  }

  if (end <= start) {
    return {
      ok: false,
      error: {
        error: "Calendar end time must be after the start time.",
        code: "invalid_date_range",
      },
    };
  }

  return {
    ok: true,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  };
}

function withResolvedEndTime(input: z.infer<typeof createEventSchema>): CalendarEventInput {
  const start = new Date(input.startTime);
  const endTime =
    input.endTime ?? new Date(start.getTime() + DEFAULT_EVENT_DURATION_MS).toISOString();

  return {
    title: input.title,
    startTime: input.startTime,
    endTime,
    timezone: input.timezone,
    description: input.description,
    attendees: input.attendees,
    location: input.location,
  };
}

function validateEventTimes(
  startTime: string,
  endTime: string,
): { error: string; code: string } | undefined {
  const start = Date.parse(startTime);
  const end = Date.parse(endTime);

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return {
      error: "AURA could not understand the event date or time.",
      code: "invalid_date",
    };
  }

  if (end <= start) {
    return {
      error: "Calendar event end time must be after the start time.",
      code: "invalid_date",
    };
  }

  return undefined;
}

function toEventPreview(input: CalendarEventInput) {
  return {
    title: input.title,
    startTime: input.startTime,
    endTime: input.endTime,
    timezone: input.timezone ?? "UTC",
    description: input.description,
    attendees: input.attendees ?? [],
    location: input.location,
  };
}

function writeCalendarError(
  res: {
    status: (code: number) => {
      json: (payload: Record<string, unknown>) => unknown;
    };
  },
  error: unknown,
) {
  if (error instanceof GoogleCalendarError) {
    return res.status(error.status).json({
      error: error.message,
      code: error.code,
    });
  }

  return res.status(502).json({
    error: "Google Calendar could not complete the request. Please try again.",
    code: "calendar_api_error",
  });
}

