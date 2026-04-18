## Description

Adds UI-only **login** and **signup** flows for the mobile app, aligned with the design reference (`screens/code/login_signup.html` / mockups).

- **Routes:** `/login` and `/signup` (Expo Router); **Welcome** “Get Started” navigates to `/login`.
- **Brand:** `AuraLogo` component (`apps/mobile/components/brand/aura-logo.tsx`) using `aura_logo.png`.
- **Layout:** `AuthScreenShell` (scroll, safe area, ambient background), `AuthHeaderBrand` (centered raster + “AURA” wordmark), shared footer patterns.
- **Fields:** `AuraTextField` extended with optional trailing slot (password visibility) and `labelClassName`.
- **UI primitives:** `AuraOrDivider` (“Or continue with”), `AuthSocialProviderRow` — **Google** and **Apple** only (max 2, UI-only; no OAuth wiring).
- **Navigation:** Login footer → signup; signup footer → login; centered footer copy using nested `Text` for links.

No backend or auth integrations yet.

## Type of Change

- [x] `feat`: New feature
- [ ] `fix`: Bug fix
- [ ] `chore`: Maintenance, config, or tooling
- [ ] `docs`: Documentation only
- [ ] `refactor`: Code change that neither fixes a bug nor adds a feature
- [ ] `test`: Adding or updating tests

## Related Issue

<!-- Link to the GitHub issue if applicable, e.g. Closes #123 -->

## Screenshots

<!-- Replace the placeholders below by attaching images in the GitHub PR UI (drag-and-drop) or by replacing with image URLs after upload. -->

| Placeholder | Description |
|-------------|-------------|
| **IMAGE_1** | Login screen |
| **IMAGE_2** | Sign up screen |

```text
[Paste or attach IMAGE_1 here — Login]
```

```text
[Paste or attach IMAGE_2 here — Sign up]
```

## Checklist

- [x] Code follows project coding guidelines (ESLint, Prettier)
- [x] Self-review completed
- [x] Comments added for complex logic where needed
- [ ] Documentation updated if applicable
- [x] No new warnings introduced
