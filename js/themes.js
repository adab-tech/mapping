/**
 * Mapping Voices — Theme Explorer (themes.html)
 *
 * Reads the generated data/themes.json (taxonomy + usage) and
 * data/collections.json, and renders the 15 top-level groups, each an
 * expandable entry listing its themes. Every theme expands to its scope
 * note, the collections it is assigned to, the countries and languages
 * those collections span. Countries, languages, and collections link back
 * into the atlas with filters applied, so every view here is also
 * reachable on the map.
 *
 * Search, sort, and the open theme are mirrored in the URL
 * (?q=…&sort=…#theme-oral-tradition) so views can be shared and cited.
 * Follows the structure of js/languages.js.
 *
 * No build step, no framework.
 */
(function () {
  "use strict";

  var els = {};
  var groups = [];
  var themeTotal = 0;
  var byMv = new Map();
  var timer = null;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    els.q = document.getElementById("tx-q");
    els.sort = document.getElementById("tx-sort");
    els.list = document.getElementById("tx-list");
    els.count = document.getElementById("tx-count");
    els.status = document.getElementById("tx-status");
    els.form = document.getElementById("tx-controls");

    Promise.all([fetchJson("data/themes.json"), fetchJson("data/collections.json")])
      .then(function (res) {
        res[1].forEach(function (c) {
          byMv.set(c.mv_id, c);
        });
        build(res[0]);
        renderStats(res[1]);
        readUrl();
        render();
        openFromHash();
        els.status.hidden = true;
      })
      .catch(function (err) {
        console.error("Theme Explorer: failed to load data", err);
        els.status.textContent = "Couldn't load the theme data. If you're running this locally, serve the folder over HTTP.";
      });

    els.form.addEventListener("submit", function (e) {
      e.preventDefault();
    });
    els.q.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(update, 120);
    });
    els.sort.addEventListener("change", update);
    window.addEventListener("hashchange", openFromHash);
  }

  function fetchJson(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }

  function slug(prefix, name) {
    return (
      prefix +
      fold(name)
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    );
  }

  function fold(s) {
    return String(s)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  /** Groups the theme terms under their top-level headings, in taxonomy order. */
  function build(data) {
    var byGroup = new Map();
    groups = data.groups.map(function (g, i) {
      var entry = { group: g, id: slug("group-", g.id), order: i, themes: [] };
      byGroup.set(g.id, entry);
      return entry;
    });
    data.terms.forEach(function (t, i) {
      var g = byGroup.get(t.group);
      if (!g) return;
      g.themes.push(enrich(t, i));
      themeTotal++;
    });
  }

  /** Derives per-theme countries and languages from its collections. */
  function enrich(t, order) {
    var cols = t.collections
      .map(function (mv) {
        return byMv.get(mv);
      })
      .filter(Boolean);
    var countries = {};
    var languages = {};
    cols.forEach(function (c) {
      if (c.country) countries[c.country] = (countries[c.country] || 0) + 1;
      (c.languages || []).forEach(function (l) {
        languages[l] = (languages[l] || 0) + 1;
      });
    });
    return {
      term: t,
      id: slug("theme-", t.name),
      order: order,
      cols: cols,
      countries: tally(countries),
      languages: tally(languages),
      search: fold(t.name + " " + (t.scope_note || "")),
    };
  }

  function tally(counts) {
    return Object.keys(counts)
      .sort(function (a, b) {
        return a.localeCompare(b);
      })
      .map(function (k) {
        return { name: k, count: counts[k] };
      });
  }

  function renderStats(collections) {
    var all = [];
    groups.forEach(function (g) {
      all = all.concat(g.themes);
    });
    set("tx-stat-themes", all.length);
    set("tx-stat-groups", groups.length);
    set("tx-stat-single", all.filter(function (x) {
      return x.term.collection_count === 1;
    }).length);
    set("tx-stat-collections", collections.length);
  }

  function set(id, v) {
    document.getElementById(id).textContent = String(v);
  }

  // ---------------------------------------------------------------- URL state

  function readUrl() {
    var p = new URLSearchParams(location.search);
    els.q.value = p.get("q") || "";
    if (p.get("sort") === "count") els.sort.value = "count";
  }

  function writeUrl() {
    var p = new URLSearchParams();
    if (els.q.value.trim()) p.set("q", els.q.value.trim());
    if (els.sort.value !== "taxonomy") p.set("sort", els.sort.value);
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
      // The theme may be hidden by the current search; clear it.
      els.q.value = "";
      update();
      el = document.getElementById(id);
    }
    if (el && el.tagName === "DETAILS") {
      // Open the enclosing group first, so a theme is never inside a closed one.
      var parent = el.parentElement && el.parentElement.closest("details");
      if (parent) parent.open = true;
      el.open = true;
      el.scrollIntoView({ block: "start" });
      el.querySelector("summary").focus({ preventScroll: true });
    }
  }

  // ---------------------------------------------------------------- rendering

  function visible() {
    var terms = fold(els.q.value).split(/\s+/).filter(Boolean);
    var byCount = els.sort.value === "count";
    var list = groups
      .map(function (g) {
        var themes = g.themes.filter(function (x) {
          return terms.every(function (t) {
            return x.search.indexOf(t) !== -1;
          });
        });
        themes.sort(function (a, b) {
          if (byCount) return b.term.collection_count - a.term.collection_count || a.order - b.order;
          return a.order - b.order;
        });
        return { entry: g, themes: themes };
      })
      .filter(function (x) {
        return x.themes.length > 0;
      });
    list.sort(function (a, b) {
      if (byCount) return b.entry.group.collection_count - a.entry.group.collection_count || a.entry.order - b.entry.order;
      return a.entry.order - b.entry.order;
    });
    return { groups: list, searching: terms.length > 0 };
  }

  function render() {
    var v = visible();
    var openIds = new Set(
      Array.prototype.map.call(els.list.querySelectorAll("details[open]"), function (d) {
        return d.id;
      })
    );
    els.list.innerHTML = "";
    var shown = 0;
    v.groups.forEach(function (x) {
      shown += x.themes.length;
      var li = document.createElement("li");
      li.appendChild(renderGroup(x.entry, x.themes, v.searching || openIds.has(x.entry.id), openIds));
      els.list.appendChild(li);
    });
    if (!v.groups.length) {
      els.count.textContent = "No themes match “" + els.q.value.trim() + "”.";
    } else if (shown === themeTotal) {
      els.count.textContent = "Showing all " + shown + " themes in " + v.groups.length + " groups.";
    } else {
      els.count.textContent =
        "Showing " + shown + " of " + themeTotal + " themes, in " + v.groups.length + (v.groups.length === 1 ? " group." : " groups.");
    }
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

  function plural(n, one, many) {
    return n + " " + (n === 1 ? one : many);
  }

  function renderGroup(g, themes, open, openIds) {
    var d = document.createElement("details");
    d.id = g.id;
    d.className = "lx-item tx-group";
    if (open) d.open = true;

    var s = document.createElement("summary");
    s.appendChild(el("span", "lx-name", g.group.label));
    s.appendChild(
      el(
        "span",
        "lx-meta",
        plural(g.themes.length, "theme", "themes") + " · " + plural(g.group.collection_count, "collection", "collections")
      )
    );
    d.appendChild(s);

    var body = el("div", "lx-body");
    var ol = el("ol", "lx-list tx-themes");
    themes.forEach(function (x) {
      var li = document.createElement("li");
      li.appendChild(renderTheme(x, openIds.has(x.id)));
      ol.appendChild(li);
    });
    body.appendChild(ol);
    d.appendChild(body);
    return d;
  }

  function renderTheme(x, open) {
    var t = x.term;
    var d = document.createElement("details");
    d.id = x.id;
    d.className = "lx-item tx-theme";
    if (open) d.open = true;

    var s = document.createElement("summary");
    s.appendChild(el("span", "lx-name", t.name));
    s.appendChild(
      el(
        "span",
        "lx-meta",
        plural(t.collection_count, "collection", "collections") + " · " + plural(x.countries.length, "country", "countries")
      )
    );
    d.appendChild(s);

    var body = el("div", "lx-body");
    if (t.scope_note) body.appendChild(el("p", "tx-scope", t.scope_note));

    var dl = document.createElement("dl");
    if (x.countries.length) {
      var countries = el("ul", "lx-inline");
      x.countries.forEach(function (c) {
        var li = document.createElement("li");
        li.appendChild(link(atlasUrl({ country: c.name, theme: t.name }), c.name));
        if (c.count > 1) li.appendChild(document.createTextNode(" (" + c.count + ")"));
        countries.appendChild(li);
      });
      row(dl, "Countries", countries);
    }
    if (x.languages.length) {
      var langs = el("ul", "lx-inline");
      x.languages.forEach(function (l) {
        var li = document.createElement("li");
        li.appendChild(link(atlasUrl({ language: l.name, theme: t.name }), l.name));
        if (l.count > 1) li.appendChild(document.createTextNode(" (" + l.count + ")"));
        langs.appendChild(li);
      });
      row(dl, "Languages", langs);
    }
    if (dl.childNodes.length) body.appendChild(dl);

    if (x.cols.length) {
      body.appendChild(el("h3", "lx-sub", "Collections"));
      var cols = el("ul", "lx-collections");
      x.cols
        .slice()
        .sort(function (a, b) {
          return a.title.localeCompare(b.title);
        })
        .forEach(function (col) {
          var li = document.createElement("li");
          li.appendChild(link(atlasUrl({ c: col.mv_id }), col.title));
          li.appendChild(el("span", "lx-col-meta", [col.archive, col.country].filter(Boolean).join(" · ")));
          cols.appendChild(li);
        });
      body.appendChild(cols);

      var all = link(atlasUrl({ theme: t.name }), "Show all “" + t.name + "” collections on the map →");
      all.className = "lx-atlas-link";
      body.appendChild(all);
    } else {
      body.appendChild(el("p", "tx-scope", "No indexed collection has this theme yet."));
    }

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
