# Non-Functional Requirements — SB360 Mobile Application (Navigation & Localization)

**Derived from:** `Specifications/currentspec.md` v1.0 (2026-10-21) and `Requirements/01-functional-requirements.md`.

---

## 1. Performance

## NFR-PERF-001: Navigation Tab Switch Latency
**Category:** Performance
**Target:** Visual active-state highlight update for a tapped navigation tab completes within **100 ms** of touch event, on both iOS and Android reference devices (mid-tier: iPhone 12 / equivalent Android, OS N-1).
**Rationale:** Supports FR-002/FR-003 (immediate, predictable single-active-tab feedback); prevents perceived lag that would undermine the "consistent, resilient" navigation goal (Spec §4 Goal 1).
**Verification:** Automated UI performance test (Detox/Appium) measuring time from tap event to style-update commit, across ≥20 trial runs per platform; 95th percentile must meet target.
**Related FR(s):** FR-002, FR-003.

## NFR-PERF-002: Navigation Config Load Time
**Category:** Performance
**Target:** API-001 navigation config retrieval (FR-005) completes and renders the Bottom Navigation Bar within **2,000 ms** on a standard broadband/4G connection (≥5 Mbps), excluding first-cold-start app install.
**Rationale:** Ensures the primary navigation chrome is usable quickly on app launch; aligns with client timeout budget (10,000 ms) while being materially faster for the common path.
**Verification:** Automated integration test measuring time from app launch event to Bottom Navigation Bar fully rendered, under simulated network conditions (network-link-conditioner / Charles Proxy throttling).
**Related FR(s):** FR-005, FR-001.

## NFR-PERF-003: API Request Timeout
**Category:** Performance
**Target:** All backend requests (API-001 through API-005) enforce a client-side timeout of exactly **10,000 ms** (`API_TIMEOUT_MS=10000`), after which the request is treated as failed.
**Rationale:** Directly specified in Spec §5 and §8.2; bounds worst-case wait time before error handling (FR-006) engages.
**Verification:** Unit test on `apiClient` interceptor confirming requests are aborted/rejected at the configured timeout boundary (±100 ms tolerance).
**Related FR(s):** FR-006, FR-020.

## NFR-PERF-004: Language Switch Application Time
**Category:** Performance
**Target:** After a visitor confirms a language change on My Profile, all visible navigation labels and layout direction update within **300 ms**, within the same render cycle, with no app restart.
**Rationale:** Operationalizes FR-014's "same render cycle" requirement with a measurable upper bound suitable for automated verification; derived default since spec provides no explicit millisecond figure (see Assumptions Register, 01-functional-requirements.md, item 7).
**Verification:** Automated UI test measuring elapsed time between language-change confirmation event and final re-rendered navigation bar text/direction; assert app process is not relaunched.
**Related FR(s):** FR-014, FR-015.

## NFR-PERF-005: Retry Action Responsiveness
**Category:** Performance
**Target:** Tapping Retry (FR-007) re-invokes the failed request within **200 ms** of tap, with the loading indicator displayed immediately (no apparent delay before `loading` state is shown).
**Rationale:** Prevents the Retry action from feeling unresponsive, which would undermine the zero-blank-screen resilience goal (Spec §4 Goal 1, §10).
**Verification:** Automated UI test measuring time from Retry tap to `ScreenLoad` state transitioning to `loading`.
**Related FR(s):** FR-007.

---

## 2. Reliability & Availability

## NFR-REL-001: Zero Blank-Screen Failure Rate
**Category:** Reliability
**Target:** **0 occurrences** of a blank or broken screen following any navigation failure across the full QA regression suite (100% of navigation failure test scenarios must resolve to a visible error state with Retry/Return-to-Home).
**Rationale:** Directly stated success criterion in Spec §10.
**Verification:** QA regression suite covering all documented failure injection points (API-001, API-005 4xx/5xx/timeout); manual + automated UI assertion that an error view (not blank view) is rendered.
**Related FR(s):** FR-006, FR-007, FR-008.

