# Acceptance Criteria — SB360 Mobile Application (Navigation & Localization)

**Derived from:** `Requirements/01-functional-requirements.md`, `Requirements/02-non-functional-requirements.md`, and `Specifications/currentspec.md` v1.0.
**Format:** Gherkin-style Given/When/Then, one or more scenarios per functional requirement.

---

## AC-001: Bottom Navigation Bar Renders on All Primary Screens
**Linked FR:** FR-001
**Linked NFR:** NFR-PERF-002

```gherkin
Scenario: Bottom Navigation Bar visible on each primary screen
  Given the visitor has launched the SB360 app on iOS or Android
  And the navigation configuration (API-001) has loaded successfully
  When the visitor is on the Explore, Map, Plan, or My Profile screen
  Then the Bottom Navigation Bar is rendered at 276dp width x 53dp height
  And the bar contains exactly four items: Explore, Map, Plan, My Profile
```

---

## AC-002: Tapping a Navigation Item Activates It
**Linked FR:** FR-002
**Linked State Transition:** NavigationTab `inactive → active`

```gherkin
Scenario: Visitor taps a valid navigation item
  Given the visitor is on any primary screen with the Bottom Navigation Bar visible
  And the "Map" tab's target route exists in the loaded navigation configuration
  When the visitor taps the "Map" navigation item
  Then the "Map" tab transitions from "inactive" to "active"
  And a "nav.tab.selected" audit event is emitted with tabId="map" and a timestamp
```

---

## AC-003: Single Active Tab Enforcement
**Linked FR:** FR-003
**Linked State Transition:** NavigationTab `active → inactive` (previous tab)

```gherkin
Scenario: Selecting a new tab deactivates the previous tab
  Given the "Explore" tab is currently "active"
  When the visitor taps the "Plan" navigation item
  Then the "Explore" tab transitions from "active" to "inactive" before "Plan" activates
  And a "nav.tab.deselected" audit event is emitted for "explore"
  And exactly one tab ("Plan") reports active=true after the transition completes
```

---

## AC-004: Navigation State Persists Across Session
**Linked FR:** FR-004

```gherkin
Scenario: Returning to the app restores the last-active tab
  Given the visitor last had the "Plan" tab active before backgrounding the app
  And SessionState was persisted to local storage
  When the visitor reopens the app without a full uninstall/reinstall
  Then the "Plan" tab is restored as "active"
  And the visitor is returned to the lastVisitedRoute associated with "Plan"
```

---

## AC-005: Navigation Configuration Loads from Backend
**Linked FR:** FR-005
**Linked Endpoint:** API-001

```gherkin
Scenario: Navigation config loads successfully on app start
  Given the device has network connectivity
  When the app requests GET /api/v1/navigation/config
  And the backend responds 200 with an ordered items array
  Then NavigationItem entities are populated in the returned order
  And the Bottom Navigation Bar renders items in that order
  And the response is cached locally for offline resilience
```

```gherkin
Scenario: Navigation config falls back to cache when backend is unreachable
  Given a previously successful navigation config response exists in local cache
  And the device currently has no network connectivity
  When the app attempts to request GET /api/v1/navigation/config
  Then the cached NavigationItem list is used to render the Bottom Navigation Bar
  And no blank navigation bar is shown
```

---

## AC-006: Screen Load Failure Shows Non-Blank Error State
**Linked FR:** FR-006
**Linked State Transition:** ScreenLoad `loading → error`
**Linked NFR:** NFR-REL-001, NFR-SEC-006

```gherkin
Scenario: API-005 returns a 5xx error during screen load
  Given the visitor has tapped a navigation item for "Explore"
  And ScreenLoad has transitioned to "loading"
  When GET /api/v1/sections/explore/content responds with HTTP 500
  Then ScreenLoad transitions from "loading" to "error"
  And a configured, localized, generic error message is displayed (no blank screen)
  And no raw stack trace or internal error code is shown to the visitor
  And a "nav.screen.load.failure" audit event is emitted with errorCode and route
  And Retry and Return to Home actions are both visible and enabled
```

