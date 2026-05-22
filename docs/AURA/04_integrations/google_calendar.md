# Google Calendar Integration

## OAuth Scope

Google OAuth consent must request:

- `https://www.googleapis.com/auth/calendar`

This scope is required because AURA reads events for scheduling context and creates events only after user confirmation.

## API

Protected calendar routes expect `Authorization: Bearer <google-access-token>`.

### `GET /actions/calendar`

Returns events for a date range. If no range is provided, the API reads from now through the next 7 days.

Query parameters:

- `startDate`: optional ISO-8601 date/time.
- `endDate`: optional ISO-8601 date/time.
- `timezone`: optional IANA timezone for response context.
- `limit`: optional result limit from 1 to 100.

### `POST /actions/calendar`

Creates a calendar event after confirmation.

Request fields:

- `title`: required event title.
- `startTime`: required ISO-8601 start time.
- `endTime`: optional ISO-8601 end time. Defaults to 1 hour after `startTime`.
- `description`: optional event notes.
- `attendees`: optional attendee email list.
- `confirmed`: defaults to `false`.

When `confirmed` is false, the API returns a preview and any overlapping events with `202 Accepted`. After the user approves, send the same payload with `confirmed: true` to create the event.