## NFR-REL-002: Offline Navigation Config Resilience
**Category:** Reliability
**Target:** When API-001 is unreachable, the Bottom Navigation Bar renders using the last successfully cached `NavigationItem` list (if any exists on-device) within the same performance budget as NFR-PERF-002, rather than failing to render.
**Rationale:** Supports FR-005's offline-resilience caching requirement.
**Verification:** Integration test simulating network failure on app launch with a pre-populated local cache; assert Bottom Navigation Bar renders from cache.
**Related FR(s):** FR-005.

## NFR-REL-003: Retry Throttle Enforcement
**Category:** Reliability
**Target:** No more than **3 retry attempts** per failed route within any rolling **60-second** window; the 4th+ attempt within the window is rejected client-side per FR-009.
**Rationale:** Directly specified in Spec §6.1 guard condition; prevents retry storms against a potentially degraded backend.
**Verification:** Unit test simulating 4 rapid Retry taps within 60 seconds; assert the 4th is rejected with a `*.transition.rejected` log and no network call is issued.
**Related FR(s):** FR-007, FR-009.

## NFR-REL-004: Language Sync Reliability on Reconnect
**Category:** Reliability
**Target:** **100%** of `pending_sync` language preferences are automatically resolved via API-003 within **30 seconds** of network connectivity restoration being detected.
**Rationale:** Supports FR-013 background sync requirement; numeric target is a derived default since spec does not specify an exact reconciliation SLA.
**Verification:** Integration test: set device offline, change language (creating `pending_sync`), restore connectivity, assert API-003 call fires and `profile.language.sync_resolved` event emits within 30s.
**Related FR(s):** FR-013.

---

## 3. Localization & Accessibility

## NFR-L10N-001: Zero Hardcoded String Rate
**Category:** Localization / Code Quality
**Target:** **0%** (zero) hardcoded user-facing string literals in navigation-related component source files, verified by static analysis/lint rule.
**Rationale:** Directly specified success metric in Spec §4 Goal 2 and §8.3.
**Verification:** Automated lint rule (e.g., ESLint i18n plugin) run in CI on every PR; build fails on any detected hardcoded user-facing string in navigation components.
**Related FR(s):** FR-010, FR-025.

## NFR-L10N-002: RTL Layout Mirroring Completeness
**Category:** Localization / UI
**Target:** **100%** of Bottom Navigation Bar elements (layout, icons, text alignment) correctly mirror to RTL when locale = `ar`, verified on both iOS and Android.
**Rationale:** Directly specified success metric in Spec §4 Goal 2 and §10.
**Verification:** Automated visual regression test (snapshot diff) comparing LTR and RTL renders against approved baselines on both platforms; manual QA sign-off on visual design reference once available (see Spec §12 Open Question 3).
**Related FR(s):** FR-015, FR-016.

## NFR-L10N-003: Atomic Direction Switch (No Partial Mirror)
**Category:** Localization / UI Integrity
**Target:** **0 intermediate frames** showing a partial/mixed LTR-RTL mirror state during a locale switch; direction change is applied as a single atomic UI update.
**Rationale:** Directly specified guard in Spec §6.2 ("no partial-mirror intermediate state permitted").
**Verification:** Automated UI test capturing frame-by-frame render state during a locale switch; assert no frame contains mixed directional layout.
**Related FR(s):** FR-015.

## NFR-ACC-001: Bidirectional Text Rendering Compliance
**Category:** Accessibility / Compliance
**Target:** Bidirectional text rendering (Arabic RTL, English LTR) conforms to platform accessibility guidelines (iOS Human Interface Guidelines, Android Material Design) for text direction and screen-reader (VoiceOver/TalkBack) traversal order.
**Rationale:** Directly specified in Spec §8.3 Compliance Requirements.
**Verification:** Manual accessibility audit using VoiceOver (iOS) and TalkBack (Android) confirming correct reading order matches visual direction in both locales.
**Related FR(s):** FR-015, FR-016.

---

## 4. Security

## NFR-SEC-001: Transport Encryption
**Category:** Security
**Target:** **100%** of API calls (API-001 through API-006) use TLS 1.2 or higher; **0** cleartext HTTP requests permitted in any build configuration, including development.
**Rationale:** Directly specified in Spec §9 (Transport security).
**Verification:** Static configuration audit of `apiClient`/network security config files (Android `network_security_config.xml`, iOS ATS settings) in CI; automated test confirming HTTP (non-TLS) base URLs are rejected at build time.
**Related FR(s):** FR-020.