```gherkin
Scenario: Screen load times out
  Given the visitor has tapped a navigation item
  And ScreenLoad has transitioned to "loading"
  When no response is received within 10,000 ms
  Then ScreenLoad transitions from "loading" to "error"
  And the configured error message and Retry/Return to Home actions are displayed
```

---

## AC-007: Retry Action Re-Invokes Failed Call
**Linked FR:** FR-007
**Linked State Transition:** ScreenLoad `error → loading`
**Linked NFR:** NFR-PERF-005, NFR-REL-003

```gherkin
Scenario: Visitor retries after a failure, within throttle limit
  Given ScreenLoad is in the "error" state for route "Map"
  And fewer than 3 retry attempts have occurred for "Map" in the last 60 seconds
  When the visitor taps "Retry"
  Then ScreenLoad transitions from "error" to "loading"
  And the original failed request is re-invoked
  And a "nav.screen.retry" audit event is emitted
```

```gherkin
Scenario: Visitor exceeds retry throttle
  Given ScreenLoad is in the "error" state for route "Map"
  And 3 retry attempts have already occurred for "Map" within the last 60 seconds
  When the visitor taps "Retry" a 4th time
  Then the retry attempt is rejected client-side
  And ScreenLoad remains in the "error" state (last valid state)
  And a "nav.transition.rejected" audit event is emitted with a reason code
  And no additional network call is issued
```

---

## AC-008: Return to Home Always Succeeds
**Linked FR:** FR-008
**Linked State Transition:** ScreenLoad `error → idle (Explore)`

```gherkin
Scenario: Visitor taps Return to Home from an error state
  Given ScreenLoad is in the "error" state for any route
  When the visitor taps "Return to Home"
  Then ScreenLoad transitions from "error" to "idle"
  And the visitor is navigated to the Explore screen
  And a "nav.screen.recover" audit event is emitted
  And the Return to Home action succeeds regardless of retry throttle state
```

---

## AC-009: Invalid Transitions Are Rejected Without Breaking UI
**Linked FR:** FR-009
**Linked Section:** State Model §6.3

```gherkin
Scenario: Visitor attempts to select an unknown navigation tab ID
  Given the current navigation configuration does not contain a tab with id "unknown_tab"
  When a selection event for "unknown_tab" is dispatched
  Then the transition is rejected client-side
  And a "nav.transition.rejected" event is logged with a reason code
  And the UI remains in its last valid state (previously active tab stays active)
```

```gherkin
Scenario: Visitor attempts to set an unsupported locale
  Given the supported locale set is {"en", "ar"}
  When a locale change to "fr" is attempted
  Then the transition is rejected client-side
  And a "profile.transition.rejected" event is logged with a reason code
  And LocalePreference remains unchanged at its last valid value
```

---

## AC-010: Localized Strings Source Navigation Labels
**Linked FR:** FR-010
**Linked Endpoint:** API-002
**Linked NFR:** NFR-L10N-001

```gherkin
Scenario: Navigation labels render from backend-provided locale strings
  Given the active locale is "ar"
  When GET /api/v1/i18n/ar responds 200 with namespace "navigation" strings
  Then the Bottom Navigation Bar labels render using the returned Arabic strings
  And no hardcoded English or Arabic string literal is rendered instead
```

```gherkin
Scenario: Localized strings fall back to bundled resource on API failure
  Given GET /api/v1/i18n/ar returns HTTP 500 or times out
  And a bundled static JSON fallback for "ar" exists in the app package
  When the Bottom Navigation Bar is rendered
  Then labels render using the bundled fallback strings
  And no blank or key-name label (e.g. "navigation.explore") is shown
```

---

## AC-011: Language Selection on My Profile
**Linked FR:** FR-011
**Linked State Transition:** LocalePreference `en ↔ ar`

