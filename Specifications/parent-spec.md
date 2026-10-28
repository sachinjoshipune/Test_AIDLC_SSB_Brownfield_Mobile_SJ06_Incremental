# SB360 Mobile Application (Navigation & Localization) - Production Specification

## 0. Metadata

- **Spec version:** 1.0 — 2026-10-21
- **Owner/Reviewer:** Mobile Platform Product Owner (SB360) / Engineering Lead (pending named assignment — see Open Questions)
- **Source inputs used:**
  - Source 1: User Story 1 — "Navigate Across the Mobile Application [Bottom Bar]" (Priority 5)
  - Source 2: Meeting Notes — Ramesh, <PERSON> App Kickoff (Priority 5)
- **Change summary:** Initial production specification. No prior revision exists.

## 1. Scope & Boundaries

### 1.1 In Scope

- Hybrid mobile application built with **React Native**, targeting iOS and Android from a single codebase.
- Global **Bottom Navigation Bar** component (w=276dp, h=53dp) providing primary navigation across: Explore, Map, Plan, My Profile.
- Active-state visual highlighting, single-active-tab enforcement, and persistence of navigation state across primary section screens.
- Bilingual support (**English / Arabic**) including LTR/RTL layout mirroring, label/message localization, and icon/directional element mirroring where required.
- Language selection control on the **My Profile** screen allowing the visitor to switch between English and Arabic.
- Graceful failure handling when a navigation target fails to load (configured error message, no blank/broken screen, retry or return-to-safe-screen path).
- Integration contract layer (client-side) against an **existing backend API**, whose detailed contract is not yet available; this spec defines placeholder contracts to be reconciled when backend documentation is provided (see Clarifications & Open Questions).
- Production-readiness baseline: repository hygiene (`.gitignore`), build configuration, error-boundary handling, and environment-based configuration suitable for release builds.

### 1.2 Out of Scope

- Design/specification of any navigation bar other than the Bottom Navigation Bar (e.g., top bar, side drawer, tab-within-tab menus) — referenced generically in the story title ("different navigation bars") but not detailed in any source. Treated as a future iteration.
- Backend API implementation, database design, or server-side business logic — the backend is assumed pre-existing and out of this app team's build scope.
- Content/business logic internal to Explore, Map, Plan, and My Profile screens beyond the navigation entry point and language selector.
- Native-module development beyond what is required to support React Native navigation, localization, and secure storage.
- Support for languages other than English and Arabic.
- Web or desktop versions of the application.

### 1.3 Boundary Map (Producers/Consumers)

| Interface | Producer | Consumer | Contract | Notes |
|-----------|----------|----------|----------|-------|
| Navigation config | Backend API (existing, TBD) | React Native app (Navigation module) | REST JSON — `GET /api/v1/navigation/config` | Returns ordered list of nav items, icons, labels, section routes |
| Localized strings | Backend API or bundled resource | React Native app (i18n module) | REST JSON — `GET /api/v1/i18n/{locale}` or bundled static JSON fallback | Backend endpoint assumed; local bundle is authoritative fallback |
| Language preference | React Native app (My Profile) | Backend API (existing, TBD) | REST JSON — `PUT /api/v1/profile/language` | Persists visitor's language choice server-side when authenticated |
| Section content | Backend API (existing, TBD) | React Native app (Explore/Map/Plan/My Profile screens) | REST JSON (per-section, TBD) | Placeholder only; actual schema pending backend documentation |
| Local persistence | React Native app | Device secure/local storage | AsyncStorage (non-sensitive) / Keychain-Keystore (sensitive) | Caches last-selected language and last-active tab for session continuity |
| Crash/error telemetry | React Native app | Error monitoring service (TBD) | Event payload (TBD) | Vendor not yet selected — see Open Questions |

## 2. Executive Summary

