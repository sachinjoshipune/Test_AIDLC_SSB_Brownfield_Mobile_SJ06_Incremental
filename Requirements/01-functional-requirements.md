# Functional Requirements — SB360 Mobile Application (Navigation & Localization)

**Derived from:** `Specifications/currentspec.md` v1.0 (2026-10-21)
**Scope:** Bottom Navigation Bar, bilingual (English/Arabic) support, placeholder backend integration, production-readiness baseline.

---

## 1. Navigation — Core Requirements

## FR-001: Global Bottom Navigation Bar Rendering
**Priority:** High
**Category:** Navigation / UI
**Description:** The system shall render a persistent Bottom Navigation Bar (dimensions 276dp width × 53dp height) on all primary screens: Explore, Map, Plan, and My Profile, on both iOS and Android.
**Acceptance Criteria:** Bar is visible, correctly sized, and contains four items (Explore, Map, Plan, My Profile) on every primary screen render.
**Dependencies:** API-001 (`GET /api/v1/navigation/config`), React Navigation bottom-tab navigator.
**Source:** Spec §1.1, §2, §10.

## FR-002: Navigation Item Selection
**Priority:** High
**Category:** Navigation
**Description:** The system shall allow a visitor to tap a navigation item to transition the corresponding `NavigationTab` entity from `inactive` to `active`, provided the target route exists in the navigation configuration.
**Acceptance Criteria:** Tapping a valid nav item activates it and triggers `nav.tab.selected` audit event with `tabId` and `timestamp`.
**Dependencies:** FR-005 (navigation config retrieval); State Model §6.1 (NavigationTab `inactive → active`).
**Source:** Spec §6.1.

## FR-003: Single Active Tab Enforcement
**Priority:** High
**Category:** Navigation
**Description:** The system shall ensure only one `NavigationTab` is in the `active` state at any time. Selecting a new tab shall automatically deactivate the previously active tab (`active → inactive`) before activating the new one.
**Acceptance Criteria:** At no point in any navigation transition sequence do two tabs simultaneously report `active = true`; `nav.tab.deselected` audit event fires for the previous tab prior to `nav.tab.selected` for the new tab.
**Dependencies:** FR-002; State Model §6.1.
**Source:** Spec §1.1, §6.1, §10.

## FR-004: Navigation State Persistence Across Screens
**Priority:** Medium
**Category:** Navigation / Session
**Description:** The system shall persist `SessionState` (`activeTabId`, `lastVisitedRoute`, `appLaunchTimestamp`) in memory and to local device storage, restoring the last-active tab/route on session continuation within the app.
**Acceptance Criteria:** Navigating away and returning to the app (without full termination/reinstall) restores the previously active tab and route.
**Dependencies:** `SessionState` entity (Data Model §7.1); AsyncStorage (non-sensitive, Section 8.1).
**Source:** Spec §7.1, §1.1 ("persistence of navigation state").

## FR-005: Navigation Configuration Retrieval
**Priority:** High
**Category:** Integration
**Description:** The system shall retrieve the ordered list of navigation items (`id`, `label`, `icon`, `route`, `order`) from the backend via API-001 (`GET /api/v1/navigation/config`), optionally parameterized by `locale`, and cache the result locally for offline resilience.
**Acceptance Criteria:** On successful 2xx response, `NavigationItem` entities are populated and rendered in the Bottom Navigation Bar in the returned `order`; on failure, cached config (if present) is used as fallback.
**Dependencies:** API-001; `NavigationItem` entity (Data Model §7.1).
**Source:** Spec §5 (API-001), §7.1.

## FR-006: Error Handling on Navigation/Screen Load Failure
**Priority:** High
**Category:** Resilience
**Description:** When a navigation target fails to load (route resolution failure, API-005 4xx/5xx, or timeout > 10,000 ms), the system shall transition `ScreenLoad` from `loading` to `error`, display a configured, non-blank, localized error message, and never leave the visitor on a blank or broken screen.
**Acceptance Criteria:** Any failed screen load results in a visible error state offering Retry and Return to Home actions; `nav.screen.load.failure` audit event fires with `errorCode` and `route`.
**Dependencies:** API-005; State Model §6.1 (`ScreenLoad: loading → error`); FR-007, FR-008.
**Source:** Spec §5 (client-side error handling contract), §6.1, §10.