```gherkin
Scenario: Visitor selects Arabic from My Profile
  Given the visitor is on the My Profile screen
  And the current LocalePreference is "en"
  When the visitor selects "ar" from the language selection control
  Then LocalePreference transitions from "en" to "ar"
  And the selection is validated against the supported locale set before being applied
```

---

## AC-012: Language Preference Syncs to Backend When Online/Authenticated
**Linked FR:** FR-012
**Linked Endpoint:** API-003

```gherkin
Scenario: Authenticated visitor changes language while online
  Given the visitor is authenticated and the device has network connectivity
  When the visitor confirms a language change from "en" to "ar"
  Then PUT /api/v1/profile/language is called with {"userId": "<id>", "language": "ar"}
  And on a 200 response, a "profile.language.persisted" audit event is emitted
```

```gherkin
Scenario: Unauthenticated or offline visitor changes language
  Given the visitor is unauthenticated or the device has no network connectivity
  When the visitor confirms a language change from "en" to "ar"
  Then the new LocalePreference is cached locally only
  And syncState is set to "pending_sync"
  And a "profile.language.persist_deferred" audit event is emitted
```

---

## AC-013: Deferred Language Sync Resolves on Reconnect
**Linked FR:** FR-013
**Linked State Transition:** LocalePreference `pending_sync → synced`
**Linked NFR:** NFR-REL-004

```gherkin
Scenario: Pending language change syncs automatically after reconnect
  Given a LocalePreference with syncState "pending_sync" exists locally
  And its cached value differs from the last-known server value
  When network connectivity is restored
  Then the app automatically calls PUT /api/v1/profile/language with the cached value
  And on success, syncState transitions from "pending_sync" to "synced"
  And a "profile.language.sync_resolved" audit event is emitted within 30 seconds of reconnect
```

---

## AC-014: Language Change Applies Immediately Without Restart
**Linked FR:** FR-014
**Linked NFR:** NFR-PERF-004

```gherkin
Scenario: Navigation labels update immediately after language change
  Given the visitor is on the My Profile screen with LocalePreference "en"
  When the visitor confirms a change to "ar"
  Then all visible navigation labels update to Arabic within the same render cycle
  And the application process is not restarted or relaunched
```

---

## AC-015: RTL/LTR Layout Mirrors Atomically
**Linked FR:** FR-015
**Linked State Transition:** UILayoutDirection `LTR ↔ RTL`
**Linked NFR:** NFR-L10N-002, NFR-L10N-003

```gherkin
Scenario: Switching to Arabic mirrors the layout to RTL
  Given UILayoutDirection is currently "LTR"
  When LocalePreference changes to "ar"
  Then UILayoutDirection transitions atomically from "LTR" to "RTL"
  And no frame is rendered showing a partial or mixed-direction layout
  And a "ui.direction.changed" audit event is emitted
```

```gherkin
Scenario: Switching back to English restores LTR
  Given UILayoutDirection is currently "RTL"
  When LocalePreference changes to "en"
  Then UILayoutDirection transitions atomically from "RTL" to "LTR"
  And a "ui.direction.changed" audit event is emitted
```

---

## AC-016: Directional Icons Mirror with Layout Direction
**Linked FR:** FR-016

```gherkin
Scenario: Directional icons flip when switching to RTL
  Given a directional icon (e.g., a chevron) is displayed in LTR orientation
  When UILayoutDirection transitions to "RTL"
  Then the directional icon is re-rendered in its mirrored (flipped) orientation
```

---

## AC-017: Profile Data Initializes Locale and Profile Screen
**Linked FR:** FR-017
**Linked Endpoint:** API-004

```gherkin
Scenario: Profile retrieval initializes language preference
  Given the visitor is authenticated
  When GET /api/v1/profile/me responds 200 with {"language": "ar", ...}
  Then UserProfile is populated with the returned fields
  And LocalePreference.locale is initialized to "ar"
```

---

