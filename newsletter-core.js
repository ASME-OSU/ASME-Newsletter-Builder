(function (global) {
  "use strict";

  var SCHEMA_VERSION = 2;
  var DRAFT_KIND = "asme-newsletter-draft";
  var ALLOWED_THEMES = ["navy", "light", "slate", "dark", "osu"];
  var ALLOWED_ACCENTS = ["blue", "red", "green", "gold"];
  var FIELD_IDS = [
    "feat-title", "feat-date", "feat-location", "feat-desc", "feat-btn-text", "feat-btn-url",
    "feat-img-url", "feat-img-alt", "ann-title", "ann-quote", "ann-author",
    "ql1-title", "ql1-sub", "ql1-btn", "ql1-url", "ql2-title", "ql2-sub", "ql2-btn", "ql2-url",
    "ql3-title", "ql3-sub", "ql3-btn", "ql3-url", "issue-bar-text", "footer-name", "footer-addr",
    "s-logo", "s-logo-light", "s-website", "s-ig-url", "s-ig-handle", "s-li-url", "s-gm-url", "s-unsub",
    "s-subject", "s-preheader"
  ];

  function asString(value, fallback) {
    if (value === undefined || value === null) return fallback || "";
    return String(value).slice(0, 20000);
  }

  function escapeHtml(value) {
    return asString(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeMultiline(value) {
    return escapeHtml(value).replace(/\r?\n/g, "<br>");
  }

  function safeUrl(value, options) {
    var opts = options || {};
    var raw = asString(value).trim();
    if (!raw) return "";
    if (opts.allowBrevo && raw === "{{ unsubscribe }}") return raw;
    try {
      var parsed = new URL(raw);
      var allowed = opts.allowMailto ? ["http:", "https:", "mailto:"] : ["http:", "https:"];
      return allowed.indexOf(parsed.protocol) >= 0 ? parsed.href : "";
    } catch (error) {
      return "";
    }
  }

  function normalizeEvent(raw, fallbackId) {
    var source = raw && typeof raw === "object" ? raw : {};
    var numericId = Number(source.id);
    var id = Number.isFinite(numericId) && numericId >= 0 ? Math.floor(numericId) : fallbackId;
    return {
      id: id,
      date: asString(source.date),
      title: asString(source.title, "Untitled Event"),
      time: asString(source.time),
      location: asString(source.location),
      description: asString(source.description),
      accent: ALLOWED_ACCENTS.indexOf(source.accent) >= 0 ? source.accent : "blue",
      showImg: Boolean(source.showImg),
      imgUrl: asString(source.imgUrl),
      imgAlt: asString(source.imgAlt),
      showLink: Boolean(source.showLink),
      linkUrl: asString(source.linkUrl),
      linkText: asString(source.linkText, "Learn More"),
      sourceEventId: asString(source.sourceEventId),
      sourceUpdated: asString(source.sourceUpdated),
      sourceStart: asString(source.sourceStart)
    };
  }

  function nextEventId(events, floor) {
    var minimum = Number.isFinite(Number(floor)) ? Number(floor) : 100;
    return (Array.isArray(events) ? events : []).reduce(function (next, event) {
      var id = Number(event && event.id);
      return Number.isFinite(id) ? Math.max(next, Math.floor(id) + 1) : next;
    }, minimum);
  }

  function sanitizeFields(fields) {
    var input = fields && typeof fields === "object" ? fields : {};
    return FIELD_IDS.reduce(function (output, id) {
      if (Object.prototype.hasOwnProperty.call(input, id)) output[id] = asString(input[id]);
      return output;
    }, {});
  }

  function sanitizeState(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Draft state must be an object.");
    var rawEvents = Array.isArray(raw.events) ? raw.events.slice(0, 100) : [];
    var events = rawEvents.map(function (event, index) { return normalizeEvent(event, 100 + index); });
    return {
      schemaVersion: SCHEMA_VERSION,
      events: events,
      showFeatured: raw.showFeatured !== false,
      showAnnounce: raw.showAnnounce !== false,
      showLinks: raw.showLinks !== false,
      showFeatImg: Boolean(raw.showFeatImg),
      showFeatButton: raw.showFeatButton !== false,
      activeTheme: ALLOWED_THEMES.indexOf(raw.activeTheme) >= 0 ? raw.activeTheme : "navy",
      fields: sanitizeFields(raw.fields)
    };
  }

  function createDraftDocument(state) {
    return {
      kind: DRAFT_KIND,
      version: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      state: sanitizeState(state)
    };
  }

  function readDraftDocument(value) {
    var doc = typeof value === "string" ? JSON.parse(value) : value;
    if (!doc || typeof doc !== "object" || doc.kind !== DRAFT_KIND || !doc.state) {
      throw new Error("This is not an ASME Newsletter Builder draft file.");
    }
    if (Number(doc.version) > SCHEMA_VERSION) {
      throw new Error("This draft was created by a newer version of the builder.");
    }
    return sanitizeState(doc.state);
  }

  function sanitizeCalendarEvent(raw) {
    if (!raw || typeof raw !== "object") return null;
    var start = new Date(raw.start);
    var end = raw.end ? new Date(raw.end) : null;
    if (!asString(raw.id) || Number.isNaN(start.getTime())) return null;
    return {
      id: asString(raw.id),
      title: asString(raw.title, "Untitled Event"),
      start: start.toISOString(),
      end: end && !Number.isNaN(end.getTime()) ? end.toISOString() : "",
      allDay: Boolean(raw.allDay),
      location: asString(raw.location),
      description: asString(raw.description),
      url: safeUrl(raw.url),
      updated: asString(raw.updated)
    };
  }

  function calendarEventToNewsletter(raw, id, timeZone) {
    var event = sanitizeCalendarEvent(raw);
    if (!event) throw new Error("Calendar event is invalid.");
    var zone = timeZone || "America/New_York";
    var start = new Date(event.start);
    var end = event.end ? new Date(event.end) : null;
    var dateZone = event.allDay ? "UTC" : zone;
    var date = new Intl.DateTimeFormat("en-US", {
      month: "short", day: "numeric", timeZone: dateZone
    }).format(start).toUpperCase();
    var time = "All day";
    if (!event.allDay) {
      var timeFormat = new Intl.DateTimeFormat("en-US", {
        hour: "numeric", minute: "2-digit", timeZone: zone
      });
      time = timeFormat.format(start);
      if (end) time += "–" + timeFormat.format(end);
    }
    return normalizeEvent({
      id: id,
      date: date,
      title: event.title,
      time: time,
      location: event.location,
      description: event.description,
      accent: "blue",
      showImg: false,
      imgUrl: "",
      imgAlt: "",
      showLink: Boolean(event.url),
      linkUrl: event.url,
      linkText: "View Event",
      sourceEventId: event.id,
      sourceUpdated: event.updated,
      sourceStart: event.start
    }, id);
  }

  global.NewsletterCore = {
    SCHEMA_VERSION: SCHEMA_VERSION,
    DRAFT_KIND: DRAFT_KIND,
    FIELD_IDS: FIELD_IDS.slice(),
    ALLOWED_THEMES: ALLOWED_THEMES.slice(),
    ALLOWED_ACCENTS: ALLOWED_ACCENTS.slice(),
    escapeHtml: escapeHtml,
    escapeMultiline: escapeMultiline,
    safeUrl: safeUrl,
    normalizeEvent: normalizeEvent,
    nextEventId: nextEventId,
    sanitizeState: sanitizeState,
    createDraftDocument: createDraftDocument,
    readDraftDocument: readDraftDocument,
    sanitizeCalendarEvent: sanitizeCalendarEvent,
    calendarEventToNewsletter: calendarEventToNewsletter
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
