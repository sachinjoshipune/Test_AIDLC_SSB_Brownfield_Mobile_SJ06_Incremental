# User Stories — SB360 Mobile Application (Navigation & Localization)

**Derived from:** `Requirements/01-functional-requirements.md`, `Requirements/03-acceptance-criteria.md`, and `Specifications/currentspec.md` v1.0.
**Actor:** "Visitor" (single actor role per Spec §9 RBAC note — no multi-role access defined in this spec).

---

## US-001: View Persistent Bottom Navigation Bar
**As a** visitor using the SB360 app,
**I want** to always see a Bottom Navigation Bar on Explore, Map, Plan, and My Profile screens,
**so that** I can orient myself and move between core sections without losing context.

**Linked FR:** FR-001
**Linked AC:** AC-001
**Linked State Transition(s):** N/A (initial render, not a transition)

```gherkin
Given I have launched the SB360 app on iOS or Android
And the navigation configuration has loaded successfully
When I am on the Explore, Map, Plan, or My Profile screen
Then I see the Bottom Navigation Bar at the bottom of the screen
And it contains exactly four items: Explore, Map, Plan, My Profile
```

---

## US-002: Switch Between Primary Sections
**As a** visitor,
**I want** to tap a navigation item to move to that section,
**so that** I can quickly access Explore, Map, Plan, or My Profile.

**Linked FR:** FR-002
**Linked AC:** AC-002
**Linked State Transition(s):** NavigationTab `inactive → active`

```gherkin
Given I am on any primary screen with the Bottom Navigation Bar visible
And the "Map" tab's route exists in the navigation configuration
When I tap the "Map" navigation item
Then the "Map" tab becomes active
And I am taken to the Map screen
```

---

## US-003: See Only One Active Tab at a Time
**As a** visitor,
**I want** only the section I am currently viewing to be highlighted as active,
**so that** the navigation bar always accurately reflects my current location in the app.

**Linked FR:** FR-003
**Linked AC:** AC-003
**Linked State Transition(s):** NavigationTab `active → inactive` (previous), `inactive → active` (new)

```gherkin
Given the "Explore" tab is currently shown as active
When I tap the "Plan" navigation item
Then "Explore" is no longer shown as active
And "Plan" is shown as the only active tab
```

---

## US-004: Resume Where I Left Off
**As a** visitor,
**I want** the app to remember which tab and screen I was last on,
**so that** I don't lose my place when I return to the app.

**Linked FR:** FR-004
**Linked AC:** AC-004
**Linked State Transition(s):** SessionState persistence (non-state-machine entity, Data Model §7.1)

```gherkin
Given I was last viewing the "Plan" tab before leaving the app
When I reopen the app without uninstalling/reinstalling it
Then I am returned to the "Plan" tab and its last-visited route
```

---

## US-005: Navigation Loads Reliably on App Start
**As a** visitor,
**I want** the navigation bar to load correctly every time I open the app, even with limited connectivity,
**so that** I can always navigate the app regardless of network conditions.

**Linked FR:** FR-005
**Linked AC:** AC-005
**Linked State Transition(s):** ScreenLoad `idle → loading → loaded`

```gherkin
Given I have network connectivity when I open the app
When the navigation configuration is fetched successfully
Then the Bottom Navigation Bar renders with the correct items in order

Given I previously used the app successfully and have no network connectivity now
When I open the app
Then the Bottom Navigation Bar renders using the last cached configuration
```

---

## US-006: Clear Error Message Instead of a Blank Screen
**As a** visitor,
**I want** to see a clear, understandable message if a section fails to load,
**so that** I am never confused by a blank or broken screen.

**Linked FR:** FR-006
**Linked AC:** AC-006
**Linked State Transition(s):** ScreenLoad `loading → error`

```gherkin
Given I have tapped a navigation item and the screen is loading
When the content fails to load (server error or timeout)
Then I see a clear, localized error message instead of a blank screen
And I see options to Retry or Return to Home
```

---