SB360 is a hybrid mobile application to be built using React Native, delivering a unified cross-platform (iOS/Android) experience from a single codebase. The first production-ready capability is a persistent **Bottom Navigation Bar** that anchors the app's primary information architecture — Explore, Map, Plan, and My Profile — and remains visible and state-aware across all primary screens. The application must fully support **English (LTR)** and **Arabic (RTL)**, including mirrored layouts and iconography, with the visitor's language preference configurable from the My Profile screen.

The application integrates with an existing backend API whose detailed contract has not yet been shared with the engineering team. To avoid blocking delivery, this specification defines placeholder API contracts, data shapes, and error-handling behavior that the mobile client will implement against, with explicit reconciliation required once backend documentation becomes available. The specification also establishes baseline production-readiness requirements — repository hygiene, environment configuration, and resilient failure handling — so the codebase is deployable from day one rather than retrofitted later.

This document is the authoritative technical reference for navigation architecture, localization behavior, state transitions, and integration contracts. It intentionally excludes functional/non-functional requirement enumerations, user stories, and test matrices, which are owned by the downstream requirements-analysis process.

## 3. Problem Statement

Visitors to the SB360 mobile app need a consistent, predictable way to move between the application's core feature areas (Explore, Map, Plan, My Profile) regardless of which screen they are currently on. Without a persistent, clearly-stated global navigation pattern, visitors risk losing orientation within the app, encountering dead ends on failed navigation attempts, or experiencing a broken multilingual experience (incorrect text direction, untranslated labels) for Arabic-speaking users — a primary audience given the product's regional context.

Additionally, because the application is being built as a hybrid React Native app against a backend API that is not yet documented, there is a risk of divergent assumptions between frontend and backend teams. This specification reduces that risk by defining explicit, versioned placeholder contracts now, so that integration work can proceed in parallel and be reconciled mechanically once real backend documentation is delivered.

## 4. Goals & Objectives

- **Goal 1: Deliver a consistent, resilient global navigation experience.**
  - **Objective:** Implement a Bottom Navigation Bar that is present on all primary screens, reflects the correct active section, and never leaves the visitor on a blank/broken screen on failure.
  - **Success Metric:** 100% of primary screens (Explore, Map, Plan, My Profile) render the Bottom Navigation Bar with correct active-state highlighting in manual/automated UI verification; 0 unhandled navigation failures reach a blank screen in QA regression.

- **Goal 2: Provide full bilingual (English/Arabic) parity.**
  - **Objective:** Ensure every navigation label, message, and directional UI element renders correctly in both LTR (English) and RTL (Arabic) modes.
  - **Success Metric:** 100% of navigation-bar strings sourced from the localization layer (zero hardcoded strings); RTL layout mirroring verified on both supported OS platforms.

- **Goal 3: Establish a production-ready hybrid codebase foundation.**
  - **Objective:** Set up the React Native project with proper `.gitignore`, environment-based configuration, and placeholder API integration layer that can be swapped for the real backend contract without structural rework.
  - **Success Metric:** Repository contains no committed build artifacts, credentials, or platform-generated files (`node_modules`, `.env`, `ios/Pods`, `android/.gradle`, build outputs); all API calls route through a single configurable client module.

- **Goal 4: Enable seamless in-app language switching.**
  - **Objective:** Allow visitors to change language from My Profile and have the change apply immediately across the active session, including the navigation bar.
  - **Success Metric:** Language switch applies to all visible navigation/UI text within the same screen render cycle, with no app restart required.

## 5. API Contract Matrix (MANDATORY)

> Note: The backend API is existing but undocumented at spec time (per Source 2). Contracts below are **placeholder/assumed** definitions the mobile client will implement against; they must be reconciled with actual backend documentation before production cutover (see Clarifications & Decisions, Section 11).