## NFR-SEC-002: Secrets Exclusion from Source Control
**Category:** Security
**Target:** **0** committed secrets, API keys, or backend URLs in source control history; all environment values supplied via `.env` files excluded by `.gitignore` and CI/CD secret stores.
**Rationale:** Directly specified in Spec §9 (Secrets management) and §8.1 (repository hygiene).
**Verification:** Automated secret-scanning tool (e.g., gitleaks/trufflehog) run in CI on every PR and on full repo history at release-branch creation; build fails on detection.
**Related FR(s):** FR-021, FR-022.

## NFR-SEC-003: Secure Token Storage
**Category:** Security
**Target:** **100%** of Bearer tokens (JWT) stored exclusively in secure device storage (Keychain/Keystore via `react-native-keychain`); **0** occurrences of tokens in AsyncStorage or application logs.
**Rationale:** Directly specified in Spec §9 (Token handling) and §7.2/§8.1 (storage segregation).
**Verification:** Static code analysis confirming no token-related keys are written to AsyncStorage; log-output audit in QA builds confirming no token values appear in console/log output.
**Related FR(s):** FR-024.

## NFR-SEC-004: PII Exclusion from Logs
**Category:** Security / Privacy
**Target:** **0** occurrences of `email` or `displayName` values in plaintext in application logs or telemetry payloads.
**Rationale:** Directly specified in Spec §7.2 (PII Classification) and §9 (Audit logging — "without embedding PII fields").
**Verification:** Automated log-scrubbing test asserting audit event payloads (FR-023) never contain `email`/`displayName` fields; manual log review during QA sign-off.
**Related FR(s):** FR-023, FR-024.

## NFR-SEC-005: Client-Side Input Validation
**Category:** Security
**Target:** **100%** of client-originated requests with constrained value sets (e.g., API-003 `language` field) are validated against the allowed value set (`en`, `ar`) client-side before transmission; server responses are schema-validated before being applied to app state.
**Rationale:** Directly specified in Spec §9 (Input validation).
**Verification:** Unit tests asserting invalid locale values are rejected before an API-003 call is made; unit tests asserting malformed API responses are rejected before state mutation.
**Related FR(s):** FR-011, FR-012.

## NFR-SEC-006: Error Message Information Hygiene
**Category:** Security
**Target:** **0** occurrences of raw stack traces, internal error codes, or backend implementation details in any user-facing error message; only configured, localized, generic messages are shown.
**Rationale:** Directly specified in Spec §9 (Error message hygiene).
**Verification:** Automated test asserting the error UI component only ever renders from a predefined localized message map keyed by a generic error category, never from raw exception/error objects.
**Related FR(s):** FR-006.

## NFR-SEC-007: Session Reset on Authentication Failure
**Category:** Security
**Target:** On any 401 response, navigation and locale state reset to safe defaults (`Explore` tab, device-detected locale) within **1 request-response cycle** (i.e., immediately upon receiving the 401, no additional user action required).
**Rationale:** Directly specified in Spec §9 (Session integrity).
**Verification:** Integration test simulating a 401 response from any authenticated endpoint (API-003, API-004); assert active tab resets to Explore and locale resets to device-detected value.
**Related FR(s):** FR-008, FR-017.

## NFR-SEC-008: Dependency Version Pinning
**Category:** Security / Supply Chain
**Target:** **100%** of third-party React Native packages are pinned to exact versions (no caret/tilde ranges) in `package.json` and committed lockfile.
**Rationale:** Directly specified in Spec §9 (Dependency hygiene).
**Verification:** CI lint step scanning `package.json` for non-exact version specifiers; build fails if any dependency uses a range specifier.
**Related FR(s):** FR-020.

---

## 5. Scalability & Maintainability

