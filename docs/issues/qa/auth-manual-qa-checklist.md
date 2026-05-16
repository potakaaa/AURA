# Auth Manual QA Checklist (MVP)

## Preconditions

- Valid Supabase env values are set in `apps/mobile/.env`:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- App launched from `apps/mobile` via `pnpm start` (or platform-specific script).

## Test Cases

1. Login success
- Go to `/login`.
- Enter a valid registered email/password.
- Tap `Sign In`.
- Expected: request succeeds, user lands in `/(tabs)`.

2. Login validation: empty fields
- Go to `/login`.
- Leave email and/or password empty.
- Tap `Sign In`.
- Expected: inline error appears, no request is sent.

3. Login validation: invalid email format
- Go to `/login`.
- Enter malformed email (example: `user@`).
- Tap `Sign In`.
- Expected: inline email format error appears, no request is sent.

4. Login failure: invalid credentials
- Go to `/login`.
- Enter non-matching credentials.
- Tap `Sign In`.
- Expected: user-friendly error appears (`Invalid email or password.`).

5. Signup success
- Go to `/signup`.
- Fill display name, valid new email, password, confirm password.
- Tap `Create account`.
- Expected: account creation succeeds and user is redirected to `/(tabs)`.

6. Signup validation: required fields
- Go to `/signup`.
- Leave one or more fields empty.
- Tap `Create account`.
- Expected: inline required-fields error appears, no request is sent.

7. Signup validation: password confirmation mismatch
- Go to `/signup`.
- Enter different values for password and confirm password.
- Tap `Create account`.
- Expected: inline mismatch error appears, no request is sent.

8. Loading states
- On `/login` and `/signup`, submit valid forms.
- Expected: auth button is disabled while request is in progress and label shows loading text.
- In Settings, tap `Log out`.
- Expected: logout button is disabled while request is in progress.

9. Session restore on app relaunch
- Login successfully.
- Fully close and relaunch the app.
- Expected: existing session restores; user remains in `/(tabs)`.

10. Route gating for unauthenticated users
- Ensure logged out.
- Attempt to open any `/(tabs)` route.
- Expected: user is redirected to `/welcome`.

11. Logout flow
- While authenticated, open Settings.
- Tap `Log out`.
- Expected: session is cleared and user returns to auth flow (`/welcome`).

12. Social provider buttons
- On `/login` and `/signup`, inspect social provider actions.
- Expected: provider buttons are visibly disabled for MVP and not interactive.