## AC-018: Section Content Retrieval Supports Screen Rendering
**Linked FR:** FR-018
**Linked Endpoint:** API-005

```gherkin
Scenario: Section content loads successfully
  Given the visitor navigates to the "Explore" tab
  When GET /api/v1/sections/explore/content responds 200
  Then the returned content object is passed to the Explore screen for rendering
```

---

## AC-019: Health Check Endpoint Available for Diagnostics
**Linked FR:** FR-019
**Linked Endpoint:** API-006

```gherkin
Scenario: Health check confirms backend availability
  Given a diagnostic check is triggered
  When GET /api/v1/health is called
  Then a 200 response with {"status": "ok", "timestamp": "<ISO8601>"} is returned
  And the result is used internally for diagnostics, not shown in primary navigation UI
```

---

## AC-020: All Backend Calls Route Through Centralized API Client
**Linked FR:** FR-020
**Linked NFR:** NFR-MAINT-001, NFR-PERF-003

```gherkin
Scenario: API calls use the centralized apiClient module
  Given the apiClient module is configured with API_BASE_URL and API_TIMEOUT_MS=10000
  When any screen or module needs to call API-001 through API-006
  Then the call is issued through the apiClient module (not an ad hoc HTTP call)
  And the configured timeout and base URL apply uniformly
```

---

## AC-021: Repository Contains No Committed Build Artifacts or Secrets
**Linked FR:** FR-021
**Linked NFR:** NFR-SEC-002

```gherkin
Scenario: Clean clone build check passes
  Given a fresh clone of the repository
  When the repository contents are inspected
  Then no node_modules/, ios/Pods/, ios/build/, android/.gradle/, android/app/build/ directories are present
  And no .env*, *.keystore, *.jks, *.p12 files are present
  And no committed secrets are detected by the automated secret scanner
```

---

## AC-022: Environment Configuration Drives Backend URL Without Code Changes
**Linked FR:** FR-022
**Linked NFR:** NFR-SEC-002

```gherkin
Scenario: Switching environments changes API_BASE_URL without code changes
  Given .env.dev defines API_BASE_URL=http://localhost:8080 (placeholder/local)
  And .env.production defines API_BASE_URL=https://api.sb360.example.com (placeholder)
  When the app is built for the "production" environment
  Then the apiClient uses the API_BASE_URL from .env.production
  And no source code change was required to switch environments
```

---

## AC-023: Audit Events Emitted for All State Transitions Without PII
**Linked FR:** FR-023
**Linked NFR:** NFR-SEC-004

```gherkin
Scenario: State transitions produce PII-free audit events
  Given any state transition defined in the State Transition Table occurs
  When the corresponding audit event is emitted
  Then the event payload contains only the documented non-PII fields (e.g., tabId, timestamp, errorCode, route)
  And the event payload never contains "email" or "displayName"
```

---

## AC-024: PII Fields Stored in Secure Storage Only
**Linked FR:** FR-024
**Linked NFR:** NFR-SEC-003, NFR-SEC-004

```gherkin
Scenario: Email and display name are stored only in Keychain/Keystore
  Given UserProfile data including "email" and "displayName" has been retrieved
  When the data is persisted locally
  Then "email" and "displayName" are written only to Keychain/Keystore storage
  And "email" and "displayName" never appear in AsyncStorage
```

```gherkin
Scenario: Non-PII preference data is stored in AsyncStorage
  Given a LocalePreference change has been confirmed
  When the "language" value is persisted locally
  Then "language" is written to AsyncStorage
  And "language" is not required to be written to Keychain/Keystore
```

---

## AC-025: No Hardcoded User-Facing Strings in Navigation Components
**Linked FR:** FR-025
**Linked NFR:** NFR-L10N-001

```gherkin
Scenario: Static scan finds zero hardcoded navigation strings
  Given the navigation component source files are scanned by the i18n lint rule
  When the scan completes
  Then zero hardcoded user-facing string literals are reported
```

---