| ID | Method | Path | Request Schema | Response Schema | Error Codes | Auth |
|----|--------|------|----------------|-----------------|------------|------|
| API-001 | GET | `/api/v1/navigation/config` | None (query param `locale=en\|ar` optional) | `{ "items": [{ "id": "explore", "label": "Explore", "icon": "icon_explore", "route": "ExploreScreen", "order": 1 }, ...] }` | 400 (invalid locale), 401 (if auth required), 500 | Public or Bearer token (TBD) |
| API-002 | GET | `/api/v1/i18n/{locale}` | Path param: `locale` (`en` or `ar`) | `{ "locale": "ar", "namespace": "navigation", "strings": { "explore": "استكشاف", "map": "الخريطة", "plan": "خطة", "profile": "الملف الشخصي" } }` | 400 (unsupported locale), 404 (namespace not found), 500 | Public |
| API-003 | PUT | `/api/v1/profile/language` | `{ "userId": "string", "language": "en\|ar" }` | `{ "userId": "string", "language": "en\|ar", "updatedAt": "ISO8601" }` | 400 (invalid language code), 401 (unauthenticated), 403 (forbidden — profile not owned by caller), 409 (concurrent update conflict), 500 | Bearer token (authenticated visitor) |
| API-004 | GET | `/api/v1/profile/me` | None | `{ "userId": "string", "displayName": "string", "language": "en\|ar", "email": "string" }` | 401 (unauthenticated), 404 (profile not found), 500 | Bearer token |
| API-005 | GET | `/api/v1/sections/{sectionId}/content` | Path param: `sectionId` (`explore\|map\|plan`) | `{ "sectionId": "string", "content": { } }` (schema TBD, placeholder passthrough object) | 400 (unknown section), 401 (if auth required), 404 (content not found), 500 | Bearer token or public (TBD per section) |
| API-006 | GET | `/api/v1/health` | None | `{ "status": "ok", "timestamp": "ISO8601" }` | 500 | Public |

**Client-side error handling contract (applies to API-001 through API-005):** on any 4xx/5xx response or network timeout (client default timeout: 10,000 ms), the app surfaces the configured error message (non-blank screen) and offers **Retry** (re-invoke the failed call) and **Return to Home** (navigate to Explore as the safe default screen) actions, per Source 1, Scenario 6.

## 6. State Model & Transition Rules (MANDATORY)

### 6.1 Bottom Navigation Active-Tab State

| Entity | From State | To State | Actor | Guard/Validation | Audit Event |
|--------|------------|----------|-------|------------------|------------|
| NavigationTab | `inactive` | `active` | Visitor (tap on nav item) | Target route exists in navigation config; only one tab may be `active` at a time | `nav.tab.selected` (tabId, timestamp) |
| NavigationTab | `active` | `inactive` | System (on selection of a different tab) | Previous active tab is automatically deactivated before new tab activates | `nav.tab.deselected` (tabId, timestamp) |
| ScreenLoad | `idle` | `loading` | System (on tab selection / deep link) | Navigation config successfully resolved for target route | `nav.screen.load.start` |
| ScreenLoad | `loading` | `loaded` | System | Target screen component mounted and API-005 (if applicable) resolves 2xx | `nav.screen.load.success` |
| ScreenLoad | `loading` | `error` | System | API-005 or route resolution returns 4xx/5xx or times out (>10s) | `nav.screen.load.failure` (errorCode, route) |
| ScreenLoad | `error` | `loading` | Visitor (taps Retry) | Retry attempt count < 3 within 60s window (client-side throttle) | `nav.screen.retry` |
| ScreenLoad | `error` | `idle` (Explore) | Visitor (taps Return to Home) | Always allowed | `nav.screen.recover` |

### 6.2 Language/Locale State

| Entity | From State | To State | Actor | Guard/Validation | Audit Event |
|--------|------------|----------|-------|------------------|------------|
| LocalePreference | `en` | `ar` | Visitor (My Profile language toggle) | Selection is one of supported locales (`en`,`ar`) | `profile.language.changed` (from, to, userId) |
| LocalePreference | `ar` | `en` | Visitor (My Profile language toggle) | Same as above | `profile.language.changed` |
| LocalePreference | any | any (persist) | System | On successful API-003 response (2xx) or, if offline/unauthenticated, cached to local storage only, with sync-on-reconnect flag set | `profile.language.persisted` / `profile.language.persist_deferred` |
| LocalePreference | `pending_sync` | `synced` | System (background, on reconnect) | Local cached language differs from last-known server value | `profile.language.sync_resolved` |
| UILayoutDirection | `LTR` | `RTL` | System (derived from LocalePreference = `ar`) | Applied atomically with locale change; no partial-mirror intermediate state permitted | `ui.direction.changed` |
| UILayoutDirection | `RTL` | `LTR` | System (derived from LocalePreference = `en`) | Same as above | `ui.direction.changed` |