## NFR-MAINT-001: API Contract Abstraction (Swap-Without-Refactor)
**Category:** Maintainability / Architecture
**Target:** Swapping any placeholder API contract (Section 5 of spec) for a real backend contract requires **0 structural refactors** to screen/component code — only configuration or schema-mapping changes within the `apiClient` module.
**Rationale:** Directly specified success criterion in Spec §10 and Goal 3 (Spec §4).
**Verification:** Architecture review checklist confirming all screen components consume data via typed interfaces/hooks that abstract the underlying API call; contract-change simulation test (swap mock schema) confirming no component-level code changes are needed.
**Related FR(s):** FR-020.

## NFR-MAINT-002: Code Coverage Minimum
**Category:** Maintainability / Compliance
**Target:** **≥80%** automated test code coverage across the navigation and localization modules, per organizational policy.
**Rationale:** Organizational policy "Minimum Code Coverage 80%" (COMPLIANCE, HIGH) referenced in Spec Compliance & Governance section.
**Verification:** CI coverage report (e.g., Jest coverage) gating PR merge at ≥80% for changed/new navigation and localization module files.
**Related FR(s):** All FRs in 01-functional-requirements.md (cross-cutting).

## NFR-MAINT-003: Single Codebase Cross-Platform Parity
**Category:** Maintainability
**Target:** **100%** of navigation and localization feature code is shared between iOS and Android via the single React Native codebase, with platform-specific code limited to native module bridges only (no duplicated business logic per platform).
**Rationale:** Directly specified in Spec §1.1 ("single codebase") and §2.
**Verification:** Code review checklist/static analysis confirming no duplicated navigation/localization logic exists in platform-specific (`ios/`, `android/`) directories outside native bridge glue code.
**Related FR(s):** FR-001.

---

## 6. Security Controls Matrix

| Control ID | Control | Enforced By | Verification Method | Related NFR |
|---|---|---|---|---|
| SC-001 | TLS 1.2+ for all API traffic | Network security config (iOS ATS / Android NSC) | Static config audit + CI test | NFR-SEC-001 |
| SC-002 | No committed secrets | `.gitignore` + CI secret scan | Automated secret-scan tool in CI | NFR-SEC-002 |
| SC-003 | Tokens in Keychain/Keystore only | `react-native-keychain` storage layer | Static analysis + log audit | NFR-SEC-003 |
| SC-004 | PII excluded from logs/telemetry | Audit event schema (FR-023) excludes PII fields | Automated log-scrubbing test | NFR-SEC-004 |
| SC-005 | Client + server payload validation | `apiClient` interceptors + form validation | Unit tests | NFR-SEC-005 |
| SC-006 | Generic error messages only | Centralized error-message map | Automated UI test | NFR-SEC-006 |
| SC-007 | Session reset on 401 | Redux Toolkit auth middleware | Integration test | NFR-SEC-007 |
| SC-008 | Exact dependency version pinning | `package.json` + lockfile | CI lint step | NFR-SEC-008 |
| SC-009 | Mandatory security scan before deployment | CI/CD pipeline gate (org policy) | Pipeline gate failure on scan findings | NFR-SEC-001–008 (aggregate) |
| SC-010 | Code review required (≥1 approval) | GitHub branch protection (org policy) | PR merge gate | NFR-MAINT-002 |

> **Note:** Organizational policies "Mandatory Security Scan" (SECURITY, CRITICAL) and "Code Review Required" (APPROVAL, HIGH) from `Policies/project-policy-document.md` are incorporated as pipeline-level gates (SC-009, SC-010) rather than duplicated as raw policy text. See `06-dependencies.md` for the full compliance reference.

---

## 7. Open Items Carried Forward (Not Blocking)

The following items affect NFR precision but do not block this requirements set; they are inherited from Spec §12 Open Questions and tracked for reconciliation:

1. Exact backend auth token issuance/refresh flow (affects NFR-SEC-003, NFR-SEC-007 implementation detail, not the stated targets).
2. Telemetry/crash vendor selection (affects where audit events in NFR-SEC-004/FR-023 are ultimately forwarded; targets remain vendor-agnostic).
3. Regional data-protection regime confirmation (may add targets to NFR-SEC-004 beyond current defaults; current targets represent reasonable general-practice defaults per Spec §8.3).

<!-- Generated by ATOS AI-DLC | Execution: f095c16e-e50d-4877-8d3f-4c6f9b456d64 | 2026-10-21T06:51:57.690Z -->