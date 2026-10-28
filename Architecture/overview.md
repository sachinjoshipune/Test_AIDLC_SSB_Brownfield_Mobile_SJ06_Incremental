<!-- filepath: Architecture/overview.md -->
# SB360 Mobile Application — Architecture Overview

**Spec source:** `Specifications/currentspec.md` v1.0 (2026-10-21)
**Scope of this architecture:** Global Bottom Navigation Bar (Explore, Map, Plan, My Profile), bilingual (English/Arabic, LTR/RTL) localization, resilient navigation failure handling, and the client-side integration layer against the existing (currently undocumented) SB360 backend API.

---

## 1. System Context

SB360 is a **hybrid mobile application** built with **React Native**, shipping from a single codebase to iOS and Android. The single actor in scope is the **Visitor** (Spec §9 RBAC — no multi-role differentiation). The app integrates with one external system: the **SB360 Backend API** (existing, undocumented at spec time; Spec §3, §11 Decision #2), accessed through six placeholder REST contracts (API-001 through API-006, Spec §5). A secondary, not-yet-selected **Error/Crash Telemetry Service** (Spec §9, §12 Open Question #4) receives client-side audit/telemetry events without PII.

No other systems, actors, or backends are in scope. Nothing is invented beyond what Spec §1.3, §5, and §9 describe.

## 2. Roles / Actors

| Actor | Description | Source |
|---|---|---|
| **Visitor** | The single end-user role interacting with the SB360 mobile app; may be anonymous or authenticated (Bearer/JWT) depending on endpoint. No RBAC differentiation. | Spec §9, §11 Decision #6 |

## 3. External Systems / Integrations

| System | Purpose | Contract | Source |
|---|---|---|---|
| **SB360 Backend API** | Navigation config, localized strings, profile data/language update, section content, health check | API-001…API-006 (Spec §5), REST/JSON over TLS 1.2+, Bearer JWT where noted | Spec §5, §8.2 |
| **Error/Crash Telemetry Service** (vendor TBD) | Receives structured audit events for all state transitions (Spec §6) and crash/error telemetry; no PII fields | Event payload (TBD) | Spec §9, §1.3, §12 Q4 |
| **Device Secure Storage (Keychain/Keystore)** | Stores PII (`email`, `displayName`) and auth tokens | OS secure key-value store | Spec §7.2, §9 |
| **Device Local Storage (AsyncStorage)** | Caches non-PII data: language preference, last-active tab, cached nav config | OS key-value store | Spec §7.2, §1.3 |

## 4. Technology Stack (Resolved — Spec §8.1)

| Layer | Technology | Rationale (from spec) |
|---|---|---|
| Mobile framework | React Native (latest stable LTS, e.g., 0.74.x) | Mandated in Source 2 |
| Language | TypeScript | Production-readiness, type safety against placeholder contracts |
| Navigation | React Navigation (bottom-tab navigator) | Native RTL support, de facto standard |
| State management | Redux Toolkit | Predictable state machines (Section 6 of spec) |
| Localization | i18next + react-i18next, react-native-localize | Namespaced translations matching API-002 shape; RTL via `I18nManager` |
| Secure storage | react-native-keychain (PII/tokens) + AsyncStorage (non-PII) | PII/non-PII separation (Spec §7.2) |
| HTTP client | Axios, single centralized `apiClient` module with interceptors | Consistent error-to-UI mapping (Spec §5) |
| CI/CD | GitHub Actions (build/lint/type-check/test on PR) + Fastlane (release builds on tag) | No CI specified in sources; standard low-friction choice |
| Env config | react-native-config, per-environment `.env` files (never committed) | Backend-URL placeholder swap without code changes |
| Repo hygiene | `.gitignore` (node_modules, Pods, build outputs, `.env*`, keystores, IDE files) | Explicit Source 2 requirement |
| Dev-preview tooling (additive, non-production) | Expo (`expo`, `babel-preset-expo`, `expo/metro-config`) + `react-native-web` for `expo start --web`; `dev-mock-server/server.js` (dependency-free Node HTTP server implementing API-001..API-006 response shapes) | Enables fast, no-device browser preview during development, including a working Bottom Navigation Bar/section content/profile flow with no real backend available yet. Does **not** change the Locked Stack below — iOS/Android builds still use React Native CLI directly and the real (external, undocumented) SB360 Backend API. Native-only modules (`react-native-keychain`, `react-native-config`) ship web-only `*.web.ts` fallbacks (in-memory storage, placeholder env values) used exclusively by the web preview build; the web-only env variant also permits plain `http://localhost` (not just HTTPS) solely so it can target the local mock server. |

## 5. Container-Level Architecture

The mobile app is a **single React Native codebase** (one container) producing two native shells (iOS/Android), structured into internal modules (treated as components at Level 3):

- **Navigation Module** — renders the Bottom Navigation Bar (276×53dp), owns `NavigationTab` state machine, fetches/caches API-001.
- **Localization Module (i18n)** — manages `LocalePreference`/`UILayoutDirection` state machines, consumes API-002, bundled fallback strings.
- **Profile Module** — My Profile screen, language switch control, consumes/updates API-003/API-004.
- **Section Screens** (Explore, Map, Plan) — consume API-005 placeholder content per section.
- **API Client Module** — single Axios instance, `API_BASE_URL` + `API_TIMEOUT_MS=10000`, interceptor-based error mapping (Spec §5, §8.2).
- **Error/Resilience Module** — drives `ScreenLoad` state machine, Retry/Return-to-Home UI (Spec §6.1, §10).
- **Local Persistence** — AsyncStorage (non-PII) + Keychain/Keystore (PII/tokens) (Spec §7.2).

## 6. Key Data Entities (Spec §7.1)

`NavigationItem`, `UserProfile`, `LocalePreference`, `NavigationErrorEvent`, `SessionState` — see spec for full attribute lists. PII fields (`email`, `displayName`) are isolated to secure storage only (Spec §7.2).

## 7. State Machines (Spec §6 — MANDATORY, drives Level 3/4 design)

1. **NavigationTab**: `inactive ↔ active`, single-active-tab enforced.
2. **ScreenLoad**: `idle → loading → loaded | error`; `error → loading` (Retry, throttled 3x/60s) or `error → idle(Explore)` (Return to Home).
3. **LocalePreference**: `en ↔ ar`, persisted via API-003 or deferred to local cache with `pending_sync → synced` on reconnect.
4. **UILayoutDirection**: `LTR ↔ RTL`, derived atomically from `LocalePreference`.

Invalid transitions are rejected client-side and logged as `*.transition.rejected` (Spec §6.3) — never leaving the UI in an undefined state.

## 8. Integration & Resilience Design

- All backend calls route through the single `apiClient` (Axios) module, timeout **10,000 ms** (Spec §8.2, §5).
- On 4xx/5xx/timeout: configured localized error message + **Retry** + **Return to Home** (Explore) actions, never a blank screen (Spec §5, §10).
- Placeholder contracts (API-001–API-006) are versioned under `/api/v1/` and designed to be swapped for real backend contracts via configuration/schema changes only — no structural refactor (Spec §10, Goal 3).

## 9. Security & Compliance (Spec §9)

- TLS 1.2+ for all API calls; no cleartext HTTP in any build.
- Secrets via `.env` files, excluded from source control, injected via CI/CD secret store.
- Bearer/JWT tokens stored only in Keychain/Keystore, never AsyncStorage or logs.
- Client-side payload validation before transmission; server response schema validation before applying to app state.
- No raw stack traces/internal error codes in user-facing messages.
- On 401 (auth failure/token expiry): reset to safe defaults (Explore tab, device-detected locale).
- All Section 6 state transitions emit audit events to the telemetry service, PII-free.
- Third-party packages pinned to exact versions.

## 10. Architectural Decisions (traceable to Spec §11)

| Decision | Rationale |
|---|---|
| Bottom Navigation Bar only (no top bar/drawer) | No design detail provided for other nav bars (Spec §11 #1) |
| Placeholder API contracts under `/api/v1/` | Backend undocumented; enables parallel delivery (Spec §11 #2) |
| React Native, sole framework | Explicit Source 2 mandate (Spec §11 #3) |
| React Navigation + Redux Toolkit + i18next stack | Supports RTL and the Section 6 state machines (Spec §11 #4) |
| Production-readiness = gitignore + env config + abstracted API client + secure storage + resilient errors | Reasonable default for "production ready" (Spec §11 #5) |
| Bearer/JWT assumed auth | Standard REST practice, flagged as assumption (Spec §11 #6) |

## 11. Out of Scope (Spec §1.2)

Top/side/drawer navigation bars, backend implementation/DB design, screen business logic beyond navigation entry points, native modules beyond nav/i18n/secure-storage needs, non-English/Arabic locales, web/desktop builds.

## 12. Cross-Level Traceability

| Level | Reflects |
|---|---|
| Level 1 (Context) | Visitor, SB360 Mobile App, SB360 Backend API, Telemetry Service, Device Secure/Local Storage |
| Level 2 (Container) | Single React Native App container + SB360 Backend API container + Telemetry + Keychain/AsyncStorage containers |
| Level 3 (Component) | Navigation, Localization, Profile, Section Screens, API Client, Error/Resilience, Persistence components inside the RN App container |
| Level 4 (Code) | `NavigationTab`, `ScreenLoad`, `LocalePreference`, `UILayoutDirection` state machine classes; `NavigationItem`, `UserProfile`, `LocalePreference`, `NavigationErrorEvent`, `SessionState` entities; `ApiClient` class |

---

## Locked Stack
- Backend: Existing SB360 Backend API (external, undocumented, REST/JSON over TLS 1.2+) — no server-side code owned by this spec
- Frontend: React Native (latest stable LTS, e.g., 0.74.x) / TypeScript, React Navigation (bottom-tab), Redux Toolkit, i18next/react-i18next + react-native-localize
- Database: N/A — mobile client only; server-side persistence owned by external backend (out of scope)
- Auth: Bearer token (JWT), assumed per Spec §8.2/§11 Decision #6, stored in device Keychain/Keystore
- Messaging: N/A
- Storage: AsyncStorage (non-PII: language preference, cached nav config, last-active tab) + react-native-keychain (PII: email, displayName, tokens)
- Deployment: GitHub Actions (CI: build/lint/type-check/test on PR) + Fastlane (release builds for iOS/Android on tag); react-native-config for per-environment `.env` files

<!-- Generated by ATOS AI-DLC | Execution: f095c16e-e50d-4877-8d3f-4c6f9b456d64 | 2026-10-21T06:54:36.726Z -->