### 6.3 Invalid Transition Behavior

Any attempted transition that fails its guard (e.g., selecting an unknown tab ID, setting an unsupported locale, exceeding retry throttle) is rejected client-side, logged as `*.transition.rejected` with reason code, and the UI remains in its last valid state — never transitioning to an undefined or blank state.

## 7. Data Model & Governance

### 7.1 Core Entities

| Entity | Key Attributes | Notes |
|--------|----------------|-------|
| `NavigationItem` | `id`, `label` (localized key), `icon`, `route`, `order`, `isActive` | Sourced from API-001; cached locally for offline resilience |
| `UserProfile` | `userId`, `displayName`, `email`, `language` | Sourced from API-004; `language` drives LocalePreference |
| `LocalePreference` | `locale` (`en`\|`ar`), `direction` (`LTR`\|`RTL`), `syncState` (`synced`\|`pending_sync`) | Client-managed, persisted locally and synced via API-003 |
| `NavigationErrorEvent` | `route`, `errorCode`, `timestamp`, `retryCount` | Used to drive Scenario 6 error UI and client-side telemetry |
| `SessionState` | `activeTabId`, `lastVisitedRoute`, `appLaunchTimestamp` | In-memory + persisted to local storage for session continuity (Scenario 3) |

### 7.2 PII Classification

| Data Element | Classification | Handling Requirement |
|--------------|-----------------|----------------------|
| `email` | PII — Direct identifier | Never logged in plaintext; transmitted only over TLS; not cached unencrypted on device |
| `displayName` | PII — Indirect identifier | Stored in secure device storage (Keychain/Keystore), not AsyncStorage |
| `userId` | Pseudonymous identifier | May be cached in non-sensitive local storage; not exposed in client-side logs |
| `language` preference | Non-PII preference data | May be cached in standard local storage (AsyncStorage) |
| Navigation/session telemetry | Non-PII, behavioral | May be sent to error/telemetry service without user-identifying fields unless explicitly consented |

### 7.3 Retention, Archival, Deletion

- Locally cached `UserProfile` and `LocalePreference` data is cleared on explicit logout and on app uninstall (OS-managed).
- Server-side retention of profile/language data is governed by the backend system (out of scope for this spec); the mobile client assumes the backend enforces its own retention policy.
- Client-side error/telemetry events are retained locally for a maximum of 7 days for diagnostic purposes, then purged automatically.
- No navigation/session telemetry is retained longer than required for crash diagnostics; exact telemetry vendor retention policy is pending vendor selection (see Open Questions).

## 8. Technical Constraints

### 8.1 Technology Stack (Resolved Decisions)