## FR-007: Retry Navigation Action
**Priority:** High
**Category:** Resilience
**Description:** From the `error` state, the system shall allow the visitor to tap Retry to re-invoke the failed call, transitioning `ScreenLoad` from `error` back to `loading`, subject to a throttle of fewer than 3 retry attempts within a rolling 60-second window.
**Acceptance Criteria:** Retry re-triggers the original failed request; a 4th retry attempt within 60 seconds is rejected client-side (see FR-019) rather than re-invoked; `nav.screen.retry` audit event fires on each accepted retry.
**Dependencies:** FR-006; State Model §6.1 (`ScreenLoad: error → loading`, guard: retry count < 3 / 60s).
**Source:** Spec §6.1.

## FR-008: Return to Home (Safe Screen) Action
**Priority:** High
**Category:** Resilience
**Description:** From the `error` state, the system shall always allow the visitor to tap "Return to Home," navigating to the Explore screen as the safe default and transitioning `ScreenLoad` from `error` to `idle`.
**Acceptance Criteria:** Return to Home is always enabled (not throttled) and always succeeds in navigating to Explore; `nav.screen.recover` audit event fires.
**Dependencies:** FR-006; State Model §6.1 (`ScreenLoad: error → idle (Explore)`).
**Source:** Spec §5, §6.1.

## FR-009: Invalid Transition Rejection
**Priority:** Medium
**Category:** Resilience / Integrity
**Description:** The system shall reject, client-side, any attempted state transition that fails its defined guard (e.g., unknown tab ID, unsupported locale value, exceeded retry throttle), logging a `*.transition.rejected` event with a reason code, and shall leave the UI in its last valid state.
**Acceptance Criteria:** No transition attempt that fails validation results in an undefined or blank UI state; a corresponding `*.transition.rejected` audit log entry is recorded with reason code.
**Dependencies:** State Model §6.3; FR-002, FR-007, FR-011.
**Source:** Spec §6.3.

---

## 2. Localization — Core Requirements

## FR-010: Localized String Retrieval
**Priority:** High
**Category:** Localization / Integration
**Description:** The system shall retrieve namespaced localized strings for the active locale (`en` or `ar`) via API-002 (`GET /api/v1/i18n/{locale}`), falling back to a bundled static JSON resource if the backend call fails.
**Acceptance Criteria:** All navigation-bar labels are sourced from either the API-002 response or the bundled fallback; no hardcoded user-facing strings are rendered.
**Dependencies:** API-002; i18next/react-i18next (Section 8.1).
**Source:** Spec §5 (API-002), §8.1, §9 (no hardcoded strings).

## FR-011: Language Selection on My Profile
**Priority:** High
**Category:** Localization
**Description:** The system shall provide a language selection control on the My Profile screen allowing the visitor to switch `LocalePreference` between `en` and `ar`, validated client-side against the supported locale set before submission.
**Acceptance Criteria:** Selecting a supported locale value updates `LocalePreference`; selecting an unsupported value is rejected per FR-009.
**Dependencies:** State Model §6.2 (`LocalePreference: en ↔ ar`); FR-012.
**Source:** Spec §1.1, §6.2.

## FR-012: Language Preference Persistence (Server Sync)
**Priority:** High
**Category:** Localization / Integration
**Description:** On a successful language change, the system shall submit the new language to the backend via API-003 (`PUT /api/v1/profile/language`) when the visitor is authenticated and online; if offline or unauthenticated, the preference shall be cached locally with a `pending_sync` flag set for deferred synchronization.
**Acceptance Criteria:** Authenticated+online changes result in a 2xx API-003 response and `profile.language.persisted` event; offline/unauthenticated changes result in local caching and `profile.language.persist_deferred` event.
**Dependencies:** API-003; `LocalePreference` entity (`syncState`); State Model §6.2.
**Source:** Spec §5 (API-003), §6.2, §7.1.

