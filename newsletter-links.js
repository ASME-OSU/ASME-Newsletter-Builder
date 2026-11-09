(function (global) {
  "use strict";

  function createChecker(options) {
    var generation = 0;
    var activeSignature = null;
    var hasRun = false;

    function signature(links) {
      return JSON.stringify(links.map(function (link) {
        return [String(link.label || ""), String(link.url || ""), String(link.safe || "")];
      }));
    }

    function notify(state, results, count) {
      options.onStatus({ state: state, results: results || [], count: count });
    }

    function invalidate() {
      if (!hasRun) return false;
      var links = options.collectLinks();
      var nextSignature = signature(links);
      if (nextSignature === activeSignature) return false;
      generation++;
      activeSignature = nextSignature;
      notify("stale", [], links.length);
      return true;
    }

    function run() {
      var links = options.collectLinks().map(function (link) { return Object.assign({}, link); });
      var runSignature = signature(links);
      var runGeneration = ++generation;
      hasRun = true;
      activeSignature = runSignature;
      if (!links.length) {
        notify("empty", [], 0);
        return Promise.resolve([]);
      }
      notify("checking", [], links.length);
      return Promise.all(links.map(function (link) {
        return Promise.resolve().then(function () { return options.probe(link); });
      })).then(function (results) {
        // A newer run owns the view, even if the enabled URLs happen to match.
        if (runGeneration !== generation) return results;
        // Also catch edits made without an explicit invalidate() call.
        if (signature(options.collectLinks()) !== runSignature) {
          invalidate();
          return results;
        }
        notify("complete", results, links.length);
        return results;
      });
    }

    return { run: run, invalidate: invalidate };
  }

  global.NewsletterLinks = { createChecker: createChecker };
})(typeof window !== "undefined" ? window : globalThis);
