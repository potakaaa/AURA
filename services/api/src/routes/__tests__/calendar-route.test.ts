import assert from "node:assert/strict";
import test from "node:test";
import { createCalendarRoute } from "../calendar-route.js";
import type { CalendarRouteOptions } from "../calendar-route.js";

type JsonObject = Record<string, unknown>;
type RouteHandler = {
  handle(
    req: unknown,
    res: unknown,
    next: (error?: unknown) => void,
  ): void;
};

async function callRoute(options: {
  routeOptions: CalendarRouteOptions;
  method: "GET" | "POST";
  url?: string;
  query?: JsonObject;
  body?: JsonObject;
  authorization?: string;
}) {
  const route = createCalendarRoute(options.routeOptions) as unknown as RouteHandler;

  return await new Promise<{ status: number; body: JsonObject }>(
    (resolve, reject) => {
      let status = 200;
      const req = {
        method: options.method,
        url: options.url ?? "/calendar",
        originalUrl: `/actions${options.url ?? "/calendar"}`,
        query: options.query ?? {},
        body: options.body ?? {},
        headers: {
          authorization: options.authorization ?? "Bearer google-token",
        },
      };
      const res = {
        status(code: number) {
          status = code;
          return this;
        },
        json(payload: JsonObject) {
          resolve({ status, body: payload });
          return this;
        },
      };

      route.handle(req, res, reject);
    },
  );
}

test("GET /actions/calendar returns default date range events", async () => {
  const fetchCalls: URL[] = [];
  const fetchFn: typeof fetch = async (input) => {
    const url = input instanceof URL ? input : new URL(String(input));
    fetchCalls.push(url);

    return Response.json({
      items: [
        {
          id: "event-1",
          summary: "Planning",
          start: { dateTime: "2026-05-22T10:00:00.000Z" },
          end: { dateTime: "2026-05-22T10:30:00.000Z" },
          attendees: [{ email: "alex@example.com" }],
        },
      ],
    });
  };

  const response = await callRoute({
    routeOptions: {
      fetchFn,
      now: () => new Date("2026-05-22T00:00:00.000Z"),
    },
    method: "GET",
  });

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.range, {
    startTime: "2026-05-22T00:00:00.000Z",
    endTime: "2026-05-29T00:00:00.000Z",
    timezone: "UTC",
  });
  assert.deepEqual(response.body.events, [
    {
      id: "event-1",
      title: "Planning",
      start: "2026-05-22T10:00:00.000Z",
      end: "2026-05-22T10:30:00.000Z",
      attendees: [{ email: "alex@example.com" }],
    },
  ]);
  assert.equal(fetchCalls[0]?.searchParams.get("timeMin"), "2026-05-22T00:00:00.000Z");
  assert.equal(fetchCalls[0]?.searchParams.get("timeMax"), "2026-05-29T00:00:00.000Z");
});

test("POST /actions/calendar returns a confirmation preview with conflicts", async () => {
  const fetchFn: typeof fetch = async () =>
    Response.json({
      items: [
        {
          id: "busy-1",
          summary: "Existing meeting",
          start: { dateTime: "2026-05-23T07:30:00.000Z" },
          end: { dateTime: "2026-05-23T08:30:00.000Z" },
        },
      ],
    });

  const response = await callRoute({
    routeOptions: { fetchFn },
    method: "POST",
    body: {
      title: "Meet Alex",
      startTime: "2026-05-23T08:00:00.000Z",
      endTime: "2026-05-23T09:00:00.000Z",
      attendees: ["alex@example.com"],
    },
  });

  assert.equal(response.status, 202);
  assert.equal(response.body.requiresConfirmation, true);
  assert.deepEqual(response.body.preview, {
    title: "Meet Alex",
    startTime: "2026-05-23T08:00:00.000Z",
    endTime: "2026-05-23T09:00:00.000Z",
    timezone: "UTC",
    description: undefined,
    attendees: ["alex@example.com"],
    location: undefined,
  });
  assert.deepEqual(response.body.conflicts, [
    {
      id: "busy-1",
      title: "Existing meeting",
      start: "2026-05-23T07:30:00.000Z",
      end: "2026-05-23T08:30:00.000Z",
      attendees: [],
    },
  ]);
});

test("POST /actions/calendar creates events after confirmation", async () => {
  const methods: string[] = [];
  const fetchFn: typeof fetch = async (_input, init) => {
    methods.push(init?.method ?? "GET");
    if (init?.method === "POST") {
      return Response.json(
        {
          id: "created-1",
          summary: "Meet Alex",
          start: { dateTime: "2026-05-23T08:00:00.000Z" },
          end: { dateTime: "2026-05-23T09:00:00.000Z" },
          attendees: [{ email: "alex@example.com" }],
        },
        { status: 200 },
      );
    }

    return Response.json({ items: [] });
  };

  const response = await callRoute({
    routeOptions: { fetchFn },
    method: "POST",
    body: {
      title: "Meet Alex",
      startTime: "2026-05-23T08:00:00.000Z",
      endTime: "2026-05-23T09:00:00.000Z",
      attendees: ["alex@example.com"],
      confirmed: true,
    },
  });

  assert.equal(response.status, 201);
  assert.deepEqual(methods, ["GET", "POST"]);
  assert.deepEqual(response.body.event, {
    id: "created-1",
    title: "Meet Alex",
    start: "2026-05-23T08:00:00.000Z",
    end: "2026-05-23T09:00:00.000Z",
    attendees: [{ email: "alex@example.com" }],
  });
});

test("calendar routes return user-friendly permission errors", async () => {
  const fetchFn: typeof fetch = async () =>
    Response.json(
      {
        error: {
          message: "Request had insufficient authentication scopes.",
        },
      },
      { status: 403 },
    );

  const response = await callRoute({
    routeOptions: { fetchFn },
    method: "GET",
  });

  assert.equal(response.status, 403);
  assert.deepEqual(response.body, {
    error:
      "Calendar permission was denied. Please reconnect Google Calendar and try again.",
    code: "permission_denied",
  });
});