| Dimension | Decision | Rationale |
|-----------|----------|-----------|
| Mobile framework | **React Native** (latest stable LTS at implementation start, e.g., 0.74.x) | Explicitly mandated in Source 2 |
| Language | **TypeScript** | Production-readiness requirement; reduces integration defects against placeholder API contracts |
| Navigation library | **React Navigation** (bottom-tab navigator) | De facto standard for React Native; supports RTL out of the box |
| State management | **Redux Toolkit** | Predictable, testable state for navigation/active-tab and locale state machines defined in Section 6 |
| Localization library | **i18next + react-i18next**, with **react-native-localize** for device locale detection | Supports namespaced translations (API-002 shape), RTL handling in combination with React Native's `I18nManager` |
| Secure local storage | **react-native-keychain** (sensitive data: profile/session tokens) + **AsyncStorage** (non-sensitive: language preference, cached nav config) | Separates PII from non-PII per Section 7.2 |
| HTTP client | **Axios** with a single centralized API client module and interceptor-based error handling | Enables consistent error-to-UI mapping per Section 5 error contract |
| CI/CD | **GitHub Actions** (build, lint, type-check, test on PR; Fastlane-driven release build for iOS/Android on tag) | Standard, low-friction choice given no CI platform specified in sources |
| Source control hygiene | `.gitignore` covering `node_modules/`, `ios/Pods/`, `ios/build/`, `android/.gradle/`, `android/app/build/`, `.env*`, `*.keystore`, `*.jks`, `*.p12`, `.idea/`, `.vscode/`, `*.log`, `.DS_Store` | Explicit requirement from Source 2 |
| Environment configuration | **react-native-config** with per-environment `.env` files (`.env.dev`, `.env.staging`, `.env.production`), never committed | Supports backend-URL placeholder swap without code changes once real API is documented |

### 8.2 Integration Requirements

- All backend calls route through a single `apiClient` module (Axios instance) configured via environment variables (`API_BASE_URL`, `API_TIMEOUT_MS=10000`).
- All backend contracts in Section 5 are marked placeholder and versioned under `/api/v1/`; any breaking change from the real backend must be reconciled via a spec revision before release.
- Authentication mechanism is assumed to be **Bearer token (JWT)**, consistent with standard REST API practice; exact issuance/refresh flow is pending backend documentation (see Open Questions).

### 8.3 Compliance Requirements

- Application must support bidirectional text rendering (RTL/LTR) consistent with platform accessibility guidelines for Arabic-language users.
- No hardcoded user-facing strings; all text sourced from the i18n layer to support future locale additions and compliance with localization QA.
- Data handling for PII fields (Section 7.2) must align with general data-protection practice (encryption in transit via TLS 1.2+, no plaintext PII in logs) pending confirmation of specific regulatory regime applicable to SB360's operating region (see Open Questions).

## 9. Security & Compliance Controls

- **Transport security:** All API calls (Section 5) must use TLS 1.2+; no cleartext HTTP traffic permitted in any build configuration, including development.
- **Secrets management:** No API keys, backend URLs, or credentials committed to source control; all environment-specific secrets injected via `.env` files excluded by `.gitignore` and managed through CI/CD secret stores at build time.
- **Token handling:** Bearer tokens (assumed JWT) stored exclusively in secure device storage (Keychain/Keystore), never in AsyncStorage or application logs.
- **Input validation:** All client-originated requests (e.g., API-003 language update) validate payload shape and allowed values (`en`,`ar`) client-side before transmission, and the server response is validated against expected schema before being applied to app state.
- **Error message hygiene:** User-facing error messages (Scenario 6) never expose raw stack traces, internal error codes, or backend implementation details; only a configured, localized, generic error message is shown.
- **Session integrity:** Navigation and locale state (Section 6) are reset to safe defaults (`Explore` tab, device-detected locale) on authentication failure or token expiry (401 responses).
- **RBAC:** The scope of this spec does not define multi-role access (single "Visitor" actor throughout); any future role-based restrictions on navigation items must be layered onto the `NavigationItem` entity without altering the core state machine.
- **Audit logging:** All state transitions listed in Section 6 emit a corresponding audit event (client-side structured log), forwarded to the telemetry/monitoring service (vendor TBD) without embedding PII fields.
- **Dependency hygiene:** Third-party React Native packages are pinned to exact versions in `package.json`/lockfile to ensure reproducible, auditable production builds.

## 10. Success Criteria

