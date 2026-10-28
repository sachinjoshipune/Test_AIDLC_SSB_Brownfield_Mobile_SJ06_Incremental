# Business Requirements — SB360 Mobile Application (Navigation & Localization)

**Derived from:** `Specifications/currentspec.md` v1.0, `Requirements/01-functional-requirements.md` through `04-user-stories.md`.

---

## 1. Business Context

SB360 is launching a hybrid mobile application (React Native, iOS + Android) targeting a regional audience that includes a significant Arabic-speaking population. The first production-ready capability is a global Bottom Navigation Bar anchoring four core sections — Explore, Map, Plan, My Profile — with full bilingual (English/Arabic) support. The business driver is to establish a consistent, trustworthy navigation foundation before expanding section-level functionality, while integrating against an existing (but currently undocumented) backend API without blocking delivery.

---

## 2. Business Requirements

## BR-001: Unified Cross-Platform Navigation Experience
**Priority:** High
**Business Goal:** Deliver one consistent navigation experience across iOS and Android from a single codebase, reducing engineering duplication and visitor confusion.
**Linked FR(s):** FR-001, FR-002, FR-003, FR-004
**Success Metric:** 100% of primary screens (Explore, Map, Plan, My Profile) render the Bottom Navigation Bar with correct active-state highlighting in manual/automated UI verification, on both platforms.
**Source:** Spec §4 Goal 1, §10.

## BR-002: Zero-Dead-End Navigation Resilience
**Priority:** High
**Business Goal:** Protect visitor trust and reduce app-abandonment risk by guaranteeing that navigation failures never leave visitors stranded on a blank or broken screen.
**Linked FR(s):** FR-006, FR-007, FR-008, FR-009
**Success Metric:** 0 unhandled navigation failures reach a blank screen in QA regression; Retry and Return-to-Home paths available and functional in 100% of failure scenarios tested.
**Source:** Spec §4 Goal 1, §10.

## BR-003: Full Bilingual (English/Arabic) Market Readiness
**Priority:** High
**Business Goal:** Enable SB360 to serve its regional target market (including Arabic-speaking visitors) with a fully localized, correctly-mirrored RTL experience, positioning the app for regional market fit from launch.
**Linked FR(s):** FR-010, FR-011, FR-014, FR-015, FR-016, FR-025
**Success Metric:** 100% of navigation-bar strings sourced from the localization layer (zero hardcoded strings); RTL layout mirroring verified on both supported OS platforms.
**Source:** Spec §4 Goal 2, §10.

## BR-004: Self-Service Language Control
**Priority:** Medium
**Business Goal:** Give visitors direct control over their language experience from My Profile, increasing accessibility and visitor satisfaction without requiring app reinstallation or support intervention.
**Linked FR(s):** FR-011, FR-012, FR-013, FR-014, FR-017
**Success Metric:** Language switch applies to all visible navigation/UI text within the same screen render cycle, with no app restart required.
**Source:** Spec §4 Goal 4.

## BR-005: Production-Ready Engineering Foundation
**Priority:** High
**Business Goal:** Avoid technical debt and rework by establishing repository hygiene, environment-based configuration, and an abstracted backend integration layer from day one, enabling faster future iteration once real backend documentation arrives.
**Linked FR(s):** FR-020, FR-021, FR-022, FR-023, FR-024
**Success Metric:** Repository contains no committed build artifacts, credentials, or platform-generated files; all API calls route through a single configurable client module; swapping placeholder contracts for real backend contracts requires configuration/schema updates only, no structural refactor.
**Source:** Spec §4 Goal 3, §10.

## BR-006: Parallel Frontend/Backend Delivery Without Blocking
**Priority:** Medium
**Business Goal:** Reduce time-to-market risk caused by the undocumented backend by allowing mobile engineering to proceed in parallel against explicit placeholder contracts, reconciled later via a controlled spec revision process.
**Linked FR(s):** FR-005, FR-010, FR-012, FR-017, FR-018, FR-020
**Success Metric:** All 6 API contracts (API-001–API-006) implemented against the abstracted client module with zero structural rework required at reconciliation time.
**Source:** Spec §3 Problem Statement, §11 Clarifications & Decisions #2.

## BR-007: Visitor Data Protection and Trust
**Priority:** High
**Business Goal:** Protect visitor trust and reduce regulatory/reputational risk by ensuring PII (email, display name) is never exposed in logs, telemetry, or insecure local storage.
**Linked FR(s):** FR-023, FR-024
**Success Metric:** 0 occurrences of PII fields in application logs, telemetry payloads, or non-secure local storage across QA and production monitoring.
**Source:** Spec §7.2, §9.

---

## 3. In-Scope vs Out-of-Scope (Business View)

### 3.1 In Scope