## FR-013: Background Language Sync on Reconnect
**Priority:** Medium
**Category:** Localization / Integration
**Description:** The system shall, upon network reconnection, detect a `pending_sync` `LocalePreference` whose cached value differs from the last-known server value, and automatically resolve it via API-003, transitioning `pending_sync → synced`.
**Acceptance Criteria:** On reconnect, a deferred language change is automatically submitted without visitor action; `profile.language.sync_resolved` audit event fires on success.
**Dependencies:** FR-012; State Model §6.2 (`pending_sync → synced`).
**Source:** Spec §6.2.

## FR-014: Immediate Language Application (No Restart)
**Priority:** High
**Category:** Localization / UX
**Description:** The system shall apply a language change to all visible navigation and UI text within the same screen render cycle, with no application restart required.
**Acceptance Criteria:** Immediately after confirming a language change, all visible navigation labels reflect the new language without the app being killed/relaunched.
**Dependencies:** FR-011, FR-010, FR-015 (layout direction).
**Source:** Spec §4 (Goal 4), §10.

## FR-015: RTL/LTR Layout Direction Mirroring
**Priority:** High
**Category:** Localization / UI
**Description:** The system shall derive `UILayoutDirection` atomically from `LocalePreference` (`ar → RTL`, `en → LTR`), mirroring layout, directional icons, and navigation element positioning, with no partial-mirror intermediate state permitted.
**Acceptance Criteria:** Setting locale to `ar` results in a fully RTL-mirrored layout in a single atomic update; setting locale to `en` results in fully LTR layout; no screen ever displays a mixed/partial mirror state.
**Dependencies:** State Model §6.2 (`UILayoutDirection: LTR ↔ RTL`); React Native `I18nManager`.
**Source:** Spec §1.1, §4 (Goal 2), §6.2.

## FR-016: Directional Icon/Element Mirroring
**Priority:** Medium
**Category:** Localization / UI
**Description:** The system shall mirror directional iconography and UI elements (e.g., arrows, chevrons) within the Bottom Navigation Bar and related navigation chrome consistent with the active `UILayoutDirection`.
**Acceptance Criteria:** Directional icons visually flip correctly when switching between LTR and RTL.
**Dependencies:** FR-015.
**Source:** Spec §1.1 ("icon/directional element mirroring").

---

## 3. Profile & Account Integration

## FR-017: Profile Retrieval
**Priority:** Medium
**Category:** Integration
**Description:** The system shall retrieve the authenticated visitor's profile (`userId`, `displayName`, `language`, `email`) via API-004 (`GET /api/v1/profile/me`) to initialize `LocalePreference` and My Profile screen content.
**Acceptance Criteria:** On successful 2xx response, `UserProfile` entity is populated and `LocalePreference.locale` is initialized from `UserProfile.language`.
**Dependencies:** API-004; `UserProfile` entity (Data Model §7.1).
**Source:** Spec §5 (API-004), §7.1.

## FR-018: Section Content Retrieval
**Priority:** Low
**Category:** Integration (Placeholder)
**Description:** The system shall retrieve placeholder content for Explore, Map, and Plan sections via API-005 (`GET /api/v1/sections/{sectionId}/content`), to be reconciled with real backend schema once documented.
**Acceptance Criteria:** On successful 2xx response, section content is passed through to the relevant screen; on failure, FR-006 error handling applies.
**Dependencies:** API-005; FR-006.
**Source:** Spec §5 (API-005), §1.1 ("out of scope: content internal to screens beyond nav entry point").

## FR-019: Backend Health Check
**Priority:** Low
**Category:** Integration
**Description:** The system shall support invoking API-006 (`GET /api/v1/health`) as a diagnostic/connectivity check, distinct from user-facing navigation flows.
**Acceptance Criteria:** API-006 returns `{status, timestamp}` on 2xx; used internally for diagnostics only, not surfaced directly in primary navigation UI.
**Dependencies:** API-006.
**Source:** Spec §5 (API-006).

---

## 4. Production-Readiness & Platform Requirements

## FR-020: Centralized API Client Module
**Priority:** High
**Category:** Architecture
**Description:** The system shall route all backend calls (API-001 through API-006) through a single, centralized `apiClient` module (Axios instance) configured via environment variables (`API_BASE_URL`, `API_TIMEOUT_MS=10000`), with interceptor-based error-to-UI mapping.
**Acceptance Criteria:** No HTTP call bypasses the `apiClient` module; swapping the backend base URL or contract requires configuration/schema changes only, no structural refactor.
**Dependencies:** All API-00x requirements; Axios (Section 8.1).
**Source:** Spec §4 (Goal 3), §8.2, §10.