## Behavior Variants

| Variant Context | Requirement-Backed Behavior | Linked AC |
|---|---|---|
| Online + Authenticated language change | Immediate API-003 sync | AC-012 (Scenario 1) |
| Offline or Unauthenticated language change | Deferred local cache + `pending_sync` | AC-012 (Scenario 2) |
| Navigation config available (online) | Live fetch via API-001 | AC-005 (Scenario 1) |
| Navigation config unavailable (offline) | Cached fallback rendering | AC-005 (Scenario 2) |
| Localized strings available (online) | Live fetch via API-002 | AC-010 (Scenario 1) |
| Localized strings unavailable (API failure) | Bundled static JSON fallback | AC-010 (Scenario 2) |
| Retry within throttle (< 3 / 60s) | Retry re-invokes failed call | AC-007 (Scenario 1) |
| Retry exceeding throttle (≥ 3 / 60s) | Retry rejected, last valid state retained | AC-007 (Scenario 2) |
| Locale = en | UILayoutDirection = LTR | AC-015 (Scenario 2) |
| Locale = ar | UILayoutDirection = RTL | AC-015 (Scenario 1) |

> Per Safety Guardrail: no security attack-simulation or adversarial negative-edge-case scenarios are included beyond what spec §6.3 and §9 explicitly require (invalid transition rejection, input validation, error hygiene).

---

## Test Acceptance Matrix

| AC ID | Linked FR(s) | Linked NFR(s) | Test Type | Automatable? |
|---|---|---|---|---|
| AC-001 | FR-001 | NFR-PERF-002 | UI / Visual | Yes |
| AC-002 | FR-002 | NFR-PERF-001 | UI / Unit | Yes |
| AC-003 | FR-003 | NFR-PERF-001 | UI / Unit | Yes |
| AC-004 | FR-004 | — | Integration | Yes |
| AC-005 | FR-005 | NFR-PERF-002, NFR-REL-002 | Integration | Yes |
| AC-006 | FR-006 | NFR-REL-001, NFR-SEC-006 | Integration / UI | Yes |
| AC-007 | FR-007 | NFR-PERF-005, NFR-REL-003 | Unit / Integration | Yes |
| AC-008 | FR-008 | NFR-REL-001 | UI / Integration | Yes |
| AC-009 | FR-009 | — | Unit | Yes |
| AC-010 | FR-010 | NFR-L10N-001 | Integration | Yes |
| AC-011 | FR-011 | — | UI / Unit | Yes |
| AC-012 | FR-012 | NFR-SEC-005 | Integration | Yes |
| AC-013 | FR-013 | NFR-REL-004 | Integration | Yes |
| AC-014 | FR-014 | NFR-PERF-004 | UI / Performance | Yes |
| AC-015 | FR-015 | NFR-L10N-002, NFR-L10N-003 | UI / Visual Regression | Yes |
| AC-016 | FR-016 | NFR-L10N-002 | UI / Visual | Yes |
| AC-017 | FR-017 | — | Integration | Yes |
| AC-018 | FR-018 | — | Integration | Yes |
| AC-019 | FR-019 | — | Integration | Yes |
| AC-020 | FR-020 | NFR-MAINT-001, NFR-PERF-003 | Architecture / Unit | Partially (architecture review manual) |
| AC-021 | FR-021 | NFR-SEC-002 | CI / Static | Yes |
| AC-022 | FR-022 | NFR-SEC-002 | CI / Integration | Yes |
| AC-023 | FR-023 | NFR-SEC-004 | Unit / Integration | Yes |
| AC-024 | FR-024 | NFR-SEC-003, NFR-SEC-004 | Static / Integration | Yes |
| AC-025 | FR-025 | NFR-L10N-001 | CI / Static (lint) | Yes |

<!-- Generated by ATOS AI-DLC | Execution: f095c16e-e50d-4877-8d3f-4c6f9b456d64 | 2026-10-21T06:51:57.690Z -->