# Task Planner Requirements Digest

> All six requirement files pre-extracted. Use these IDs exactly in the plan.


## Functional Requirements


### FR-001: Global Bottom Navigation Bar Rendering
**Priority:** High

### FR-002: Navigation Item Selection
**Priority:** High

### FR-003: Single Active Tab Enforcement
**Priority:** High

### FR-004: Navigation State Persistence Across Screens
**Priority:** Medium

### FR-005: Navigation Configuration Retrieval
**Priority:** High

### FR-006: Error Handling on Navigation/Screen Load Failure
**Priority:** High

### FR-007: Retry Navigation Action
**Priority:** High

### FR-008: Return to Home (Safe Screen) Action
**Priority:** High

### FR-009: Invalid Transition Rejection
**Priority:** Medium

### FR-010: Localized String Retrieval
**Priority:** High

### FR-011: Language Selection on My Profile
**Priority:** High

### FR-012: Language Preference Persistence (Server Sync)
**Priority:** High

### FR-013: Background Language Sync on Reconnect
**Priority:** Medium

### FR-014: Immediate Language Application (No Restart)
**Priority:** High

### FR-015: RTL/LTR Layout Direction Mirroring
**Priority:** High

### FR-016: Directional Icon/Element Mirroring
**Priority:** Medium

### FR-017: Profile Retrieval
**Priority:** Medium

### FR-018: Section Content Retrieval
**Priority:** Low

### FR-019: Backend Health Check
**Priority:** Low

### FR-020: Centralized API Client Module
**Priority:** High

### FR-021: Repository Hygiene
**Priority:** High

### FR-022: Environment-Based Configuration
**Priority:** High

### FR-023: Audit Event Emission for State Transitions
**Priority:** Medium

### FR-024: PII Storage Segregation
**Priority:** High

### FR-025: No Hardcoded User-Facing Strings
**Priority:** Medium

_25 FRs total_


## Non-Functional Requirements


**PERF**
- NFR-PERF-001: Navigation Tab Switch Latency
- NFR-PERF-002: Navigation Config Load Time
- NFR-PERF-003: API Request Timeout
- NFR-PERF-004: Language Switch Application Time
- NFR-PERF-005: Retry Action Responsiveness

**REL**
- NFR-REL-001: Zero Blank-Screen Failure Rate
- NFR-REL-002: Offline Navigation Config Resilience
- NFR-REL-003: Retry Throttle Enforcement
- NFR-REL-004: Language Sync Reliability on Reconnect

**ACC**
- NFR-ACC-001: Bidirectional Text Rendering Compliance

**SEC**
- NFR-SEC-001: Transport Encryption
- NFR-SEC-002: Secrets Exclusion from Source Control
- NFR-SEC-003: Secure Token Storage
- NFR-SEC-004: PII Exclusion from Logs
- NFR-SEC-005: Client-Side Input Validation
- NFR-SEC-006: Error Message Information Hygiene
- NFR-SEC-007: Session Reset on Authentication Failure
- NFR-SEC-008: Dependency Version Pinning

**MAINT**
- NFR-MAINT-001: API Contract Abstraction (Swap-Without-Refactor)
- NFR-MAINT-002: Code Coverage Minimum
- NFR-MAINT-003: Single Codebase Cross-Platform Parity


## Acceptance Criteria

- AC-001: Bottom Navigation Bar Renders on All Primary Screens
- AC-002: Tapping a Navigation Item Activates It
- AC-003: Single Active Tab Enforcement
- AC-004: Navigation State Persists Across Session
- AC-005: Navigation Configuration Loads from Backend
- AC-006: Screen Load Failure Shows Non-Blank Error State
- AC-007: Retry Action Re-Invokes Failed Call
- AC-008: Return to Home Always Succeeds
- AC-009: Invalid Transitions Are Rejected Without Breaking UI
- AC-010: Localized Strings Source Navigation Labels
- AC-011: Language Selection on My Profile
- AC-012: Language Preference Syncs to Backend When Online/Authenticated
- AC-013: Deferred Language Sync Resolves on Reconnect
- AC-014: Language Change Applies Immediately Without Restart
- AC-015: RTL/LTR Layout Mirrors Atomically
- AC-016: Directional Icons Mirror with Layout Direction
- AC-017: Profile Data Initializes Locale and Profile Screen
- AC-018: Section Content Retrieval Supports Screen Rendering
- AC-019: Health Check Endpoint Available for Diagnostics
- AC-020: All Backend Calls Route Through Centralized API Client
- AC-021: Repository Contains No Committed Build Artifacts or Secrets
- AC-022: Environment Configuration Drives Backend URL Without Code Changes
- AC-023: Audit Events Emitted for All State Transitions Without PII
- AC-024: PII Fields Stored in Secure Storage Only
- AC-025: No Hardcoded User-Facing Strings in Navigation Components

## User Stories

> Story-phase tasks MUST be named after these US-* IDs (not FR-*). Each task covers ALL implementation layers for that story.


### US-001: View Persistent Bottom Navigation Bar

### US-002: Switch Between Primary Sections

### US-003: See Only One Active Tab at a Time

### US-004: Resume Where I Left Off

### US-005: Navigation Loads Reliably on App Start

### US-006: Clear Error Message Instead of a Blank Screen

### US-007: Retry a Failed Navigation Action

### US-008: Return to a Safe Screen After a Failure

### US-009: App Never Breaks on Invalid Actions

### US-010: Navigation Labels in My Language