## FR-021: Repository Hygiene
**Priority:** High
**Category:** Production Readiness
**Description:** The system's repository shall include a `.gitignore` excluding `node_modules/`, `ios/Pods/`, `ios/build/`, `android/.gradle/`, `android/app/build/`, `.env*`, `*.keystore`, `*.jks`, `*.p12`, `.idea/`, `.vscode/`, `*.log`, `.DS_Store`.
**Acceptance Criteria:** A clean clone + build check shows no committed build artifacts, secrets, or environment files.
**Dependencies:** None (repository-level control).
**Source:** Spec §8.1, §10.

## FR-022: Environment-Based Configuration
**Priority:** High
**Category:** Production Readiness
**Description:** The system shall use `react-native-config` with per-environment `.env` files (`.env.dev`, `.env.staging`, `.env.production`), none of which are committed to source control, to supply environment-specific values (e.g., `API_BASE_URL`).
**Acceptance Criteria:** Build output for each environment reflects the correct `API_BASE_URL` without code changes; no `.env*` file appears in version control history.
**Dependencies:** FR-021; FR-020.
**Source:** Spec §8.1, §9.

## FR-023: Audit Event Emission for State Transitions
**Priority:** Medium
**Category:** Observability
**Description:** The system shall emit a structured audit log event for every state transition defined in the State Model (Section 6), forwarded to a telemetry/monitoring service without embedding PII fields.
**Acceptance Criteria:** Each transition listed in the State Transition Table (Section 6.1/6.2) produces exactly one corresponding audit event with the documented event name and payload fields; no PII field (email, displayName) appears in any audit payload.
**Dependencies:** FR-002, FR-003, FR-006, FR-007, FR-008, FR-011, FR-012, FR-013, FR-015.
**Source:** Spec §6.1, §6.2, §9 (Audit logging).

## FR-024: PII Storage Segregation
**Priority:** High
**Category:** Security / Data Governance
**Description:** The system shall store PII fields (`email`, `displayName`) in secure device storage (`react-native-keychain`), and non-PII fields (`language` preference, cached navigation config) in standard local storage (`AsyncStorage`).
**Acceptance Criteria:** `email` and `displayName` never appear in AsyncStorage contents; `language` and cached `NavigationItem` data never appear in Keychain/Keystore.
**Dependencies:** `UserProfile`, `LocalePreference` entities (Data Model §7.1, §7.2).
**Source:** Spec §7.2, §8.1, §9.

## FR-025: No Hardcoded User-Facing Strings
**Priority:** Medium
**Category:** Localization / Code Quality
**Description:** The system shall source 100% of user-facing navigation strings from the i18n layer (API-002 response or bundled fallback); no user-facing string literal shall be hardcoded in component source.
**Acceptance Criteria:** Static/automated code scan reports zero hardcoded user-facing string literals in navigation components.
**Dependencies:** FR-010.
**Source:** Spec §4 (Goal 2), §8.3.

---

## 5. Endpoint Contract Matrix (Reference Mapping)

| Endpoint ID | Method | Path | Primary FR(s) | Auth |
|---|---|---|---|---|
| API-001 | GET | `/api/v1/navigation/config` | FR-001, FR-005 | Public or Bearer (TBD) |
| API-002 | GET | `/api/v1/i18n/{locale}` | FR-010 | Public |
| API-003 | PUT | `/api/v1/profile/language` | FR-012, FR-013 | Bearer (JWT) |
| API-004 | GET | `/api/v1/profile/me` | FR-017 | Bearer (JWT) |
| API-005 | GET | `/api/v1/sections/{sectionId}/content` | FR-018, FR-006 | Bearer or Public (TBD) |
| API-006 | GET | `/api/v1/health` | FR-019 | Public |

