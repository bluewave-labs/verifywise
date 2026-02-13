/**
 * Shadow AI Syslog Parsers
 *
 * Parses syslog messages from SIEM/proxy systems (Zscaler, Netskope,
 * Squid, generic key=value) into a normalized event format that can
 * be fed into the shared ingestion pipeline.
 */

export interface ParsedSyslogEvent {
  user_email: string;
  destination: string;
  uri_path?: string;
  http_method?: string;
  action?: "allowed" | "blocked";
  timestamp: string;
  department?: string;
}

type ParserFn = (message: string) => ParsedSyslogEvent | null;

// ─── Common helpers ────────────────────────────────────────────────────

/**
 * Strip RFC3164/5424 PRI + timestamp + hostname prefix from a syslog message.
 * Examples:
 *   "<134>Feb  9 14:32:00 proxy ..." → "..."
 *   "<134>1 2026-02-09T14:32:00Z proxy ..." → "..."
 */
export function stripSyslogHeader(message: string): string {
  // Strip PRI: <nnn>
  let msg = message.replace(/^<\d{1,3}>/, "");

  // RFC5424: version SP timestamp SP hostname SP
  const rfc5424 = /^1\s+\S+\s+\S+\s+/;
  if (rfc5424.test(msg)) {
    return msg.replace(rfc5424, "").trim();
  }

  // RFC3164: "Mon DD HH:MM:SS hostname " or "YYYY-MM-DDTHH:MM:SSZ hostname "
  const rfc3164Date = /^[A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\s+\S+\s+/;
  const isoDate = /^\d{4}-\d{2}-\d{2}T\S+\s+\S+\s+/;

  if (rfc3164Date.test(msg)) {
    return msg.replace(rfc3164Date, "").trim();
  }
  if (isoDate.test(msg)) {
    return msg.replace(isoDate, "").trim();
  }

  return msg.trim();
}

/**
 * Extract a timestamp from the syslog header.
 * Returns ISO string or null if not found.
 */
export function extractTimestampFromHeader(message: string): string | null {
  // Strip PRI
  const msg = message.replace(/^<\d{1,3}>/, "");

  // RFC5424: "1 2026-02-09T14:32:00Z ..."
  const rfc5424Match = msg.match(/^1\s+(\d{4}-\d{2}-\d{2}T\S+)\s/);
  if (rfc5424Match) return rfc5424Match[1];

  // ISO timestamp after PRI: "2026-02-09T14:32:00Z ..."
  const isoMatch = msg.match(/^(\d{4}-\d{2}-\d{2}T\S+)\s/);
  if (isoMatch) return isoMatch[1];

  // RFC3164: "Feb  9 14:32:00 ..."
  const rfc3164Match = msg.match(/^([A-Z][a-z]{2}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s/);
  if (rfc3164Match) {
    const year = new Date().getFullYear();
    const parsed = new Date(`${rfc3164Match[1]} ${year}`);
    if (!isNaN(parsed.getTime())) return parsed.toISOString();
  }

  return null;
}

/**
 * Extract hostname from a full URL.
 * "https://chat.openai.com/v1/chat" → "chat.openai.com"
 */
export function extractHostnameFromUrl(url: string): string {
  try {
    // If it looks like a URL with protocol, parse it
    if (url.includes("://")) {
      return new URL(url).hostname;
    }
    // If it has a path, take the part before the first /
    const slashIdx = url.indexOf("/");
    if (slashIdx > 0) {
      return url.substring(0, slashIdx);
    }
    // Already a plain hostname
    return url;
  } catch {
    // Fallback: strip any path
    const slashIdx = url.indexOf("/");
    return slashIdx > 0 ? url.substring(0, slashIdx) : url;
  }
}

/**
 * Extract URI path from a full URL.
 * "https://chat.openai.com/v1/chat" → "/v1/chat"
 */
function extractPathFromUrl(url: string): string | undefined {
  try {
    if (url.includes("://")) {
      const path = new URL(url).pathname;
      return path && path !== "/" ? path : undefined;
    }
    const slashIdx = url.indexOf("/");
    if (slashIdx > 0) {
      return url.substring(slashIdx);
    }
    return undefined;
  } catch {
    const slashIdx = url.indexOf("/");
    return slashIdx > 0 ? url.substring(slashIdx) : undefined;
  }
}

/**
 * Parse a key=value string into a record.
 * Handles quoted values: key="value with spaces"
 * Handles escaped quotes inside quoted values: key="said \"hello\""
 */
function parseKeyValuePairs(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  // Match key=value or key="quoted value" (with escaped quote support)
  const regex = /(\w+)=(?:"((?:[^"\\]|\\.)*)"|(\S+))/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const raw = match[2] !== undefined ? match[2] : match[3];
    // Unescape backslash sequences in quoted values
    result[match[1]] = match[2] !== undefined
      ? raw.replace(/\\"/g, '"').replace(/\\\\/g, '\\')
      : raw;
  }
  return result;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Valid timestamp range: 2000-01-01 to 2099-12-31
const MIN_EPOCH_MS = 946684800000;
const MAX_EPOCH_MS = 4102444800000;

/** Clamp epoch milliseconds to a valid range, returning null if out of bounds. */
function validEpochMs(ms: number): number | null {
  return ms >= MIN_EPOCH_MS && ms <= MAX_EPOCH_MS ? ms : null;
}

/** Convert an epoch value to ISO string, auto-detecting ns/ms/s. Returns null if invalid. */
function epochToIso(epoch: number): string | null {
  let ms: number;
  if (epoch > 1e15) ms = epoch / 1e6;       // nanoseconds
  else if (epoch > 1e12) ms = epoch;          // milliseconds
  else ms = epoch * 1000;                     // seconds
  const valid = validEpochMs(ms);
  return valid !== null ? new Date(valid).toISOString() : null;
}

// ─── Zscaler parser ───────────────────────────────────────────────────

/**
 * Parse Zscaler NSS syslog format (key=value pairs).
 * Key fields: user, dst, method, uri, action
 */
function parseZscaler(message: string): ParsedSyslogEvent | null {
  const body = stripSyslogHeader(message);
  const kv = parseKeyValuePairs(body);

  const email = kv.user || kv.login;
  const dst = kv.dst || kv.hostname;
  if (!email || !dst) return null;
  if (!EMAIL_REGEX.test(email)) return null;

  const fullUrl = kv.uri || kv.url || dst;
  const destination = extractHostnameFromUrl(fullUrl);
  const uriPath = extractPathFromUrl(fullUrl) || (kv.uri ? extractPathFromUrl(kv.uri) : undefined);

  const timestamp = extractTimestampFromHeader(message) || new Date().toISOString();

  const actionRaw = (kv.action || "").toLowerCase();
  const action: "allowed" | "blocked" =
    actionRaw === "blocked" || actionRaw === "block" || actionRaw === "denied"
      ? "blocked"
      : "allowed";

  return {
    user_email: email,
    destination,
    uri_path: uriPath,
    http_method: kv.method?.toUpperCase(),
    action,
    timestamp,
    department: kv.department,
  };
}

// ─── Netskope parser ──────────────────────────────────────────────────

/**
 * Parse Netskope JSON-in-syslog format.
 * The syslog body contains a JSON object after the header.
 */
function parseNetskope(message: string): ParsedSyslogEvent | null {
  const body = stripSyslogHeader(message);

  // Find JSON object in the message
  const jsonStart = body.indexOf("{");
  if (jsonStart < 0) return null;

  let parsed: Record<string, any>;
  try {
    parsed = JSON.parse(body.substring(jsonStart));
  } catch {
    return null;
  }

  const email = parsed.user || parsed.user_email || parsed.srcuser;
  const url = parsed.url || parsed.dst_url || parsed.hostname;
  if (!email || !url) return null;
  if (!EMAIL_REGEX.test(email)) return null;

  const destination = extractHostnameFromUrl(url);
  const uriPath = extractPathFromUrl(url);

  const timestamp =
    parsed.timestamp
      ? new Date(
          typeof parsed.timestamp === "number"
            ? parsed.timestamp * 1000
            : parsed.timestamp
        ).toISOString()
      : extractTimestampFromHeader(message) || new Date().toISOString();

  const activityRaw = (parsed.activity || parsed.action || "").toLowerCase();
  const action: "allowed" | "blocked" =
    activityRaw === "blocked" || activityRaw === "block" || activityRaw === "denied"
      ? "blocked"
      : "allowed";

  return {
    user_email: email,
    destination,
    uri_path: uriPath,
    http_method: parsed.method?.toUpperCase() || parsed.http_method?.toUpperCase(),
    action,
    timestamp,
    department: parsed.department || parsed.ou,
  };
}

// ─── Squid parser ─────────────────────────────────────────────────────

/**
 * Parse Squid access log format (space-delimited).
 * Format: timestamp elapsed client action/code size method URL user hierarchy content_type
 * Positions:  0        1       2      3         4    5      6    7     8         9
 */
function parseSquid(message: string): ParsedSyslogEvent | null {
  const body = stripSyslogHeader(message);
  const parts = body.split(/\s+/);

  // Need at least 8 fields (email is at index 7)
  if (parts.length < 8) return null;

  const method = parts[5];
  const url = parts[6];
  // Email can be at position 7 or later (might include domain\user format)
  let email = parts[7] || "";

  // Handle DOMAIN\user format — skip non-email idents
  if (email === "-" || !email) return null;
  // If it's not an email, skip
  if (!EMAIL_REGEX.test(email)) return null;

  const destination = extractHostnameFromUrl(url);
  const uriPath = extractPathFromUrl(url);

  // Squid timestamps are unix epoch (seconds.milliseconds)
  let timestamp: string;
  const squidTs = parseFloat(parts[0]);
  if (!isNaN(squidTs) && squidTs > 1000000000) {
    timestamp = new Date(squidTs * 1000).toISOString();
  } else {
    timestamp = extractTimestampFromHeader(message) || new Date().toISOString();
  }

  // Squid action: TCP_DENIED means blocked
  const squidAction = (parts[3] || "").toUpperCase();
  const action: "allowed" | "blocked" =
    squidAction.includes("DENIED") || squidAction.includes("MISS_DENIED")
      ? "blocked"
      : "allowed";

  return {
    user_email: email,
    destination,
    uri_path: uriPath,
    http_method: method?.toUpperCase(),
    action,
    timestamp,
  };
}

// ─── Generic key=value parser ─────────────────────────────────────────

/**
 * Parse generic CEF-like key=value syslog format.
 * Key fields: suser, dhost, requestMethod, request, act
 */
function parseGenericKv(message: string): ParsedSyslogEvent | null {
  const body = stripSyslogHeader(message);
  const kv = parseKeyValuePairs(body);

  const email = kv.suser || kv.user || kv.src_user;
  const host = kv.dhost || kv.dst || kv.destinationHostName;
  if (!email || !host) return null;
  if (!EMAIL_REGEX.test(email)) return null;

  const destination = extractHostnameFromUrl(host);
  const requestUrl = kv.request || kv.requestUrl || kv.url;
  const uriPath = requestUrl ? extractPathFromUrl(requestUrl) : undefined;

  const timestamp = extractTimestampFromHeader(message) || new Date().toISOString();

  const actRaw = (kv.act || kv.action || "").toLowerCase();
  const action: "allowed" | "blocked" =
    actRaw === "blocked" || actRaw === "block" || actRaw === "denied"
      ? "blocked"
      : "allowed";

  return {
    user_email: email,
    destination,
    uri_path: uriPath,
    http_method: (kv.requestMethod || kv.method)?.toUpperCase(),
    action,
    timestamp,
    department: kv.department,
  };
}

// ─── CEF parser ──────────────────────────────────────────────────────

/**
 * Parse Common Event Format (CEF) syslog messages.
 * Header: CEF:Version|Device Vendor|Device Product|Device Version|Signature ID|Name|Severity|Extension
 * Extension: key=value pairs separated by spaces. Values with spaces are unquoted
 * but keys are always single tokens.
 *
 * Covers: Palo Alto PAN-OS, Check Point, Forcepoint, Trend Micro,
 *         Microsoft Defender for Cloud Apps, Sophos (CEF mode), SonicWall (ArcSight mode)
 */
function parseCef(message: string): ParsedSyslogEvent | null {
  const body = stripSyslogHeader(message);

  // Find the CEF header — format: CEF:0|Vendor|Product|Version|SigID|Name|Severity|
  const cefHeaderRegex = /^CEF:\d\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|/;
  const headerMatch = body.match(cefHeaderRegex);

  let extension: string;
  if (headerMatch) {
    // Strip the header to get the extension key=value pairs
    extension = body.substring(headerMatch[0].length).trim();
  } else {
    // Not a valid CEF message
    return null;
  }

  // Parse CEF extension key=value pairs.
  // CEF values can contain spaces — a value ends when we hit whitespace
  // followed by a recognized key= token. We split on key boundaries instead
  // of using a lazy regex to avoid backtracking on malformed input.
  const kv: Record<string, string> = {};
  const keyBoundary = /\s+(?=[a-zA-Z0-9_]+=)/g;
  const pairs = extension.split(keyBoundary);
  for (const pair of pairs) {
    const eqIdx = pair.indexOf("=");
    if (eqIdx <= 0) continue;
    const key = pair.substring(0, eqIdx);
    if (!/^[a-zA-Z0-9_]+$/.test(key)) continue;
    kv[key] = pair.substring(eqIdx + 1).trim();
  }

  // Extract user email from standard CEF fields + vendor-specific fallbacks
  // CEF standard: suser (source user)
  // Palo Alto: srcuser, usrName
  // Check Point: src_user_name
  // Forcepoint: loginID
  const email =
    kv.suser || kv.duser || kv.srcuser || kv.usrName ||
    kv.src_user_name || kv.loginID || kv.user || kv.cs3;
  if (!email || !EMAIL_REGEX.test(email)) return null;

  // Extract destination host
  // CEF standard: dhost (destination hostname), dst (destination IP)
  // Palo Alto: misc (contains URL in URL Filtering logs)
  // Check Point: resource
  const requestUrl = kv.request || kv.requestUrl || kv.misc || kv.resource || kv.url;
  const host = kv.dhost || kv.destinationHostName || kv.dst;

  let destination: string;
  let uriPath: string | undefined;

  if (requestUrl) {
    destination = extractHostnameFromUrl(requestUrl);
    uriPath = extractPathFromUrl(requestUrl);
  } else if (host) {
    destination = extractHostnameFromUrl(host);
  } else {
    return null;
  }

  // Extract timestamp
  // CEF standard: rt (receipt time) — can be epoch ms or formatted string
  let timestamp: string;
  const rtField = kv.rt || kv.start;
  if (rtField) {
    const rtNum = Number(rtField);
    if (!isNaN(rtNum) && rtNum > 0) {
      timestamp = epochToIso(rtNum)
        ?? extractTimestampFromHeader(message)
        ?? new Date().toISOString();
    } else {
      // Try parsing as date string (e.g. "Feb 09 2026 14:32:00")
      const parsed = new Date(rtField);
      timestamp = isNaN(parsed.getTime())
        ? (extractTimestampFromHeader(message) || new Date().toISOString())
        : parsed.toISOString();
    }
  } else {
    timestamp = extractTimestampFromHeader(message) || new Date().toISOString();
  }

  // Extract action
  // CEF standard: act
  // Check Point: act can be "Accept", "Drop", "Block"
  // Palo Alto: act can be "allow", "deny", "drop", "block-url"
  const actRaw = (kv.act || kv.action || kv.fw_action || "").toLowerCase();
  const action: "allowed" | "blocked" =
    actRaw.includes("block") || actRaw.includes("deny") ||
    actRaw.includes("drop") || actRaw.includes("denied") ||
    actRaw === "rejected"
      ? "blocked"
      : "allowed";

  // Extract HTTP method
  const httpMethod = (kv.requestMethod || kv.method || kv.cs5)?.toUpperCase();

  // Extract department from custom string fields
  // cs1 through cs6 are CEF custom strings — vendors use them differently
  let department: string | undefined;
  for (let i = 1; i <= 6; i++) {
    const label = kv[`cs${i}Label`];
    if (label && label.toLowerCase().includes("department")) {
      department = kv[`cs${i}`];
      break;
    }
  }

  return {
    user_email: email,
    destination,
    uri_path: uriPath,
    http_method: httpMethod,
    action,
    timestamp,
    department,
  };
}

// ─── W3C ELFF parser ─────────────────────────────────────────────────

/**
 * Parse W3C Extended Log File Format (ELFF) messages.
 * The format uses a #Fields directive to define column positions,
 * then space-delimited data rows.
 *
 * Since syslog messages arrive one line at a time (not as full files with
 * headers), this parser assumes a common default field order used by
 * Cisco WSA and Broadcom ProxySG.
 *
 * Covers: Cisco Secure Web Appliance (IronPort WSA), Broadcom Symantec
 *         ProxySG/Edge SWG, Barracuda Web Security Gateway
 */

// Default ELFF field order — covers the most common subset across WSA and ProxySG
const DEFAULT_ELFF_FIELDS = [
  "date", "time", "time-taken", "c-ip", "sc-status", "s-action",
  "sc-bytes", "cs-method", "cs-uri-scheme", "cs-host", "cs-uri-path",
  "cs-uri-query", "cs-username", "s-hierarchy", "s-supplier-name",
  "rs(Content-Type)", "cs(User-Agent)", "cs(Referer)", "sc-filter-result",
  "cs-categories",
];

function parseElff(message: string): ParsedSyslogEvent | null {
  const body = stripSyslogHeader(message);

  // Skip directive lines
  if (body.startsWith("#")) return null;

  // Split on whitespace — ELFF uses space-delimited fields
  const parts = body.split(/\s+/);
  if (parts.length < 8) return null;

  // Build a field map from the default field order
  const fieldMap: Record<string, string> = {};
  for (let i = 0; i < parts.length && i < DEFAULT_ELFF_FIELDS.length; i++) {
    const val = parts[i];
    if (val !== "-" && val !== "") {
      fieldMap[DEFAULT_ELFF_FIELDS[i]] = val;
    }
  }

  // Extract user email — ELFF field: cs-username
  const username = fieldMap["cs-username"];
  if (!username || !EMAIL_REGEX.test(username)) return null;

  // Extract destination — cs-host or s-supplier-name
  const host = fieldMap["cs-host"] || fieldMap["s-supplier-name"];
  if (!host) return null;

  const destination = extractHostnameFromUrl(host);

  // Build URI path from cs-uri-path + cs-uri-query
  let uriPath = fieldMap["cs-uri-path"];
  if (uriPath && fieldMap["cs-uri-query"]) {
    uriPath = `${uriPath}?${fieldMap["cs-uri-query"]}`;
  }

  // Build timestamp from date + time fields
  let timestamp: string;
  if (fieldMap["date"] && fieldMap["time"]) {
    const parsed = new Date(`${fieldMap["date"]}T${fieldMap["time"]}Z`);
    timestamp = isNaN(parsed.getTime())
      ? (extractTimestampFromHeader(message) || new Date().toISOString())
      : parsed.toISOString();
  } else {
    timestamp = extractTimestampFromHeader(message) || new Date().toISOString();
  }

  // Extract action from s-action or sc-filter-result
  const actionRaw = (fieldMap["s-action"] || fieldMap["sc-filter-result"] || "").toUpperCase();
  const action: "allowed" | "blocked" =
    actionRaw.includes("DENIED") || actionRaw.includes("BLOCKED") ||
    actionRaw.includes("DROP") || actionRaw.includes("BLOCK")
      ? "blocked"
      : "allowed";

  return {
    user_email: username,
    destination,
    uri_path: uriPath,
    http_method: fieldMap["cs-method"]?.toUpperCase(),
    action,
    timestamp,
  };
}

// ─── Cloudflare JSON parser ──────────────────────────────────────────

/**
 * Parse Cloudflare Gateway and other cloud SWG JSON-in-syslog formats.
 * Handles JSON objects embedded in syslog frames. Field names use
 * PascalCase (Cloudflare), camelCase, or snake_case depending on vendor.
 *
 * Covers: Cloudflare Gateway (HTTP + DNS), iboss, Cato Networks,
 *         Menlo Security, Akamai SIA
 */
function parseCloudflareJson(message: string): ParsedSyslogEvent | null {
  const body = stripSyslogHeader(message);

  // Find JSON object in the message
  const jsonStart = body.indexOf("{");
  if (jsonStart < 0) return null;

  let parsed: Record<string, any>;
  try {
    parsed = JSON.parse(body.substring(jsonStart));
  } catch {
    return null;
  }

  // Extract user email — try multiple field naming conventions
  // Cloudflare: Email
  // iboss: userName, userEmail
  // Cato: user, userName
  // Menlo: email, user_email
  const email =
    parsed.Email || parsed.email || parsed.user_email ||
    parsed.userEmail || parsed.userName || parsed.user ||
    parsed.srcuser || parsed.suser;
  if (!email || !EMAIL_REGEX.test(email)) return null;

  // Extract destination — try multiple conventions
  // Cloudflare HTTP: Host, URL
  // Cloudflare DNS: QueryName
  // iboss: domain, url
  // Cato: destinationName, serverName
  const url = parsed.URL || parsed.url || parsed.dst_url;
  const host =
    parsed.Host || parsed.host || parsed.domain ||
    parsed.QueryName || parsed.queryName || parsed.query_name ||
    parsed.destinationName || parsed.serverName || parsed.hostname;

  let destination: string;
  let uriPath: string | undefined;

  if (url) {
    destination = extractHostnameFromUrl(url);
    uriPath = extractPathFromUrl(url);
  } else if (host) {
    destination = extractHostnameFromUrl(host);
  } else {
    return null;
  }

  // Extract timestamp
  // Cloudflare: Datetime (RFC3339), DateTime
  // iboss: timestamp, eventTime
  // Cato: time, timestamp
  let timestamp: string;
  const tsRaw =
    parsed.Datetime || parsed.DateTime || parsed.datetime ||
    parsed.timestamp || parsed.eventTime || parsed.time ||
    parsed.event_time;

  if (tsRaw) {
    if (typeof tsRaw === "number") {
      timestamp = tsRaw > 1e12
        ? new Date(tsRaw).toISOString()
        : new Date(tsRaw * 1000).toISOString();
    } else {
      const parsedDate = new Date(tsRaw);
      timestamp = isNaN(parsedDate.getTime())
        ? (extractTimestampFromHeader(message) || new Date().toISOString())
        : parsedDate.toISOString();
    }
  } else {
    timestamp = extractTimestampFromHeader(message) || new Date().toISOString();
  }

  // Extract action
  // Cloudflare: Action (allow, block, isolate, bypass, safesearch)
  // iboss: action, decision
  const actionRaw = (
    parsed.Action || parsed.action || parsed.decision ||
    parsed.activity || ""
  ).toString().toLowerCase();
  const action: "allowed" | "blocked" =
    actionRaw.includes("block") || actionRaw.includes("deny") ||
    actionRaw.includes("denied") || actionRaw === "drop"
      ? "blocked"
      : "allowed";

  // Extract HTTP method
  // Cloudflare: HTTPMethod
  // iboss: method, httpMethod
  const httpMethod = (
    parsed.HTTPMethod || parsed.httpMethod || parsed.Method ||
    parsed.method || parsed.http_method
  )?.toUpperCase();

  // Extract department
  const department =
    parsed.department || parsed.Department || parsed.ou ||
    parsed.userGroup || parsed.UserGroup || parsed.group;

  return {
    user_email: email,
    destination,
    uri_path: uriPath,
    http_method: httpMethod,
    action,
    timestamp,
    department,
  };
}

// ─── FortiGate parser ────────────────────────────────────────────────

/**
 * Parse Fortinet FortiGate syslog format (key=value pairs with
 * Fortinet-specific field names).
 *
 * FortiGate web filter logs use: type=utm subtype=webfilter
 * Field names: user, srcip, dstip, hostname, url, sentbyte, rcvdbyte, action
 *
 * Also handles Sophos Firewall (key=value with underscore field names)
 * and SonicWall (key=value with short abbreviation field names).
 */
function parseFortigate(message: string): ParsedSyslogEvent | null {
  const body = stripSyslogHeader(message);
  const kv = parseKeyValuePairs(body);

  // FortiGate uses "user" for the username
  // Sophos uses "user_name"
  // SonicWall uses "usr" or "user"
  const email = kv.user || kv.user_name || kv.usr || kv.srcname;
  if (!email || !EMAIL_REGEX.test(email)) return null;

  // FortiGate: hostname (domain), url (full URL)
  // Sophos: url, domain
  // SonicWall: dstname, dst
  const fullUrl = kv.url;
  const host = kv.hostname || kv.domain || kv.dstname || kv.dstip || kv.dst;

  let destination: string;
  let uriPath: string | undefined;

  if (fullUrl) {
    destination = extractHostnameFromUrl(fullUrl);
    uriPath = extractPathFromUrl(fullUrl);
  } else if (host) {
    destination = extractHostnameFromUrl(host);
  } else {
    return null;
  }

  // Extract timestamp from log fields
  // FortiGate: date + time (e.g., date=2026-02-09 time=14:32:00)
  // Sophos: date, time
  let timestamp: string;
  if (kv.date && kv.time) {
    const parsed = new Date(`${kv.date}T${kv.time}`);
    timestamp = isNaN(parsed.getTime())
      ? (extractTimestampFromHeader(message) || new Date().toISOString())
      : parsed.toISOString();
  } else if (kv.eventtime) {
    // FortiOS 6.x+: eventtime is epoch in nanoseconds, milliseconds, or seconds
    const et = Number(kv.eventtime);
    if (!isNaN(et) && et > 0) {
      timestamp = epochToIso(et)
        ?? extractTimestampFromHeader(message)
        ?? new Date().toISOString();
    } else {
      timestamp = extractTimestampFromHeader(message) || new Date().toISOString();
    }
  } else {
    timestamp = extractTimestampFromHeader(message) || new Date().toISOString();
  }

  // FortiGate: action can be "passthrough", "blocked", "redirect"
  // Sophos: action = "allowed", "denied"
  const actionRaw = (kv.action || kv.fw_action || "").toLowerCase();
  const action: "allowed" | "blocked" =
    actionRaw.includes("block") || actionRaw.includes("denied") ||
    actionRaw.includes("deny") || actionRaw.includes("drop")
      ? "blocked"
      : "allowed";

  const httpMethod = kv.method?.toUpperCase();

  const department = kv.group || kv.user_group || kv.user_gp;

  return {
    user_email: email,
    destination,
    uri_path: uriPath,
    http_method: httpMethod,
    action,
    timestamp,
    department,
  };
}

// ─── Parser registry ──────────────────────────────────────────────────

const PARSERS: Record<string, ParserFn> = {
  zscaler: parseZscaler,
  netskope: parseNetskope,
  squid: parseSquid,
  generic_kv: parseGenericKv,
  cef: parseCef,
  elff: parseElff,
  cloudflare_json: parseCloudflareJson,
  fortigate: parseFortigate,
};

/**
 * Get the parser function for a given parser type.
 * Returns null for unknown types.
 */
export function getParser(parserType: string): ParserFn | null {
  return PARSERS[parserType] || null;
}

/**
 * Parse a syslog message using the specified parser type.
 * Returns null if parsing fails or the parser type is unknown.
 */
export function parseSyslogMessage(
  parserType: string,
  message: string
): ParsedSyslogEvent | null {
  const parser = getParser(parserType);
  if (!parser) return null;

  try {
    return parser(message);
  } catch {
    return null;
  }
}
