/**
 * Mapping Voices — Language Explorer (languages.html)
 *
 * Reads the generated data/languages.json (vocabulary + usage) and
 * data/collections.json, and renders one expandable entry per language:
 * ISO 639-3 code, alternate names, countries, collections, most frequent
 * themes, recording-period span, and how many of its collections are
 * multilingual. Countries and collections link back into the atlas with
 * filters applied, so every view here is also reachable on the map.
 *
 * Search, type filter, sort, and the open language are mirrored in the URL
 * (?q=…&type=…&sort=…#lang-hausa) so views can be shared and cited.
 *
 * No build step, no framework.
 */
(function () {
  "use strict";

  var TYPE_LABELS = {
    language: "Language",
    macrolanguage: "Macrolanguage",
    "sign language": "Sign language",
    collective: "Language group",
  };
  var TYPE_NOTES = {
    macrolanguage:
      "The ISO 639-3 code names the macrolanguage as a whole; sources rarely specify the variety.",
    collective:
      "A group term, used only when a source names a group of languages rather than individual ones. Each collection keeps the source's own wording.",
  };

  var els = {};
  var languages = [];
  var byMv = new Map();
  var timer = null;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    els.q = document.getElementById("lx-q");
    els.type = document.getElementById("lx-type");
    els.sort = document.getElementById("lx-sort");
    els.list = document.getElementById("lx-list");
    els.count = document.getElementById("lx-count");
    els.status = document.getElementById("lx-status");
    els.form = document.getElementById("lx-controls");

    Promise.all([fetchJson("data/languages.json"), fetchJson("data/collections.json")])
      .then(function (res) {
        res[1].forEach(function (c) {
          byMv.set(c.mv_id, c);
        });
        languages = res[0].terms
          .filter(function (l) {
            return l.collection_count > 0;
          })
          .map(enrich);
        renderStats();
        readUrl();
        render();
        openFromHash();
        els.status.hidden = true;
      })
      .catch(function (err) {
        console.error("Language Explorer: failed to load data", err);
        els.status.textContent = "Couldn't load the language data. If you're running this locally, serve the folder over HTTP.";
      });

    els.form.addEventListener("submit", function (e) {
      e.preventDefault();
    });
    els.q.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(update, 120);
    });
    els.type.addEventListener("change", update);
    els.sort.addEventListener("change", update);
    window.addEventListener("hashchange", openFromHash);
  }

  function fetchJson(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }

  function slug(name) {
    return (
      "lang-" +
      fold(name)
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    );
  }

  function fold(s) {
    return String(s)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase();
  }

  /** Derives per-language figures from its collections. */
  function enrich(l) {
    var cols = l.collections
      .map(function (mv) {
        return byMv.get(mv);
      })
      .filter(Boolean);
    var themeCounts = {};
    var start = Infinity;
    var end = -Infinity;
    var ongoing = false;
    var multilingual = 0;
    cols.forEach(function (c) {
      (c.themes || []).forEach(function (t) {
        themeCounts[t] = (themeCounts[t] || 0) + 1;
      });
      if (typeof c.decade_start === "number") start = Math.min(start, c.decade_start);
      if (c.decade_end == null) ongoing = true;
      else end = Math.max(end, c.decade_end);
      if ((c.languages || []).length > 1) multilingual++;
    });
    var themes = Object.keys(themeCounts)
      .sort(function (a, b) {
        return themeCounts[b] - themeCounts[a] || a.localeCompare(b);
      })
      .slice(0, 6)
      .map(function (t) {
        return { name: t, count: themeCounts[t] };
      });
    return {
      term: l,
      id: slug(l.name),
      cols: cols,
      themes: themes,
      period: start === Infinity ? null : { start: start, end: ongoing ? null : end },
      multilingual: multilingual,
      search: fold([l.name, (l.alt_names || []).join(" "), l.iso639_3 || "", l.countries.join(" ")].join(" ")),
    };
  }

  function renderStats() {
    var individual = languages.filter(function (x) {
      return x.term.type !== "collective";
    });
    set("lx-stat-languages", individual.length);
    set("lx-stat-iso", individual.filter(function (x) {
      return x.term.iso639_3;
    }).length);
    set("lx-stat-single", individual.filter(function (x) {
      return x.term.collection_count === 1;
    }).length);
    set("lx-stat-groups", languages.length - individual.length);
  }

  function set(id, v) {
    document.getElementById(id).textContent = String(v);
  }

  // ---------------------------------------------------------------- URL state

  function readUrl() {
    var p = new URLSearchParams(location.search);
    els.q.value = p.get("q") || "";
    if (p.get("type")) els.type.value = p.get("type");
    if (p.get("sort")) els.sort.value = p.get("sort");
  }

  function writeUrl() {
    var p = new URLSearchParams();
    if (els.q.value.trim()) p.set("q", els.q.value.trim());
    if (els.type.value) p.set("type", els.type.value);
    if (els.sort.value !== "name") p.set("sort", els.sort.value);
    var qs = p.toString();
    history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
  }

  function update() {
    render();
    writeUrl();
  }

  function openFromHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    var el = document.getElementById(id);
    if (!el) {
      // The language may be hidden by the current filters; clear them.
      els.q.value = "";
      els.type.value = "";
      update();
      el = document.getElementById(id);
    }
    if (el && el.tagName === "DETAILS") {
      el.open = true;
      el.scrollIntoView({ block: "start" });
      el.querySelector("summary").focus({ preventScroll: true });
    }
  }

  // ---------------------------------------------------------------- rendering

  function visible() {
    var terms = fold(els.q.value).split(/\s+/).filter(Boolean);
    var type = els.type.value;
    var list = languages.filter(function (x) {
      if (type === "collective" && x.term.type !== "collective") return false;
      if (type === "language" && x.term.type === "collective") return false;
      return terms.every(function (t) {
        return x.search.indexOf(t) !== -1;
      });
    });
    var sort = els.sort.value;
    list.sort(function (a, b) {
      if (sort === "count") return b.term.collection_count - a.term.collection_count || a.term.name.localeCompare(b.term.name);
      if (sort === "countries") return b.term.countries.length - a.term.countries.length || a.term.name.localeCompare(b.term.name);
      return a.term.name.localeCompare(b.term.name);
    });
    return list;
  }

  function render() {
    var list = visible();
    var openIds = new Set(
      Array.prototype.map.call(els.list.querySelectorAll("details[open]"), function (d) {
        return d.id;
      })
    );
    els.list.innerHTML = "";
    list.forEach(function (x) {
      var li = document.createElement("li");
      li.appendChild(renderLanguage(x, openIds.has(x.id)));
      els.list.appendChild(li);
    });
    els.count.textContent =
      list.length === languages.length
        ? "Showing all " + list.length + " languages and groups."
        : "Showing " + list.length + " of " + languages.length + " languages and groups.";
  }

  function atlasUrl(params) {
    var p = new URLSearchParams(params);
    return "./?" + p.toString();
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function link(href, text) {
    var a = document.createElement("a");
    a.href = href;
    a.textContent = text;
    return a;
  }

  function periodLabel(p) {
    if (!p) return "unknown";
    return p.start + "–" + (p.end == null ? "present" : p.end);
  }

  function renderLanguage(x, open) {
    var t = x.term;
    var d = document.createElement("details");
    d.id = x.id;
    d.className = "lx-item" + (t.type === "collective" ? " is-collective" : "");
    if (open) d.open = true;

    var s = document.createElement("summary");
    var name = el("span", "lx-name", t.name);
    s.appendChild(name);
    if (t.iso639_3) s.appendChild(el("span", "lx-code", t.iso639_3));
    if (t.type !== "language") s.appendChild(el("span", "lx-type", TYPE_LABELS[t.type] || t.type));
    var n = t.collection_count;
    var c = t.countries.length;
    s.appendChild(
      el("span", "lx-meta", n + (n === 1 ? " collection" : " collections") + " · " + c + (c === 1 ? " country" : " countries"))
    );
    d.appendChild(s);

    var body = el("div", "lx-body");
    var dl = document.createElement("dl");

    if (t.alt_names && t.alt_names.length) row(dl, "Also known as", t.alt_names.join(", "));

    if (t.iso639_3) {
      var code = link("https://iso639-3.sil.org/code/" + encodeURIComponent(t.iso639_3), t.iso639_3);
      code.rel = "noopener";
      row(dl, "ISO 639-3", code);
    }

    if (TYPE_NOTES[t.type]) row(dl, "Classification", TYPE_NOTES[t.type]);

    var countries = el("ul", "lx-inline");
    t.countries.forEach(function (country) {
      var li = document.createElement("li");
      li.appendChild(link(atlasUrl({ country: country, language: t.name }), country));
      countries.appendChild(li);
    });
    row(dl, "Countries", countries);

    row(dl, "Recording period", periodLabel(x.period));

    if (t.type !== "collective" && x.cols.length) {
      row(
        dl,
        "Multilingual collections",
        x.multilingual + " of " + x.cols.length + " also document other languages"
      );
    }

    if (x.themes.length) {
      var themes = el("ul", "tag-list");
      x.themes.forEach(function (th) {
        var li = el("li", "tag");
        li.appendChild(link(atlasUrl({ language: t.name, theme: th.name }), th.name + " (" + th.count + ")"));
        themes.appendChild(li);
      });
      row(dl, "Most frequent themes", themes);
    }

    body.appendChild(dl);

    var h = el("h3", "lx-sub", "Collections");
    body.appendChild(h);
    var cols = el("ul", "lx-collections");
    x.cols
      .slice()
      .sort(function (a, b) {
        return a.title.localeCompare(b.title);
      })
      .forEach(function (col) {
        var li = document.createElement("li");
        li.appendChild(link(atlasUrl({ c: col.mv_id }), col.title));
        var meta = [col.archive, col.country].filter(Boolean).join(" · ");
        li.appendChild(el("span", "lx-col-meta", meta));
        if (col.language_note && t.type === "collective") {
          li.appendChild(el("span", "lx-col-note", "Source wording: " + col.language_note));
        }
        cols.appendChild(li);
      });
    body.appendChild(cols);

    var all = link(atlasUrl({ language: t.name }), "Show all " + t.name + " collections on the map →");
    all.className = "lx-atlas-link";
    body.appendChild(all);

    d.appendChild(body);
    d.addEventListener("toggle", function () {
      if (d.open && location.hash !== "#" + d.id) {
        history.replaceState(null, "", location.pathname + location.search + "#" + d.id);
      }
    });
    return d;
  }

  function row(dl, label, value) {
    var r = el("div", "detail-row");
    r.appendChild(el("dt", null, label));
    var dd = document.createElement("dd");
    if (typeof value === "string") dd.textContent = value;
    else dd.appendChild(value);
    r.appendChild(dd);
    dl.appendChild(r);
  }
})();