> All endpoint schemas are placeholder/assumed per Spec §5 and must be reconciled with actual backend documentation before production cutover (see Clarifications & Decisions #2).

## 6. State Transition Table (Reference Mapping)

| Entity | From → To | Primary FR(s) |
|---|---|---|
| NavigationTab | `inactive → active` | FR-002 |
| NavigationTab | `active → inactive` | FR-003 |
| ScreenLoad | `idle → loading` | FR-002, FR-005 |
| ScreenLoad | `loading → loaded` | FR-005, FR-018 |
| ScreenLoad | `loading → error` | FR-006 |
| ScreenLoad | `error → loading` | FR-007 |
| ScreenLoad | `error → idle (Explore)` | FR-008 |
| LocalePreference | `en ↔ ar` | FR-011 |
| LocalePreference | `any → persisted/deferred` | FR-012 |
| LocalePreference | `pending_sync → synced` | FR-013 |
| UILayoutDirection | `LTR ↔ RTL` | FR-015 |
| Any | rejected transition | FR-009 |

---

## 7. Contradictions & Decisions Log

| # | Contradiction/Ambiguity | Resolution Applied in FRs | Rationale |
|---|---|---|---|
| 1 | Source story title references "different navigation bars" (plural) but spec details only the Bottom Navigation Bar. | FR-001 through FR-009 scoped exclusively to the Bottom Navigation Bar; no FRs written for other nav bar types. | Matches spec Clarifications & Decisions #1 — no design detail exists for other nav bars; fabrication would violate grounding. |
| 2 | Backend API exists but is undocumented; API-001–API-006 are explicitly "placeholder/assumed." | FRs reference API-00x IDs as currently specified but flag (via Endpoint Contract Matrix note) that reconciliation is required before production cutover. | Matches spec §5 note and Clarifications & Decisions #2. |
| 3 | API-005 auth requirement listed as "Bearer token or public (TBD)." | FR-018 does not assert a fixed auth mode; defers to API-005's documented ambiguity. | Avoids inventing an auth decision not present in spec; flagged as open question (spec §12 item 5). |
| 4 | API-001 auth requirement listed as "Public or Bearer token (TBD)." | FR-005's Endpoint Contract Matrix entry mirrors "Public or Bearer (TBD)" rather than resolving to one value. | Same rationale as #3 — preserves documented ambiguity instead of fabricating resolution. |

## 8. Assumptions Register

| # | Assumption | Basis | Risk if Incorrect |
|---|---|---|---|
| 1 | React Navigation's bottom-tab navigator is used to implement FR-001–FR-004 (RTL support included). | Spec §8.1 Technology Stack table. | Low — explicitly resolved decision in spec. |
| 2 | Redux Toolkit manages the `NavigationTab`, `ScreenLoad`, `LocalePreference`, and `UILayoutDirection` state machines. | Spec §8.1. | Low — explicitly resolved decision in spec. |
| 3 | i18next/react-i18next + react-native-localize power FR-010, FR-014, FR-015. | Spec §8.1. | Low — explicitly resolved decision in spec. |
| 4 | Bearer token (JWT) is the authentication mechanism for API-003 and API-004 per FR-012, FR-013, FR-017. | Spec §8.2, §11 (Clarifications #6) — explicitly flagged as assumption pending backend docs. | Medium — if backend uses a different scheme (e.g., session cookie), FR-012/FR-017 auth handling requires rework. |
| 5 | The retry throttle (FR-007) applies per-route/per-session and resets after the 60-second window elapses, not permanently. | Spec §6.1 ("Retry attempt count < 3 within 60s window"). | Low — directly stated in spec; interpretation of "window" as sliding/reset is a reasonable default. |
| 6 | FR-018 (section content) is intentionally minimal/placeholder since section-internal business logic is out of scope. | Spec §1.2 Out of Scope. | Low — explicitly stated out-of-scope boundary. |
| 7 | "Within the same screen render cycle" (FR-014) is interpreted as: visually applied before the next user-perceivable frame, without a full component remount of the whole app tree. | Spec §4 (Goal 4) — no stricter numeric definition given. | Medium — if a stricter frame-time SLA is required later, NFR targets may need revision (see 02-non-functional-requirements.md). |

<!-- Generated by ATOS AI-DLC | Execution: f095c16e-e50d-4877-8d3f-4c6f9b456d64 | 2026-10-21T06:51:57.689Z -->