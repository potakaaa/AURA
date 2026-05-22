export const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";

export const DEFAULT_GOOGLE_OAUTH_SCOPES = [
  "openid",
  "email",
  "profile",
  GOOGLE_CALENDAR_SCOPE,
] as const;

