/**
 * Typed, PII-free audit event emission module.
 * Per Specifications/currentspec.md Section 9 ("Audit logging") and Section 6
 * (every state transition emits a corresponding audit event without PII).
 */

export type AuditEventName =
  | 'nav.tab.selected'
  | 'nav.tab.deselected'
  | 'nav.screen.load.start'
  | 'nav.screen.load.success'
  | 'nav.screen.load.failure'
  | 'nav.screen.retry'
  | 'nav.screen.recover'
  | 'profile.language.changed'
  | 'profile.language.persisted'
  | 'profile.language.persist_deferred'
  | 'profile.language.sync_resolved'
  | 'ui.direction.changed'
  | 'nav.transition.rejected'
  | 'locale.transition.rejected';

export interface AuditEventPayload {
  [key: string]: string | number | boolean | null | undefined;
}

export interface AuditEvent {
  name: AuditEventName;
  timestamp: string;
  payload: AuditEventPayload;
}

/**
 * Field names that are never permitted in an audit payload because they are
 * PII per Specifications/currentspec.md Section 7.2 (email, displayName) or
 * are otherwise identifying (raw tokens). Keys are matched case-insensitively
 * and as substrings to catch variants like `userEmail`.
 */
const PII_KEY_PATTERNS = [
  'email',
  'displayname',
  'display_name',
  'token',
  'password',
  'phone',
  'address',
  'firstname',
  'lastname',
];

function isPiiKey(key: string): boolean {
  const lower = key.toLowerCase();
  return PII_KEY_PATTERNS.some(pattern => lower.includes(pattern));
}

/**
 * Strips any PII-shaped keys from the payload before emission. userId is
 * intentionally allowed through as a pseudonymous identifier per Section 7.2,
 * but raw PII fields are always rejected even if accidentally supplied.
 */
function sanitizePayload(payload: AuditEventPayload): AuditEventPayload {
  const safe: AuditEventPayload = {};
  for (const [key, value] of Object.entries(payload)) {
    if (isPiiKey(key)) {
      continue;
    }
    safe[key] = value;
  }
  return safe;
}

type AuditSink = (event: AuditEvent) => void;

// Assumed: no telemetry vendor has been selected yet (see Specifications
// Section 12, Open Question 4). Default sink logs locally; a real sink can be
// registered via `registerAuditSink` once a vendor is chosen, without
// changing any call sites.
let sink: AuditSink = event => {
  // eslint-disable-next-line no-console
  console.log('[audit]', event.name, event.timestamp, event.payload);
};

export function registerAuditSink(customSink: AuditSink): void {
  sink = customSink;
}

/**
 * Emits a structured, PII-free audit event. All state-transition call sites
 * (tab switches, invalid-transition rejections, language changes) use this
 * single function (US-023).
 */
export function emitAuditEvent(name: AuditEventName, payload: AuditEventPayload = {}): void {
  const event: AuditEvent = {
    name,
    timestamp: new Date().toISOString(),
    payload: sanitizePayload(payload),
  };
  sink(event);
}

export default emitAuditEvent;