## US-007: Retry a Failed Navigation Action
**As a** visitor,
**I want** to retry loading a section that failed,
**so that** I can recover from a temporary problem without restarting the app.

**Linked FR:** FR-007
**Linked AC:** AC-007
**Linked State Transition(s):** ScreenLoad `error → loading`

```gherkin
Given I am viewing an error message after a failed section load
And I have not already retried 3 times in the last minute
When I tap "Retry"
Then the app attempts to load the section again

Given I have already retried 3 times in the last minute for this section
When I tap "Retry" again
Then my retry attempt is not sent to the server
And I remain on the error screen with Retry and Return to Home still visible
```

---

## US-008: Return to a Safe Screen After a Failure
**As a** visitor,
**I want** a guaranteed way back to a working screen when something goes wrong,
**so that** I am never stuck on an error screen with no way forward.

**Linked FR:** FR-008
**Linked AC:** AC-008
**Linked State Transition(s):** ScreenLoad `error → idle (Explore)`

```gherkin
Given I am viewing an error message after a failed section load
When I tap "Return to Home"
Then I am taken to the Explore screen
And this action always works, regardless of how many times I've retried
```

---

## US-009: App Never Breaks on Invalid Actions
**As a** visitor,
**I want** the app to safely ignore actions that don't make sense (like a corrupted navigation tap),
**so that** I never see the app enter a broken or undefined state.

**Linked FR:** FR-009
**Linked AC:** AC-009
**Linked State Transition(s):** Any — rejected transition (State Model §6.3)

```gherkin
Given the app attempts an internal action that references a navigation tab that doesn't exist
When that action is processed
Then the action is safely rejected
And the app continues showing my last valid screen and tab state
```

---

## US-010: Navigation Labels in My Language
**As an** Arabic-speaking visitor,
**I want** navigation labels shown in Arabic,
**so that** I can use the app comfortably in my preferred language.

**Linked FR:** FR-010
**Linked AC:** AC-010
**Linked State Transition(s):** N/A (data retrieval, not a state machine transition)

```gherkin
Given my active language is Arabic
When the navigation bar loads
Then all navigation labels display in Arabic, sourced from the localization data

Given the localization service is temporarily unavailable
When the navigation bar loads
Then labels still display correctly using a bundled Arabic fallback, never a blank or raw key
```

---

## US-011: Choose My Preferred Language
**As a** visitor,
**I want** to select English or Arabic from my profile,
**so that** I can use the app in the language I'm most comfortable with.

**Linked FR:** FR-011
**Linked AC:** AC-011
**Linked State Transition(s):** LocalePreference `en ↔ ar`

```gherkin
Given I am on the My Profile screen
And my current language is English
When I select Arabic from the language option
Then my language preference changes to Arabic
```

---

## US-012: My Language Choice Is Remembered
**As a** visitor,
**I want** my language selection to be saved,
**so that** I don't have to re-select it every time I use the app.

**Linked FR:** FR-012
**Linked AC:** AC-012
**Linked State Transition(s):** LocalePreference persist (`any → persisted`/`persist_deferred`)

```gherkin
Given I am logged in and have an internet connection
When I change my language to Arabic
Then my new language preference is saved to my account on the server

Given I am not logged in or have no internet connection
When I change my language to Arabic
Then my preference is saved on my device and will sync later
```

---

## US-013: My Language Choice Syncs When I'm Back Online
**As a** visitor,
**I want** a language change I made offline to be saved to my account once I reconnect,
**so that** my preference is consistent across sessions and devices.

**Linked FR:** FR-013
**Linked AC:** AC-013
**Linked State Transition(s):** LocalePreference `pending_sync → synced`

```gherkin
Given I changed my language while offline and it was saved locally only
When my device reconnects to the internet
Then the app automatically saves my language preference to my account
And I don't have to take any additional action
```

---

## US-014: Language Changes Apply Instantly
**As a** visitor,
**I want** my language change to apply right away,
**so that** I don't have to restart the app to see it take effect.

**Linked FR:** FR-014
**Linked AC:** AC-014
**Linked State Transition(s):** N/A (UI rendering effect of LocalePreference change)