- The Bottom Navigation Bar renders per approved design dimensions (276×53dp) and configuration on 100% of primary screens (Explore, Map, Plan, My Profile) across both supported platforms (iOS, Android).
- Only one navigation tab is ever shown as active at any given time, verified across all navigation transition paths.
- Language switching between English and Arabic applies immediately to all navigation labels, icons, and layout direction without requiring app restart.
- Zero occurrences of a blank or broken screen following a navigation failure; Retry and Return-to-Home paths are always available and functional.
- Repository passes a clean-clone build check with no committed build artifacts, secrets, or environment files.
- All API integration points (Section 5) are implemented against an abstracted client module such that swapping placeholder contracts for real backend contracts requires no structural refactor — only configuration/schema updates.

## 11. Clarifications & Decisions (MANDATORY)

| # | Conflict/Ambiguity in Sources | Decision | Rationale |
|---|-------------------------------|----------|-----------|
| 1 | Source 1 title references "different navigation bars" (plural), but only the Bottom Navigation Bar is detailed with dimensions and scenarios. | Scope this spec to the Bottom Navigation Bar only. Other navigation bars (if any) are out of scope pending future user stories. | No design detail, dimensions, or scenarios were provided for any other navigation bar; fabricating them would violate grounding requirements. |
| 2 | Source 2 states backend API exists but provides no contract details ("we do not have details on it now, so need to assume and add placeholder wherever required"). | Define explicit placeholder API contracts (Section 5) versioned under `/api/v1/`, to be reconciled against real backend documentation before production release. | Directly instructed by source; placeholders are clearly marked, not presented as final truth. |
| 3 | No explicit mobile framework comparison given — Source 2 directly states React Native. | React Native confirmed as the sole hybrid framework; no alternative evaluated. | Explicit, unambiguous instruction in Source 2. |
| 4 | No state management, navigation, or i18n library specified in either source. | Adopted React Navigation, Redux Toolkit, and i18next/react-i18next as the resolved stack (Section 8.1). | Industry-standard choices for React Native that directly support the state machine (Section 6) and localization (Scenarios 4–5) requirements described in Source 1. | 
| 5 | Source 2 says "Make the application production ready. Fill the gaps if any" without defining specific production-readiness criteria. | Interpreted production-readiness as: proper `.gitignore`, environment-based config, centralized/abstracted API client, secure storage separation for PII, and resilient error handling per Scenario 6. | Reasonable, industry-standard default scope for "production ready" given no further detail provided. |
| 6 | No authentication mechanism specified for backend API. | Assumed Bearer token (JWT) based authentication as the default for all authenticated endpoints (API-003, API-004). | Standard REST practice; explicitly flagged as an assumption pending backend documentation. |

## 12. Open Questions

1. What is the actual backend API base URL, authentication flow (token issuance/refresh), and exact request/response schemas for navigation config, profile, and section content? (Blocks final reconciliation of Section 5.)
2. Are there additional navigation bars (top bar, side drawer, etc.) referenced by the user story title that require separate specification and approved designs?
3. What is the approved visual design reference (Figma/design system link) for icons, active-state styling, and the configured error message copy referenced in Scenario 6?
4. Which crash/error telemetry and analytics vendor should be integrated (e.g., Sentry, Firebase Crashlytics)? Not specified in sources.
5. Is multi-role or authenticated-vs-anonymous visitor differentiation required for any navigation items or section content, or is the entire experience available to anonymous visitors?
6. What specific data-protection/regulatory regime (e.g., regional data residency rules) applies to SB360's operating region, affecting PII handling beyond the general controls assumed in Section 7.2/Section 9?
7. Who is the named Engineering Lead/Reviewer responsible for sign-off on this specification (currently unassigned per Section 0)?
8. Is offline-mode support (beyond cached navigation config/language preference) required, or is the app expected to require network connectivity at all times?

## Compliance & governance (reference)

### Organizational policies (summary)
1. **Minimum Code Coverage 80%** (COMPLIANCE, HIGH) - Code coverage must be at least 80%.
2. **Code Review Required** (APPROVAL, HIGH) - All PRs require at least one approval.
3. **Mandatory Security Scan** (SECURITY, CRITICAL) - All code must pass security scan before deployment.
### Policy document reference
Primary policy document: `Policies/project-policy-document.md`
