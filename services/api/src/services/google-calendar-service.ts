export type CalendarAttendee = {
  email: string;
  displayName?: string;
  responseStatus?: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  attendees: CalendarAttendee[];
  location?: string;
  htmlLink?: string;
};

export type CalendarEventInput = {
  title: string;
  startTime: string;
  endTime: string;
  timezone?: string;
  description?: string;
  attendees?: string[];
  location?: string;
};

export type CalendarServiceOptions = {
  accessToken: string;
  fetchFn?: typeof fetch;
  baseUrl?: string;
  calendarId?: string;
};

type GoogleCalendarEventDate = {
  date?: string;
  dateTime?: string;
  timeZone?: string;
};

type GoogleCalendarEvent = {
  id?: string;
  summary?: string;
  start?: GoogleCalendarEventDate;
  end?: GoogleCalendarEventDate;
  description?: string;
  attendees?: CalendarAttendee[];
  location?: string;
  htmlLink?: string;
};

type GoogleCalendarEventsResponse = {
  items?: GoogleCalendarEvent[];
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

export class GoogleCalendarError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code:
      | "permission_denied"
      | "calendar_api_error"
      | "invalid_calendar_response",
  ) {
    super(message);
    this.name = "GoogleCalendarError";
  }
}

export class GoogleCalendarService {
  private readonly fetchFn: typeof fetch;
  private readonly baseUrl: string;
  private readonly calendarId: string;

  constructor(private readonly options: CalendarServiceOptions) {
    this.fetchFn = options.fetchFn ?? fetch;
    this.baseUrl = options.baseUrl ?? "https://www.googleapis.com/calendar/v3";
    this.calendarId = options.calendarId ?? "primary";
  }

  async listEvents(params: {
    startTime: string;
    endTime: string;
    limit?: number;
  }): Promise<CalendarEvent[]> {
    const url = this.calendarUrl("/events");
    url.searchParams.set("timeMin", params.startTime);
    url.searchParams.set("timeMax", params.endTime);
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");
    url.searchParams.set("maxResults", String(params.limit ?? 50));

    const payload = await this.fetchGoogle<GoogleCalendarEventsResponse>(url, {
      method: "GET",
    });

    return (payload.items ?? []).map(normalizeGoogleEvent);
  }

  async createEvent(input: CalendarEventInput): Promise<CalendarEvent> {
    const url = this.calendarUrl("/events");
    const timezone = input.timezone ?? "UTC";
    const payload = await this.fetchGoogle<GoogleCalendarEvent>(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        summary: input.title,
        description: input.description,
        location: input.location,
        start: {
          dateTime: input.startTime,
          timeZone: timezone,
        },
        end: {
          dateTime: input.endTime,
          timeZone: timezone,
        },
        attendees: input.attendees?.map((email) => ({ email })),
      }),
    });

    return normalizeGoogleEvent(payload);
  }

  private calendarUrl(path: string): URL {
    return new URL(
      `${this.baseUrl}/calendars/${encodeURIComponent(this.calendarId)}${path}`,
    );
  }

  private async fetchGoogle<T>(url: URL, init: RequestInit): Promise<T> {
    const response = await this.fetchFn(url, {
      ...init,
      headers: {
        authorization: `Bearer ${this.options.accessToken}`,
        ...init.headers,
      },
    });

    const payload = (await response.json().catch(() => ({}))) as GoogleCalendarEventsResponse;

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new GoogleCalendarError(
          "Calendar permission was denied. Please reconnect Google Calendar and try again.",
          response.status,
          "permission_denied",
        );
      }

      throw new GoogleCalendarError(
        payload.error?.message ??
          "Google Calendar could not complete the request. Please try again.",
        response.status,
        "calendar_api_error",
      );
    }

    return payload as T;
  }
}

export function normalizeGoogleEvent(event: GoogleCalendarEvent): CalendarEvent {
  const start = event.start?.dateTime ?? event.start?.date;
  const end = event.end?.dateTime ?? event.end?.date;

  if (!event.id || !start || !end) {
    throw new GoogleCalendarError(
      "Google Calendar returned an event AURA could not read.",
      502,
      "invalid_calendar_response",
    );
  }

  const normalized: CalendarEvent = {
    id: event.id,
    title: event.summary ?? "(Untitled event)",
    start,
    end,
    attendees: event.attendees ?? [],
  };

  if (event.description) {
    normalized.description = event.description;
  }

  if (event.location) {
    normalized.location = event.location;
  }

  if (event.htmlLink) {
    normalized.htmlLink = event.htmlLink;
  }

  return normalized;
}

export function findOverlappingEvents(
  candidate: { start: string; end: string },
  events: CalendarEvent[],
): CalendarEvent[] {
  const candidateStart = Date.parse(candidate.start);
  const candidateEnd = Date.parse(candidate.end);

  return events.filter((event) => {
    const eventStart = Date.parse(event.start);
    const eventEnd = Date.parse(event.end);
    return candidateStart < eventEnd && candidateEnd > eventStart;
  });
}