```gherkin
Given I am on the My Profile screen
When I confirm a language change
Then all visible navigation text updates immediately to the new language
And I do not need to restart the app
```

---

## US-015: Layout Mirrors Correctly for Arabic
**As an** Arabic-speaking visitor,
**I want** the entire navigation layout to mirror to right-to-left,
**so that** the app feels natural to read and use in my language.

**Linked FR:** FR-015
**Linked AC:** AC-015
**Linked State Transition(s):** UILayoutDirection `LTR ↔ RTL`

```gherkin
Given my language is currently English (LTR layout)
When I switch my language to Arabic
Then the entire navigation layout mirrors to right-to-left in a single, clean switch
And I never see a half-mirrored or broken layout during the switch
```

---

## US-016: Icons Point the Right Direction in Arabic
**As an** Arabic-speaking visitor,
**I want** directional icons (like arrows) to point the correct way for right-to-left reading,
**so that** the app's visual cues make sense in my language.

**Linked FR:** FR-016
**Linked AC:** AC-016
**Linked State Transition(s):** Derived from UILayoutDirection (see US-015)

```gherkin
Given a directional icon is shown pointing in the LTR direction
When my layout switches to RTL
Then the icon is shown flipped to match the RTL direction
```

---

## US-017: My Profile Reflects My Saved Language
**As a** visitor,
**I want** my profile screen to show my language setting correctly when I open the app,
**so that** I can see and trust my current preference at a glance.

**Linked FR:** FR-017
**Linked AC:** AC-017
**Linked State Transition(s):** N/A (initialization from retrieved profile data)

```gherkin
Given I am logged in
When my profile data is retrieved from the server
Then my language preference shown on My Profile matches the value from my account
```

---

## US-018: Section Content Loads Within Each Tab
**As a** visitor,
**I want** to see content when I open Explore, Map, or Plan,
**so that** the navigation leads somewhere useful, not just an empty tab.

**Linked FR:** FR-018
**Linked AC:** AC-018
**Linked State Transition(s):** ScreenLoad `loading → loaded`

```gherkin
Given I have navigated to the Explore tab
When the section content loads successfully
Then I see the content associated with that section
```

---

## US-019: App Diagnostics Can Confirm Backend Availability
**As a** support engineer (non-visitor-facing internal stakeholder),
**I want** the app to have a way to check backend health,
**so that** connectivity issues can be diagnosed without relying on visitor-reported symptoms alone.

**Linked FR:** FR-019
**Linked AC:** AC-019
**Linked State Transition(s):** N/A (diagnostic utility, not part of visitor-facing state machine)

```gherkin
Given a diagnostic check needs to run
When the health endpoint is called
Then a status response confirms whether the backend is reachable
And this check does not appear in the visitor-facing navigation UI
```

---

## US-020: Backend Changes Don't Require App Rework
**As a** developer maintaining the SB360 app,
**I want** all backend calls centralized through one client module,
**so that** when the real backend contract is provided, I can update configuration without rewriting navigation/localization components.

**Linked FR:** FR-020
**Linked AC:** AC-020
**Linked State Transition(s):** N/A (architectural requirement)

```gherkin
Given all backend calls currently go through the centralized apiClient module
When the real backend contract becomes available and differs from the placeholder
Then only the apiClient configuration/schema mapping needs updating
And navigation and localization screen components remain unchanged
```

---

## US-021: Repository Stays Clean of Secrets and Build Artifacts
**As a** developer on the SB360 team,
**I want** the repository to never contain build artifacts or secrets,
**so that** the codebase remains secure and safe to clone/share.

**Linked FR:** FR-021
**Linked AC:** AC-021
**Linked State Transition(s):** N/A (repository hygiene control)

```gherkin
Given a teammate clones the repository fresh
When they inspect the repository contents
Then no node_modules, build directories, or secret files are present
```

---

## US-022: Environment Config Lets Us Switch Backends Safely
**As a** developer deploying the SB360 app,
**I want** environment-specific configuration files for dev/staging/production,
**so that** I can point the app at the correct backend without editing source code or risking leaked secrets.

