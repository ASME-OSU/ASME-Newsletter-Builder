(function (global) {
  "use strict";

  function text(value) { return value == null ? "" : String(value).trim(); }
  function placeholder(value) {
    var valueText = text(value);
    return /\[(?:topic(?:\/company)?|name|location(?: tbd)?|time tbd|facility(?: name| address)?)\]/i.test(valueText) ||
      /^(?:New Event|Event Name|MON DD|Brief description of the event\.?|Event description goes here\.?)$/i.test(valueText);
  }
  function practice(event) {
    return Boolean(event.practice) || /^fictional-/i.test(text(event.sourceEventId));
  }

  function check(state, context) {
    state = state || {}; context = context || {};
    var fields = state.fields || {}, events = Array.isArray(state.events) ? state.events : [], issues = [];
    var safeUrl = context.safeUrl || global.NewsletterCore.safeUrl;
    function field(id) { return text(fields[id]); }
    function add(ok, label, detail, tab, target, eventId) {
      issues.push({ ok: Boolean(ok), label: label, detail: detail || "", tab: tab || "events", field: target || "", eventId: eventId == null ? null : eventId });
    }
    function eventField(event, key) { return "event-" + event.id + "-" + key; }
    var activeLogo = context.activeLogo;
    add(Boolean(activeLogo), activeLogo ? "Logo URL looks valid" : "Logo URL is missing or invalid", activeLogo ? "" : "Use an https:// image URL in Settings.", "settings", "s-logo");
    var subject = field("s-subject"), preheader = field("s-preheader");
    add(Boolean(subject), subject ? "Subject line: " + subject.substring(0, 50) + (subject.length > 50 ? "…" : "") : "No email subject line", subject ? "" : "Add one in Settings.", "settings", "s-subject");
    if (subject.length > 65) add(false, "Subject line may be too long", "Consider shortening it so inboxes are less likely to truncate it.", "settings", "s-subject");
    add(Boolean(preheader), preheader ? "Preheader text added" : "Preheader text is empty", preheader ? "" : "Add a concise inbox preview line in Settings.", "settings", "s-preheader");
    if (preheader.length > 100) add(false, "Preheader may be too long", "Keep it near 100 characters so more inboxes show the full message.", "settings", "s-preheader");
    add(events.length > 0, events.length ? events.length + " event" + (events.length !== 1 ? "s" : "") + " added" : "No events added", events.length ? "" : "Add at least one event in the Events tab.", "events");
    events.forEach(function (event, index) {
      var missing = ["title", "date"].find(function (key) { return !text(event[key]) || placeholder(event[key]); });
      var unfinished = missing || ["time", "location", "description"].find(function (key) { return placeholder(event[key]); });
      if (unfinished) add(false, "Event " + (index + 1) + " has missing or placeholder content", "Replace the placeholder " + unfinished + " with newsletter copy.", "events", eventField(event, unfinished), event.id);
      if (event.showLink && !safeUrl(event.linkUrl)) add(false, "Event " + (index + 1) + " has an invalid button URL", "Use an http:// or https:// link, or turn the button off.", "events", eventField(event, "linkUrl"), event.id);
      if (event.showImg && (!safeUrl(event.imgUrl) || !text(event.imgAlt))) add(false, "Event " + (index + 1) + " image needs attention", "Use a valid image URL and meaningful alt text.", "events", eventField(event, safeUrl(event.imgUrl) ? "imgAlt" : "imgUrl"), event.id);
      if (practice(event)) add(false, "Event " + (index + 1) + " is a fictional practice event", "Remove practice content before sending this issue.", "events", eventField(event, "title"), event.id);
    });
    var sourceStatus = context.calendarSourceStatus || function () { return "current"; };
    var imports = events.filter(function (event) { return event.sourceEventId; });
    var missingSources = imports.filter(function (event) { return sourceStatus(event) === "missing"; });
    var uncheckedSources = imports.filter(function (event) { return ["unavailable", "outside-coverage"].indexOf(sourceStatus(event)) >= 0; });
    if (missingSources.length) add(false, missingSources.length + " imported event(s) no longer on Calendar", "Review Events, then remove the event or choose Keep newsletter copy to retain it independently.", "events", eventField(missingSources[0], "title"), missingSources[0].id);
    if (uncheckedSources.length) add(false, uncheckedSources.length + " calendar source(s) could not be verified", "Refresh events. For dates outside the available range, confirm on Calendar or keep the newsletter copy independently.", "calendar");
    var eventWarnings = context.eventWarnings || function () { return {}; };
    var duplicates = events.filter(function (event) { return eventWarnings(event).duplicate; });
    var conflicts = events.filter(function (event) { return eventWarnings(event).conflict; });
    if (duplicates.length) add(false, "Possible duplicate events detected", "Review the warning badges in Events before sending.", "events", eventField(duplicates[0], "title"), duplicates[0].id);
    if (conflicts.length) add(false, "Possible schedule conflict detected", "Two or more events share the same date and start time.", "events", eventField(conflicts[0], "time"), conflicts[0].id);
    if (state.showFeatured) {
      var title = field("feat-title");
      add(Boolean(title), "Featured event title " + (title ? "added" : "is missing"), title ? "" : "Complete the Featured tab or turn the section off.", "featured", "feat-title");
      ["feat-title", "feat-date", "feat-location", "feat-desc"].forEach(function (key) {
        if ((!field(key) && key !== "feat-title") || placeholder(field(key))) add(false, "Featured event " + ({"feat-title":"title", "feat-date":"date", "feat-location":"location", "feat-desc":"description"}[key]) + " needs attention", "Complete this field or turn the Featured section off.", "featured", key);
      });
      if (state.featuredPractice) add(false, "Featured event is fictional practice content", "Replace the featured event with a real event before sending.", "featured", "feat-title");
      if (state.showFeatButton) add(Boolean(safeUrl(field("feat-btn-url"))), "Featured button URL " + (safeUrl(field("feat-btn-url")) ? "looks valid" : "is invalid"), safeUrl(field("feat-btn-url")) ? "" : "Use an http:// or https:// link.", "featured", "feat-btn-url");
      if (state.showFeatImg) add(Boolean(safeUrl(field("feat-img-url")) && field("feat-img-alt")), "Featured image " + (safeUrl(field("feat-img-url")) && field("feat-img-alt") ? "looks ready" : "needs a valid URL and alt text"), "", "featured", safeUrl(field("feat-img-url")) ? "feat-img-alt" : "feat-img-url");
    }
    if (state.showAnnounce) {
      ["ann-title", "ann-quote"].forEach(function (key) {
        if (!field(key) || placeholder(field(key))) add(false, key === "ann-title" ? "Announcement title is missing or unfinished" : "Announcement message is missing or unfinished", "Complete the announcement or turn the section off.", "announce", key);
      });
    }
    if (state.showLinks) [1, 2, 3].forEach(function (n) {
      var ready = Boolean(field("ql" + n + "-title") && safeUrl(field("ql" + n + "-url")));
      add(ready, "Quick link " + n + " " + (ready ? "looks ready" : "is incomplete"), ready ? "" : "Add a title and valid URL, or turn Quick Links off.", "links", field("ql" + n + "-title") ? "ql" + n + "-url" : "ql" + n + "-title");
    });
    add(field("s-unsub") === "{{ unsubscribe }}", field("s-unsub") === "{{ unsubscribe }}" ? "Brevo unsubscribe variable is correct" : "Brevo unsubscribe variable is incorrect", "Use exactly {{ unsubscribe }}.", "settings", "s-unsub");
    var addressReady = /\d+\s+.+,\s*.+\b\d{5}(?:-\d{4})?\b/.test(field("footer-addr"));
    add(addressReady, addressReady ? "Footer includes a postal address" : "Footer may be missing a full postal address", addressReady ? "" : "Enter a verified street or mailing address before sending commercial campaigns.", "design", "footer-addr");
    return issues;
  }

  global.NewsletterReadiness = { check: check };
})(typeof window !== "undefined" ? window : globalThis);