| Area | Business Justification |
|---|---|
| React Native hybrid app (iOS + Android, single codebase) | Explicit mandate from stakeholder kickoff (Source 2); minimizes dual-platform engineering cost. |
| Global Bottom Navigation Bar (Explore, Map, Plan, My Profile) | Core information architecture required before any section-level feature work can proceed. |
| Active-state highlighting, single-active-tab enforcement, navigation state persistence | Directly tied to BR-001; prevents visitor disorientation. |
| English/Arabic bilingual support incl. RTL/LTR mirroring | Directly tied to BR-003; required for regional market viability. |
| Language selection on My Profile | Directly tied to BR-004; self-service reduces support burden. |
| Graceful failure handling (Retry / Return to Home) | Directly tied to BR-002; protects visitor trust during backend instability. |
| Placeholder backend integration contracts (API-001–API-006) | Directly tied to BR-006; unblocks delivery despite undocumented backend. |
| Production-readiness baseline (`.gitignore`, env config, error boundaries, secure storage) | Directly tied to BR-005 and BR-007; avoids costly retrofit later. |

### 3.2 Out of Scope

| Area | Business Justification for Exclusion |
|---|---|
| Navigation bars other than the Bottom Navigation Bar (e.g., top bar, side drawer) | No design detail, dimensions, or scenarios provided in any source; would require fabrication, violating grounding requirements. Candidate for a future iteration/user story. |
| Backend API implementation, database design, server-side business logic | Backend is an existing, separately-owned system; out of this app team's delivery scope. |
| Section-internal content/business logic for Explore, Map, Plan, My Profile (beyond nav entry point and language selector) | Not detailed in sources; separately scoped future work once section requirements are defined. |
| Native-module development beyond what's needed for navigation, localization, secure storage | Minimizes platform-specific engineering surface area; no business need identified beyond these three capabilities. |
| Support for languages other than English and Arabic | No business requirement identified for additional languages at this stage; architecture (i18next namespacing) supports future addition without rework. |
| Web or desktop versions of the application | Explicitly mobile-only initiative per Source 2; web/desktop not part of this business initiative. |
| Multi-role / RBAC navigation restrictions | Single "Visitor" actor scope confirmed; no business case for differentiated access presented in sources. |
| Security attack-simulation / adversarial penetration testing scenarios | Not mandated by approved requirements; standard input-validation and error-hygiene controls (Spec §9) are sufficient for current scope. |

---

## 4. Success Metrics Summary (Business-Level)

| Metric | Target | Linked BR(s) |
|---|---|---|
| Primary screens rendering Bottom Navigation Bar correctly | 100% | BR-001 |
| Unhandled navigation failures reaching blank screen (QA regression) | 0 | BR-002 |
| Navigation-bar strings sourced from localization layer (zero hardcoded) | 100% | BR-003 |
| RTL layout mirroring verified on both platforms | Pass on iOS + Android | BR-003 |
| Language switch applies without app restart | Same render cycle, 0 restarts required | BR-004 |
| Repository free of committed build artifacts/secrets | 100% clean-clone check | BR-005 |
| API calls routed through single configurable client module | 100% | BR-005, BR-006 |
| Structural rework required at backend contract reconciliation | 0 | BR-006 |
| PII occurrences in logs/telemetry/insecure storage | 0 | BR-007 |

---

## 5. Business Risks & Mitigations

| Risk | Impact | Mitigation (Tied to Requirements) |
|---|---|---|
| Undocumented backend contract diverges significantly from placeholder API-001–API-006 at reconciliation time | Delivery delay, potential rework | BR-005/BR-006: centralized `apiClient` module (FR-020) isolates contract changes to configuration/schema layer. |
| Arabic RTL experience is poorly received due to incomplete mirroring | Regional market reputational risk | BR-003: NFR-L10N-002/003 mandate 100% mirroring coverage and atomic direction switching, verified via visual regression testing. |
| Visitor frustration/churn from unresolved navigation failures | Lost engagement, negative reviews | BR-002: mandatory Retry/Return-to-Home paths (FR-007, FR-008) with zero-blank-screen success criterion. |
| PII exposure via logs or insecure storage damages visitor trust | Reputational/compliance risk | BR-007: storage segregation (FR-024) and PII-free audit logging (FR-023) enforced and verified. |
| Named Engineering Lead/Reviewer sign-off is still pending (Spec §0) | Governance/accountability gap at spec approval | Flagged in `06-dependencies.md` as an open organizational dependency; does not block requirements authoring. |

---

## 6. Alignment with Organizational Policy

| Policy (from `Policies/project-policy-document.md`) | Business Requirement Alignment |
|---|---|
| Minimum Code Coverage 80% (COMPLIANCE, HIGH) | Supports BR-005 (production-ready foundation) — see NFR-MAINT-002. |
| Code Review Required (APPROVAL, HIGH) | Supports BR-005 and BR-007 (quality/security gate before merge). |
| Mandatory Security Scan (SECURITY, CRITICAL) | Supports BR-007 (visitor data protection) — see Security Controls Matrix, `02-non-functional-requirements.md` §6. |

> Full policy details are not duplicated here; see `06-dependencies.md` Compliance References for the canonical pointer to `Policies/project-policy-document.md`.

<!-- Generated by ATOS AI-DLC | Execution: f095c16e-e50d-4877-8d3f-4c6f9b456d64 | 2026-10-21T06:51:57.691Z -->