**Linked FR:** FR-022
**Linked AC:** AC-022
**Linked State Transition(s):** N/A (build/deployment configuration)

```gherkin
Given I am building the app for the "production" environment
When the build process runs
Then the app uses API_BASE_URL from .env.production
And no .env file is committed to source control
```

---

## US-023: Every State Change Is Auditable Without Exposing Personal Data
**As a** platform operator,
**I want** every navigation and locale state transition logged as a structured, PII-free event,
**so that** I can monitor app behavior and diagnose issues without risking visitor privacy.

**Linked FR:** FR-023
**Linked AC:** AC-023
**Linked State Transition(s):** All transitions in State Model §6.1 and §6.2

```gherkin
Given any navigation or locale state transition occurs
When the corresponding audit event is emitted
Then the event contains only non-PII fields (e.g., tabId, timestamp, errorCode)
And the event never contains email or displayName
```

---

## US-024: My Personal Data Is Stored Securely on My Device
**As a** visitor,
**I want** my email and display name stored securely on my device,
**so that** my personal information isn't exposed if my device is compromised.

**Linked FR:** FR-024
**Linked AC:** AC-024
**Linked State Transition(s):** N/A (storage architecture requirement)

```gherkin
Given my profile data (email, display name) has been retrieved
When it is cached on my device
Then it is stored in secure device storage, not in general-purpose local storage
```

---

## US-025: Every Piece of Navigation Text Is Translatable
**As a** localization QA reviewer,
**I want** zero hardcoded strings in navigation components,
**so that** we can confidently add or update languages without missing untranslated text.

**Linked FR:** FR-025
**Linked AC:** AC-025
**Linked State Transition(s):** N/A (code-quality requirement)

```gherkin
Given the navigation component source code is scanned for hardcoded strings
When the automated lint check runs
Then zero hardcoded user-facing string literals are found
```

---

## Cross-Reference Summary

| US ID | FR ID(s) | AC ID(s) | Primary State Transition(s) |
|---|---|---|---|
| US-001 | FR-001 | AC-001 | — |
| US-002 | FR-002 | AC-002 | NavigationTab inactive→active |
| US-003 | FR-003 | AC-003 | NavigationTab active→inactive→active |
| US-004 | FR-004 | AC-004 | SessionState persistence |
| US-005 | FR-005 | AC-005 | ScreenLoad idle→loading→loaded |
| US-006 | FR-006 | AC-006 | ScreenLoad loading→error |
| US-007 | FR-007 | AC-007 | ScreenLoad error→loading |
| US-008 | FR-008 | AC-008 | ScreenLoad error→idle |
| US-009 | FR-009 | AC-009 | Rejected transition (§6.3) |
| US-010 | FR-010 | AC-010 | — |
| US-011 | FR-011 | AC-011 | LocalePreference en↔ar |
| US-012 | FR-012 | AC-012 | LocalePreference persisted/deferred |
| US-013 | FR-013 | AC-013 | LocalePreference pending_sync→synced |
| US-014 | FR-014 | AC-014 | — |
| US-015 | FR-015 | AC-015 | UILayoutDirection LTR↔RTL |
| US-016 | FR-016 | AC-016 | Derived from UILayoutDirection |
| US-017 | FR-017 | AC-017 | — |
| US-018 | FR-018 | AC-018 | ScreenLoad loading→loaded |
| US-019 | FR-019 | AC-019 | — |
| US-020 | FR-020 | AC-020 | — |
| US-021 | FR-021 | AC-021 | — |
| US-022 | FR-022 | AC-022 | — |
| US-023 | FR-023 | AC-023 | All (§6.1, §6.2) |
| US-024 | FR-024 | AC-024 | — |
| US-025 | FR-025 | AC-025 | — |

<!-- Generated by ATOS AI-DLC | Execution: f095c16e-e50d-4877-8d3f-4c6f9b456d64 | 2026-10-21T06:51:57.691Z -->