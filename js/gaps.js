/**
 * Mapping Voices — Coverage Gaps (gaps.html)
 *
 * Makes "the absence of a pin is not evidence of absence" visible. Joins:
 *   - data/reference/un-m49-countries.json: the 193 UN member states with
 *     their UN M49 region and subregion (static reference data), and
 *   - data/countries.json: the generated country index, which lists only
 *     countries that have at least one indexed collection,
 * on ISO 3166-1 alpha-2 code, and lists per region and subregion which
 * member states are indexed (linking into the atlas) and which have no
 * indexed collection yet (linking to the "propose a collection" form).
 * Territories and other non-member entities with collections are shown
 * alongside but never counted as gaps. data/stats.json supplies the
 * dataset version and per-region collection totals.
 *
 * No build step, no framework.
 */
(function () {
  "use strict";

  var REGION_ORDER = ["Africa", "Americas", "Asia", "Europe", "Oceania"];
  var PROPOSE_URL = "https://github.com/adab-tech/mapping/issues/new?template=new-collection.yml";

  var els = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    els.status = document.getElementById("gx-status");
    els.table = document.getElementById("gx-table");
    els.tbody = document.getElementById("gx-table-body");
    els.regions = document.getElementById("gx-regions");

    Promise.all([
      fetchJson("data/reference/un-m49-countries.json"),
      fetchJson("data/countries.json"),
      fetchJson("data/stats.json"),
    ])
      .then(function (res) {
        var regions = build(res[0].terms, res[1].terms);
        renderStats(regions, res[2]);
        renderTable(regions, res[2]);
        renderRegions(regions);
        els.status.hidden = true;
        els.table.hidden = false;
        openFromHash();
      })
      .catch(function (err) {
        console.error("Coverage Gaps: failed to load data", err);
        els.status.textContent = "Couldn't load the coverage data. If you're running this locally, serve the folder over HTTP.";
      });

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
      String(name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    );
  }

  /** Region → subregion → { covered, gaps, other } lists. */
  function build(members, indexed) {
    var byCode = new Map();
    indexed.forEach(function (t) {
      byCode.set(t.iso3166_1_alpha2, t);
    });
    var memberCodes = new Set();
    var regions = new Map();

    function sub(region, subregion) {
      if (!regions.has(region)) {
        regions.set(region, { name: region, id: slug("region-", region), subs: new Map() });
      }
      var r = regions.get(region);
      if (!r.subs.has(subregion)) r.subs.set(subregion, { name: subregion, covered: [], gaps: [], other: [] });
      return r.subs.get(subregion);
    }

    members.forEach(function (m) {
      memberCodes.add(m.iso3166_1_alpha2);
      var hit = byCode.get(m.iso3166_1_alpha2);
      var s = sub(m.region, m.subregion);
      if (hit && hit.collection_count > 0) s.covered.push(hit);
      else s.gaps.push(m);
    });
    indexed.forEach(function (t) {
      if (!memberCodes.has(t.iso3166_1_alpha2) && t.collection_count > 0) sub(t.region, t.subregion).other.push(t);
    });

    return Array.from(regions.values())
      .sort(function (a, b) {
        return rank(a.name) - rank(b.name);
      })
      .map(function (r) {
        var subs = Array.from(r.subs.values()).sort(function (a, b) {
          return a.name.localeCompare(b.name);
        });
        var totals = { covered: 0, gaps: 0, other: 0 };
        subs.forEach(function (s) {
          [s.covered, s.gaps, s.other].forEach(function (list) {
            list.sort(function (a, b) {
              return a.name.localeCompare(b.name);
            });
          });
          totals.covered += s.covered.length;
          totals.gaps += s.gaps.length;
          totals.other += s.other.length;
        });
        return { name: r.name, id: r.id, subs: subs, totals: totals };
      });
  }

  function rank(region) {
    var i = REGION_ORDER.indexOf(region);
    return i === -1 ? REGION_ORDER.length : i;
  }

  function sum(regions, key) {
    return regions.reduce(function (n, r) {
      return n + r.totals[key];
    }, 0);
  }

  function renderStats(regions, stats) {
    var covered = sum(regions, "covered");
    var gaps = sum(regions, "gaps");
    set("gx-stat-members", covered + gaps);
    set("gx-stat-covered", covered);
    set("gx-stat-gaps", gaps);
    set("gx-stat-other", sum(regions, "other"));
    if (stats.version) {
      set("gx-version", " (dataset v" + stats.version + (stats.released ? ", " + stats.released : "") + ")");
    }
  }

  function set(id, v) {
    document.getElementById(id).textContent = String(v);
  }

  function pct(n, d) {
    return d ? Math.round((n / d) * 100) : 0;
  }

  // ---------------------------------------------------------------- rendering

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

  /** A decorative proportion bar; the adjacent text always states the figures. */
  function bar(n, d) {
    var track = el("span", "gx-bar");
    track.setAttribute("aria-hidden", "true");
    var fill = el("span", "gx-bar-fill");
    fill.style.width = pct(n, d) + "%";
    track.appendChild(fill);
    return track;
  }

  function renderTable(regions, stats) {
    var byRegion = (stats && stats.by_region) || {};
    regions.forEach(function (r) {
      var total = r.totals.covered + r.totals.gaps;
      var tr = document.createElement("tr");
      var th = el("th");
      th.scope = "row";
      th.appendChild(link("#" + r.id, r.name));
      tr.appendChild(th);

      var td = el("td", "gx-share");
      td.appendChild(el("span", "gx-share-text", r.totals.covered + " of " + total + " (" + pct(r.totals.covered, total) + "%)"));
      td.appendChild(bar(r.totals.covered, total));
      tr.appendChild(td);

      tr.appendChild(el("td", "gx-num", String(r.totals.gaps)));
      tr.appendChild(el("td", "gx-num", String(byRegion[r.name] != null ? byRegion[r.name] : "–")));
      els.tbody.appendChild(tr);
    });
  }

  function renderRegions(regions) {
    regions.forEach(function (r) {
      var total = r.totals.covered + r.totals.gaps;
      var section = el("section", "gx-region");
      section.id = r.id;
      section.setAttribute("aria-labelledby", r.id + "-title");

      var h2 = el("h2", null, r.name);
      h2.id = r.id + "-title";
      section.appendChild(h2);

      var summary = el("p", "gx-region-summary");
      summary.appendChild(
        document.createTextNode(
          r.totals.covered +
            " of " +
            total +
            " UN member states have at least one indexed collection; " +
            r.totals.gaps +
            (r.totals.gaps === 1 ? " has" : " have") +
            " none yet."
        )
      );
      section.appendChild(summary);
      section.appendChild(bar(r.totals.covered, total));

      r.subs.forEach(function (s) {
        section.appendChild(renderSub(s));
      });
      els.regions.appendChild(section);
    });
  }

  function renderSub(s) {
    var wrap = el("div", "gx-sub");
    var total = s.covered.length + s.gaps.length;
    var h3 = el("h3", "gx-sub-title", s.name);
    h3.appendChild(el("span", "gx-sub-meta", s.covered.length + " of " + total + " indexed"));
    wrap.appendChild(h3);

    var cols = el("div", "gx-cols");

    if (s.covered.length) {
      var have = el("div", "gx-col");
      have.appendChild(el("p", "gx-label", "Indexed"));
      var ul = el("ul", "gx-list");
      s.covered.forEach(function (c) {
        var li = document.createElement("li");
        li.appendChild(link("./?" + new URLSearchParams({ country: c.name }).toString(), c.name));
        li.appendChild(el("span", "gx-count", countLabel(c.collection_count)));
        ul.appendChild(li);
      });
      have.appendChild(ul);
      cols.appendChild(have);
    }

    if (s.gaps.length) {
      var none = el("div", "gx-col gx-col-gaps");
      none.appendChild(el("p", "gx-label", "No indexed collection yet — know one here? Propose it"));
      var gl = el("ul", "gx-list");
      s.gaps.forEach(function (m) {
        var li = document.createElement("li");
        li.appendChild(el("span", "gx-gap-name", m.name));
        var a = link(PROPOSE_URL + "&" + new URLSearchParams({ country: m.name }).toString(), "Propose it");
        a.className = "gx-propose";
        a.appendChild(el("span", "visually-hidden", ": a collection from " + m.name));
        li.appendChild(a);
        gl.appendChild(li);
      });
      none.appendChild(gl);
      cols.appendChild(none);
    }

    wrap.appendChild(cols);

    if (s.other.length) {
      var p = el("p", "gx-other");
      p.appendChild(document.createTextNode("Also indexed here, not UN member states: "));
      s.other.forEach(function (o, i) {
        if (i) p.appendChild(document.createTextNode(", "));
        p.appendChild(link("./?" + new URLSearchParams({ country: o.name }).toString(), o.name));
        p.appendChild(document.createTextNode(" (" + o.collection_count + ")"));
      });
      wrap.appendChild(p);
    }
    return wrap;
  }

  function countLabel(n) {
    return n + (n === 1 ? " collection" : " collections");
  }

  function openFromHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    var target = document.getElementById(id);
    if (target) target.scrollIntoView({ block: "start" });
  }
})();
