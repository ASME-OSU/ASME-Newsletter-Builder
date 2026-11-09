(function (global) {
  "use strict";
  var STORAGE_KEY = "asme_nl_issue_library", LIMIT = 30, VERSION = 1;

  function create(storage) {
    if (!storage || typeof storage.getItem !== "function" || typeof storage.setItem !== "function") throw new Error("Browser storage is unavailable. Export a draft for backup.");
    var Core = global.NewsletterCore, sequence = 0;
    function cleanState(state) {
      if (state && Number(state.schemaVersion) > Core.SCHEMA_VERSION) throw new Error("This issue was saved by a newer builder. Open it with that version.");
      return Core.sanitizeState(state);
    }
    function read() {
      var raw;
      try { raw = storage.getItem(STORAGE_KEY); }
      catch (error) { throw new Error("Saved issues could not be read from browser storage. Your current draft is unchanged."); }
      if (raw === null) return [];
      var document;
      try { document = JSON.parse(raw); }
      catch (error) { throw new Error("The saved issue library is unreadable. It has been preserved; export your current draft before repairing storage."); }
      if (!document || document.version !== VERSION || !Array.isArray(document.issues) || document.issues.length > LIMIT) throw new Error("The saved issue library format is unsupported. It has been preserved.");
      var ids = new Set();
      return document.issues.map(function (record) {
        if (!record || typeof record.id !== "string" || !record.id || ids.has(record.id) || typeof record.name !== "string" || !record.name.trim() || record.name.length > 120 || !validStamp(record.createdAt) || !validStamp(record.updatedAt)) throw new Error("The saved issue library contains an invalid record. It has been preserved.");
        ids.add(record.id);
        return { id: record.id, name: record.name, createdAt: record.createdAt, updatedAt: record.updatedAt, state: cleanState(record.state) };
      });
    }
    function validStamp(value) { return typeof value === "string" && Number.isFinite(Date.parse(value)); }
    function write(records) {
      var value = JSON.stringify({ version: VERSION, issues: records });
      try { storage.setItem(STORAGE_KEY, value); }
      catch (error) { throw new Error("The issue library could not be saved. Browser storage may be full or blocked. Existing saved issues are unchanged; export your current draft for backup."); }
    }
    function metadata(record) { return { id: record.id, name: record.name, createdAt: record.createdAt, updatedAt: record.updatedAt }; }
    function uniqueId(records) {
      var id;
      do {
        sequence++;
        id = "issue-" + (global.crypto && typeof global.crypto.randomUUID === "function" ? global.crypto.randomUUID() : Date.now().toString(36) + "-" + Math.random().toString(36).slice(2)) + "-" + sequence;
      } while (records.some(function (record) { return record.id === id; }));
      return id;
    }
    return {
      list: function () {
        return read().map(metadata).sort(function (a, b) { return Date.parse(b.updatedAt) - Date.parse(a.updatedAt); });
      },
      save: function (name, state, id) {
        var title = typeof name === "string" ? name.trim() : "";
        if (!title) throw new Error("Enter a name for this issue.");
        if (title.length > 120) throw new Error("Use an issue name of 120 characters or fewer.");
        var records = read(), existing = id == null ? null : records.find(function (record) { return record.id === id; });
        if (id != null && !existing) throw new Error("That saved issue no longer exists. Save this draft as a new issue.");
        if (!existing && records.length >= LIMIT) throw new Error("The library holds up to 30 issues. Export or delete an older saved issue before adding another.");
        var now = new Date().toISOString();
        var record = { id: existing ? existing.id : uniqueId(records), name: title, createdAt: existing ? existing.createdAt : now, updatedAt: now, state: cleanState(state) };
        var next = existing ? records.map(function (item) { return item.id === existing.id ? record : item; }) : records.concat([record]);
        write(next);
        return record;
      },
      load: function (id) {
        var record = read().find(function (item) { return item.id === id; });
        if (!record) throw new Error("That saved issue no longer exists.");
        return record.state;
      },
      remove: function (id) {
        var records = read();
        if (!records.some(function (record) { return record.id === id; })) throw new Error("That saved issue no longer exists.");
        write(records.filter(function (record) { return record.id !== id; }));
      }
    };
  }
  global.NewsletterLibrary = { create: create, STORAGE_KEY: STORAGE_KEY, LIMIT: LIMIT };
})(typeof globalThis !== "undefined" ? globalThis : this);