### US-011: Choose My Preferred Language

### US-012: My Language Choice Is Remembered

### US-013: My Language Choice Syncs When I'm Back Online

### US-014: Language Changes Apply Instantly

### US-015: Layout Mirrors Correctly for Arabic

### US-016: Icons Point the Right Direction in Arabic

### US-017: My Profile Reflects My Saved Language

### US-018: Section Content Loads Within Each Tab

### US-019: App Diagnostics Can Confirm Backend Availability

### US-020: Backend Changes Don't Require App Rework

### US-021: Repository Stays Clean of Secrets and Build Artifacts

### US-022: Environment Config Lets Us Switch Backends Safely

### US-023: Every State Change Is Auditable Without Exposing Personal Data

### US-024: My Personal Data Is Stored Securely on My Device

### US-025: Every Piece of Navigation Text Is Translatable

_25 user stories total_


## Business Requirements

- BR-001: Unified Cross-Platform Navigation Experience
- BR-002: Zero-Dead-End Navigation Resilience
- BR-003: Full Bilingual (English/Arabic) Market Readiness
- BR-004: Self-Service Language Control
- BR-005: Production-Ready Engineering Foundation
- BR-006: Parallel Frontend/Backend Delivery Without Blocking
- BR-007: Visitor Data Protection and Trust

## Dependencies

# Dependencies — SB360 Mobile Application (Navigation & Localization)

**Derived from:** `Specifications/currentspec.md` v1.0, and `Requirements/01-functional-requirements.md` through `05-business-requirements.md`.

---

## 1. Boundary Map (System Interfaces)

| Interface | Producer | Consumer | Contract | Linked FR(s) | Notes |
|-----------|----------|----------|----------|---|-------|
| Navigation config | Backend API (existing, TBD) | React Native app (Navigation module) | REST JSON — `GET /api/v1/navigation/config` (API-001) | FR-001, FR-005 | Returns ordered list of nav items, icons, labels, section routes. Placeholder contract. |
| Localized strings | Backend API or bundled resource | React Native app (i18n module) | REST JSON — `GET /api/v1/i18n/{locale}` (API-002) or bundled static JSON fallback | FR-010 | Local bundle is authoritative fallback on API failure. |
| Language preference | React Native app (My Profile) | Backend API (existing, TBD) | REST JSON — `PUT /api/v1/profile/language` (API-003) | FR-011, FR-012, FR-013 | Persists visitor's language choice server-side when authenticated and online. |
| Profile data | Backend API (existing, TBD) | React Native app (My Profile) | REST JSON — `GET /api/v1/profile/me` (API-004) | FR-017 | Initializes UserProfile and LocalePreference. |
| Section content | Backend API (existing, TBD) | React Native app (Explore/Map/Plan screens) | REST JSON (per-section, TBD) — `GET /api/v1/sections/{sectionId}/content` (API-005) | FR-018 | Placeholder only; actual schema pending backend documentation. |
| Health/diagnostics | Backend API (existing, TBD) | React Native app (diagnostics) | REST JSON — `GET /api/v1/health` (API-006) | FR-019 | Internal diagnostic use only. |
| Local persistence (non-sensitive) | React Native app | Device local storage (AsyncStorage) | Key-value store | FR-004, FR-012, FR-024 | Caches last-selected language, last-active tab, cached nav config. |
| Local persistence (sensitive) | React Native app | Device secure storage (Keychain/Keystore) | Secure key-value store | FR-024 | Stores PII (email, displayName) and auth tokens. |
| Crash/error telemetry | React Native app | Error monitoring service (vendor TBD) | Event payload (TBD) | FR-023 | Vendor not yet selected — see Open Risks §5. |

---

## 2. External Contract Assumptions

These assumptions are inherited directly from the specification and must hold for the requirements in `01`–`05` to remain valid. Any change requires a spec revision and corresponding requirements update.

| # | Assumption | Basis | Affected Requirements |
|---|---|---|---|
| 1 | Backend API exists today but its real contract is undocumented; API-001–API-006 are placeholder/assumed definitions. | Spec §5 (note), §11 Clarifications #2. | All FR/AC/US referencing API-00x IDs (FR-005, FR-010, FR-012, FR-013, FR-017, FR-018, FR-019). |
| 2 | Authentication is Bearer token (JWT) for authenticated endpoints (API-003, API-004). | Spec §8.2, §11 Clarifications #6. | FR-012, FR-013, FR-017; NFR-SEC-003, NFR-SEC-007. |
| 3 | Client-side request timeout is fixed at 10,000 ms for all backend calls. | Spec §5, §8.2. | FR-006, FR-020; NFR-PERF-003. |
| 4 | React Native, TypeScript, React Navigation, Redux Toolkit, i18next/react-i18next, react-native-localize, react-native-keychain, AsyncStorage, Axios, GitHub Actions, and react-native-config are the resolved technology stack — no alternatives evaluated. | Spec §8.1 (Resolved Decisions), §11 Clarifications #3–4. | All FRs (architectural foundation). |
| 5 | The only actor/role in scope is "Visitor" — no multi-role/RBAC differentiation. | Spec §9 (RBAC), §11. | All FRs; explicitly excludes role-based navigation restriction requirements. |
| 6 | Section content schemas (API-005) are placeholder passthrough objects; real schema is undefined pending backend documentation. | Spec §5 (API-005 Response Schema: "schema TBD, placeholder passthrough object"). | FR-018. |

---

## 3. Technical Dependencies (Libr