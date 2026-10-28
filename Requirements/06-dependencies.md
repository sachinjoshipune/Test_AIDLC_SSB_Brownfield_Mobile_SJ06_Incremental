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

## 3. Technical Dependencies (Libraries & Platforms)

| Dependency | Version/Scope | Purpose | Linked FR(s)/NFR(s) |
|---|---|---|---|
| React Native | Latest stable LTS at implementation start (e.g., 0.74.x) | Cross-platform mobile framework | FR-001–FR-025 (foundation); NFR-MAINT-003 |
| TypeScript | Pinned exact version | Type safety, reduced integration defects | NFR-SEC-008 |
| React Navigation (bottom-tab navigator) | Pinned exact version | Navigation implementation, RTL support | FR-001–FR-004, FR-015 |
| Redux Toolkit | Pinned exact version | State management for NavigationTab, ScreenLoad, LocalePreference, UILayoutDirection state machines | FR-002, FR-003, FR-006–FR-009, FR-011, FR-015 |
| i18next + react-i18next | Pinned exact version | Localization/namespaced translations | FR-010, FR-025; NFR-L10N-001 |
| react-native-localize | Pinned exact version | Device locale detection | FR-010, FR-015 |
| react-native-keychain | Pinned exact version | Secure storage for PII and tokens | FR-024; NFR-SEC-003 |
| AsyncStorage | Pinned exact version | Non-sensitive local storage (language preference, nav config cache) | FR-004, FR-012, FR-024 |
| Axios | Pinned exact version | Centralized HTTP client with interceptors | FR-020; NFR-PERF-003 |
| GitHub Actions | N/A (CI/CD platform) | Build, lint, type-check, test on PR; release builds via Fastlane | NFR-MAINT-002, NFR-SEC-008 (pipeline gates) |
| react-native-config | Pinned exact version | Per-environment `.env` configuration | FR-022 |
| Fastlane | N/A (release tooling) | iOS/Android release build automation on tag | Supports FR-022 deployment pipeline |

> **Dependency hygiene constraint:** All third-party packages above must be pinned to exact versions (no caret/tilde ranges) per NFR-SEC-008.

---

## 4. Organizational / Process Dependencies

| Dependency | Status | Risk if Unresolved | Linked Requirement(s) |
|---|---|---|---|
| Named Engineering Lead/Reviewer sign-off | Pending (unassigned per Spec §0) | Governance gap — no accountable approver for this spec/requirements set | Cross-cutting; does not block requirements delivery but blocks formal approval. |
| Real backend API documentation (base URL, auth flow, schemas) | Pending (Spec §12 Open Question 1) | Reconciliation effort required post-delivery; placeholder contracts (API-001–API-006) may need schema/auth rework | FR-005, FR-010, FR-012, FR-013, FR-017, FR-018, FR-019, FR-020 |
| Approved visual design reference (Figma/design system) for icons, active-state styling, error message copy | Pending (Spec §12 Open Question 3) | Cannot finalize pixel-perfect visual acceptance testing (AC-001, AC-015, AC-016) until available | FR-001, FR-006, FR-015, FR-016 |
| Crash/error telemetry vendor selection | Pending (Spec §12 Open Question 4) | Audit events (FR-023) have no confirmed destination; retention policy undefined beyond 7-day local cap | FR-023 |
| Confirmation of applicable data-protection/regulatory regime | Pending (Spec §12 Open Question 6) | Current PII controls (NFR-SEC-004, FR-024) reflect general-practice defaults only; may need regime-specific additions | FR-023, FR-024; NFR-SEC-001–008 |
| Clarification on additional navigation bars referenced in story title | Pending (Spec §12 Open Question 2) | Scope creep risk if stakeholders expect additional nav bars not covered by this requirements set | Out-of-scope boundary (see `05-business-requirements.md` §3.2) |
| Offline-mode scope clarification (beyond cached nav config/language) | Pending (Spec §12 Open Question 8) | Current offline support (FR-005 cache fallback, FR-012 deferred sync) may be narrower or broader than ultimately required | FR-005, FR-012, FR-013; NFR-REL-002 |

---

## 5. Risk Notes

| Risk | Likelihood | Impact | Notes |
|---|---|---|---|
| Backend contract reconciliation introduces breaking schema changes | Medium | Medium | Mitigated architecturally by centralized `apiClient` module (FR-020, NFR-MAINT-001); impact limited to config/schema layer, not component rewrite. |
| RTL visual QA cannot be fully signed off without approved design reference | Medium | Low-Medium | AC-015/AC-016 can be functionally tested (atomicity, mirroring logic) ahead of final pixel-perfect design sign-off; visual regression baselines updated once design reference is confirmed. |
| Telemetry vendor delay leaves audit events (FR-023) unforwarded | Low | Low | Audit events can be logged locally/structured in the interim; forwarding integration is an additive step once vendor is selected, not a blocking architectural dependency. |
| Unassigned Engineering Lead delays formal requirements sign-off | Low | Medium | Requirements content itself is complete and internally consistent; only the approval/governance step is blocked. |
| Regulatory regime confirmation introduces new compliance requirements later | Medium | Medium | Current PII/security controls (Section 6 below) represent reasonable defaults; a future spec/requirements revision may be needed if region-specific rules (e.g., data residency) are identified. |

---

## 6. Compliance References

| Reference | Source | Applied Via |
|---|---|---|
| Minimum Code Coverage 80% (COMPLIANCE, HIGH) | `Policies/project-policy-document.md` | NFR-MAINT-002 (`02-non-functional-requirements.md`) |
| Code Review Required — ≥1 approval (APPROVAL, HIGH) | `Policies/project-policy-document.md` | Security Controls Matrix entry SC-010 (`02-non-functional-requirements.md` §6); GitHub branch protection. |
| Mandatory Security Scan before deployment (SECURITY, CRITICAL) | `Policies/project-policy-document.md` | Security Controls Matrix entry SC-009 (`02-non-functional-requirements.md` §6); CI/CD pipeline gate. |
| TLS 1.2+ transport security | Spec §8.3, §9 | NFR-SEC-001 |
| Bidirectional text rendering accessibility (RTL/LTR) | Spec §8.3 | NFR-ACC-001 |
| General data-protection practice (encryption in transit, no plaintext PII in logs) pending specific regulatory regime confirmation | Spec §8.3, §7.2, §9 | NFR-SEC-004, FR-024; flagged as open dependency above (regulatory regime confirmation). |

> This section references policy and compliance sources at a summary level only; full policy text is not duplicated here. See `Policies/project-policy-document.md` for the canonical policy document.

---

## 7. Dependency Summary by Requirements Phase

| Phase Artifact | Primary External Dependencies |
|---|---|
| `01-functional-requirements.md` | API-001–API-006 placeholder contracts; resolved technology stack (Spec §8.1) |
| `02-non-functional-requirements.md` | TLS/transport infrastructure; CI/CD pipeline (GitHub Actions); secret-scanning and lint tooling |
| `03-acceptance-criteria.md` | Test automation tooling (Detox/Appium, Jest); network simulation tooling for offline/timeout scenarios |
| `04-user-stories.md` | No additional external dependencies beyond those in 01–03 (derivative artifact) |
| `05-business-requirements.md` | Organizational policy document (`Policies/project-policy-document.md`); stakeholder sign-off (pending Engineering Lead assignment) |
| `06-dependencies.md` (this file) | Aggregates all of the above; primary owner of open organizational/process dependencies |

<!-- Generated by ATOS AI-DLC | Execution: f095c16e-e50d-4877-8d3f-4c6f9b456d64 | 2026-10-21T06:51:57.691Z -->