/**
 * Mapping Voices — app.js
 *
 * Fetches data/collections.json (see SPEC.md "Data schema") and renders:
 *  - a Leaflet map with one accessible, keyboard-focusable pin per collection
 *  - country / theme / language / decade filters (native <select>s)
 *  - a scrollable text index of the current results (the accessible
 *    alternative to "reading" pins on the map)
 *  - a detail panel with the selected collection's summary + source link
 *
 * No build step, no framework — plain DOM + Leaflet's global `L`.
 */
(function () {
  "use strict";

  var DATA_URL = "data/collections.json";
  var NARROW_QUERY = "(max-width: 979px)";

  /** @type {Array<Object>} */
  var collections = [];
  var markersById = new Map();
  var markerLayer = null;
  var map = null;
  var selectedId = null;
  var lastFocusedBeforeDrawer = null;
  var activeDrawer = null; // 'filters' | 'detail' | null

  var els = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheEls();
    bindStaticEvents();
    loadData();
  }

  function cacheEls() {
    els.mapStatus = document.getElementById("map-status");
    els.filtersDrawer = document.getElementById("filters-drawer");
    els.filtersToggle = document.getElementById("filters-toggle");
    els.filtersClose = document.getElementById("filters-close");
    els.filtersForm = document.getElementById("filters-form");
    els.filtersReset = document.getElementById("filters-reset");
    els.countrySelect = document.getElementById("filter-country");
    els.themeSelect = document.getElementById("filter-theme");
    els.languageSelect = document.getElementById("filter-language");
    els.decadeSelect = document.getElementById("filter-decade");
    els.resultsList = document.getElementById("results-list");
    els.resultsCount = document.getElementById("results-count");
    els.resultsEmpty = document.getElementById("results-empty");
    els.detailPanel = document.getElementById("detail-panel");
    els.detailClose = document.getElementById("detail-close");
    els.detailBody = document.getElementById("detail-body");
    els.backdrop = document.getElementById("drawer-backdrop");
    els.liveRegion = document.getElementById("live-region");
  }

  function narrowMQ() {
    return window.matchMedia(NARROW_QUERY);
  }

  // ------------------------------------------------------------------
  // Data loading
  // ------------------------------------------------------------------

  function loadData() {
    setMapStatus("Loading collections…");
    fetch(DATA_URL)
      .then(function (res) {
        if (!res.ok) {
          throw new Error("HTTP " + res.status);
        }
        return res.json();
      })
      .then(function (data) {
        if (!Array.isArray(data)) {
          throw new Error("Expected an array of collections.");
        }
        collections = data.filter(isValidCollection);
        clearMapStatus();
        buildMap();
        buildFilterOptions();
        renderAll();
      })
      .catch(function (err) {
        console.error("Mapping Voices: failed to load " + DATA_URL, err);
        setMapStatus(
          "Couldn’t load the collections dataset (" + DATA_URL + "). " +
            "If you're running this locally, check that a data/collections.json " +
            "file exists next to index.html."
        );
      });
  }

  function isValidCollection(c) {
    return (
      c &&
      typeof c.id === "string" &&
      typeof c.title === "string" &&
      typeof c.lat === "number" &&
      typeof c.lng === "number"
    );
  }

  function setMapStatus(message) {
    els.mapStatus.textContent = message;
    els.mapStatus.hidden = false;
  }

  function clearMapStatus() {
    els.mapStatus.hidden = true;
    els.mapStatus.textContent = "";
  }

  // ------------------------------------------------------------------
  // Map
  // ------------------------------------------------------------------

  function buildMap() {
    map = L.map("map", {
      worldCopyJump: true,
      minZoom: 2,
    }).setView([15, 10], 2);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    }).addTo(map);

    markerLayer = L.layerGroup().addTo(map);
  }

  function pinIcon(active) {
    return L.divIcon({
      className: "mv-pin-icon",
      html: '<span class="mv-pin' + (active ? " is-active" : "") + '"></span>',
      iconSize: [22, 22],
      iconAnchor: [11, 20],
      popupAnchor: [0, -20],
    });
  }

  function decadeLabel(c) {
    var start = c.decade_start != null ? c.decade_start + "s" : "unknown";
    if (c.decade_end == null) {
      return start + "–present";
    }
    if (c.decade_start === c.decade_end) {
      return start;
    }
    return start + "–" + c.decade_end + "s";
  }

  function accessibleLabel(c) {
    var parts = [c.title];
    if (c.archive) {
      parts.push(c.archive);
    }
    if (c.country) {
      parts.push(c.country);
    }
    return parts.join(", ");
  }

  function popupHtml(c) {
    var langs = (c.languages || []).join(", ");
    var wrap = document.createElement("div");
    wrap.className = "mv-popup";

    var h3 = document.createElement("h3");
    h3.textContent = c.title;
    wrap.appendChild(h3);

    var pArchive = document.createElement("p");
    pArchive.textContent = [c.archive, c.country].filter(Boolean).join(" — ");
    wrap.appendChild(pArchive);

    if (langs) {
      var pLang = document.createElement("p");
      pLang.textContent = "Languages: " + langs;
      wrap.appendChild(pLang);
    }

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "text-button";
    btn.textContent = "View full details";
    btn.addEventListener("click", function () {
      selectCollection(c.id, { openDrawerOnMobile: true, panTo: false });
    });
    wrap.appendChild(btn);

    return wrap;
  }

  function renderMarkers(list) {
    markerLayer.clearLayers();
    markersById.clear();

    list.forEach(function (c) {
      var marker = L.marker([c.lat, c.lng], {
        icon: pinIcon(c.id === selectedId),
        keyboard: true,
        alt: accessibleLabel(c),
        title: accessibleLabel(c),
      });

      marker.bindPopup(function () {
        return popupHtml(c);
      });

      marker.on("add", function () {
        var el = marker.getElement();
        if (el) {
          el.setAttribute("role", "button");
          el.setAttribute("aria-label", accessibleLabel(c) + ". Opens details.");
          el.setAttribute("tabindex", "0");
          // Leaflet's own keyboard handling does not reliably synthesize a
          // click from Enter/Space on a divIcon marker, so wire it up
          // explicitly to guarantee keyboard users can activate a pin.
          el.addEventListener("keydown", function (evt) {
            if (evt.key === "Enter" || evt.key === " " || evt.key === "Spacebar") {
              evt.preventDefault();
              selectCollection(c.id, { openDrawerOnMobile: true, panTo: false });
            }
          });
        }
      });

      marker.on("click", function () {
        selectCollection(c.id, { openDrawerOnMobile: true, panTo: false });
      });

      marker.addTo(markerLayer);
      markersById.set(c.id, marker);
    });
  }

  // ------------------------------------------------------------------
  // Filters
  // ------------------------------------------------------------------

  function uniqueSorted(values) {
    return Array.from(new Set(values.filter(function (v) {
      return v !== undefined && v !== null && v !== "";
    }))).sort(function (a, b) {
      return String(a).localeCompare(String(b));
    });
  }

  function buildFilterOptions() {
    var countries = uniqueSorted(collections.map(function (c) {
      return c.country;
    }));
    var themes = uniqueSorted(flatten(collections.map(function (c) {
      return c.themes || [];
    })));
    var languages = uniqueSorted(flatten(collections.map(function (c) {
      return c.languages || [];
    })));
    var decades = uniqueSorted(collectDecades(collections));

    fillSelect(els.countrySelect, countries, "All countries");
    fillSelect(els.themeSelect, themes, "All themes");
    fillSelect(els.languageSelect, languages, "All languages");
    fillSelect(
      els.decadeSelect,
      decades,
      "All decades",
      function (d) {
        return d + "s";
      }
    );
  }

  function flatten(arrays) {
    return arrays.reduce(function (acc, arr) {
      return acc.concat(arr);
    }, []);
  }

  function collectDecades(list) {
    var now = new Date();
    var currentDecade = Math.floor(now.getFullYear() / 10) * 10;
    var set = new Set();
    list.forEach(function (c) {
      if (typeof c.decade_start !== "number") {
        return;
      }
      var end = c.decade_end != null ? c.decade_end : currentDecade;
      for (var d = c.decade_start; d <= end; d += 10) {
        set.add(d);
      }
    });
    return Array.from(set);
  }

  function fillSelect(select, values, allLabel, labelFn) {
    select.innerHTML = "";
    var allOpt = document.createElement("option");
    allOpt.value = "";
    allOpt.textContent = allLabel;
    select.appendChild(allOpt);
    values.forEach(function (v) {
      var opt = document.createElement("option");
      opt.value = String(v);
      opt.textContent = labelFn ? labelFn(v) : String(v);
      select.appendChild(opt);
    });
  }

  function currentFilters() {
    return {
      country: els.countrySelect.value,
      theme: els.themeSelect.value,
      language: els.languageSelect.value,
      decade: els.decadeSelect.value ? Number(els.decadeSelect.value) : "",
    };
  }

  function applyFilters() {
    var f = currentFilters();
    return collections.filter(function (c) {
      if (f.country && c.country !== f.country) {
        return false;
      }
      if (f.theme && (!c.themes || c.themes.indexOf(f.theme) === -1)) {
        return false;
      }
      if (f.language && (!c.languages || c.languages.indexOf(f.language) === -1)) {
        return false;
      }
      if (f.decade !== "") {
        var start = c.decade_start;
        var end = c.decade_end != null ? c.decade_end : f.decade;
        if (typeof start !== "number" || f.decade < start || f.decade > end) {
          return false;
        }
      }
      return true;
    });
  }

  // ------------------------------------------------------------------
  // Rendering
  // ------------------------------------------------------------------

  function renderAll() {
    var filtered = applyFilters();
    renderMarkers(filtered);
    renderResultsList(filtered);
    announceCount(filtered.length);

    if (selectedId && !filtered.some(function (c) { return c.id === selectedId; })) {
      clearSelection();
    }
  }

  function renderResultsList(list) {
    els.resultsList.innerHTML = "";
    els.resultsEmpty.hidden = list.length !== 0;

    list.forEach(function (c) {
      var li = document.createElement("li");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "result-item";
      btn.dataset.id = c.id;
      if (c.id === selectedId) {
        btn.setAttribute("aria-current", "true");
      }

      var title = document.createElement("span");
      title.className = "result-title";
      title.textContent = c.title;

      var meta = document.createElement("span");
      meta.className = "result-meta";
      meta.textContent = [c.archive, c.country].filter(Boolean).join(" · ");

      btn.appendChild(title);
      btn.appendChild(meta);
      btn.addEventListener("click", function () {
        selectCollection(c.id, { openDrawerOnMobile: true, panTo: true, closeFiltersOnMobile: true });
      });

      li.appendChild(btn);
      els.resultsList.appendChild(li);
    });
  }

  function announceCount(n) {
    var text = n === 1 ? "1 collection shown" : n + " collections shown";
    els.resultsCount.textContent = text;
  }

  // ------------------------------------------------------------------
  // Selection + detail panel
  // ------------------------------------------------------------------

  function selectCollection(id, opts) {
    opts = opts || {};
    var c = collections.find(function (x) {
      return x.id === id;
    });
    if (!c) {
      return;
    }
    selectedId = id;

    // refresh marker highlight + result highlight without a full re-render
    markersById.forEach(function (marker, mid) {
      marker.setIcon(pinIcon(mid === id));
    });
    Array.prototype.forEach.call(
      els.resultsList.querySelectorAll(".result-item"),
      function (btn) {
        if (btn.dataset.id === id) {
          btn.setAttribute("aria-current", "true");
        } else {
          btn.removeAttribute("aria-current");
        }
      }
    );

    renderDetail(c);

    if (opts.panTo !== false && map) {
      map.flyTo([c.lat, c.lng], Math.max(map.getZoom(), 5), { duration: 0.6 });
    }
    // On mobile the bottom sheet is the full detail surface; skip the tiny
    // map popup there so it doesn't peek out from behind the sheet.
    var marker = markersById.get(id);
    if (marker && !narrowMQ().matches) {
      marker.openPopup();
    }

    if (narrowMQ().matches) {
      if (opts.closeFiltersOnMobile) {
        closeDrawer("filters");
      }
      if (opts.openDrawerOnMobile) {
        openDrawer("detail");
      }
    }

    announceSelection(c);
  }

  function clearSelection() {
    selectedId = null;
    markersById.forEach(function (marker) {
      marker.setIcon(pinIcon(false));
    });
    Array.prototype.forEach.call(
      els.resultsList.querySelectorAll(".result-item"),
      function (btn) {
        btn.removeAttribute("aria-current");
      }
    );
    els.detailBody.innerHTML =
      '<p class="detail-placeholder">Select a pin on the map, or an entry from the index, to read about it here.</p>';
  }

  function renderDetail(c) {
    els.detailBody.innerHTML = "";

    var h3 = document.createElement("h3");
    h3.className = "detail-title";
    h3.textContent = c.title;
    els.detailBody.appendChild(h3);

    var archive = document.createElement("p");
    archive.className = "detail-archive";
    archive.textContent = [c.archive, c.country].filter(Boolean).join(" — ");
    els.detailBody.appendChild(archive);

    var dl = document.createElement("dl");

    if (c.languages && c.languages.length) {
      dl.appendChild(detailRow("Languages", c.languages.join(", ")));
    }
    if (c.themes && c.themes.length) {
      var dt = document.createElement("dt");
      dt.textContent = "Themes";
      var dd = document.createElement("dd");
      var ul = document.createElement("ul");
      ul.className = "tag-list";
      c.themes.forEach(function (t) {
        var li = document.createElement("li");
        li.className = "tag";
        li.textContent = t;
        ul.appendChild(li);
      });
      dd.appendChild(ul);
      var row = document.createElement("div");
      row.className = "detail-row";
      row.appendChild(dt);
      row.appendChild(dd);
      dl.appendChild(row);
    }
    dl.appendChild(detailRow("Period", decadeLabel(c)));

    els.detailBody.appendChild(dl);

    if (c.summary) {
      var summary = document.createElement("p");
      summary.className = "detail-summary";
      summary.textContent = c.summary;
      els.detailBody.appendChild(summary);
    }

    if (c.url) {
      var link = document.createElement("a");
      link.className = "detail-link";
      link.href = c.url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "Visit source archive";
      var visually = document.createElement("span");
      visually.className = "visually-hidden";
      visually.textContent = " (opens in a new tab)";
      link.appendChild(visually);
      els.detailBody.appendChild(link);
    }
  }

  function detailRow(label, value) {
    var row = document.createElement("div");
    row.className = "detail-row";
    var dt = document.createElement("dt");
    dt.textContent = label;
    var dd = document.createElement("dd");
    dd.textContent = value;
    row.appendChild(dt);
    row.appendChild(dd);
    return row;
  }

  function announceSelection(c) {
    els.liveRegion.textContent = "Showing details for " + c.title + ".";
  }

  // ------------------------------------------------------------------
  // Drawers (mobile filters + detail panel) with focus management
  // ------------------------------------------------------------------

  function drawerEl(which) {
    return which === "filters" ? els.filtersDrawer : els.detailPanel;
  }

  function toggleEl(which) {
    return which === "filters" ? els.filtersToggle : null;
  }

  function openDrawer(which) {
    if (!narrowMQ().matches) {
      return;
    }
    if (activeDrawer && activeDrawer !== which) {
      closeDrawer(activeDrawer, { restoreFocus: false });
    }
    activeDrawer = which;
    var panel = drawerEl(which);
    lastFocusedBeforeDrawer = document.activeElement;

    panel.classList.add("is-open");
    panel.removeAttribute("inert");
    els.backdrop.hidden = false;

    if (which === "filters") {
      els.filtersToggle.setAttribute("aria-expanded", "true");
    }

    var focusable = getFocusable(panel);
    if (focusable.length) {
      focusable[0].focus();
    }

    document.addEventListener("keydown", onDrawerKeydown, true);
    els.backdrop.addEventListener("click", onBackdropClick);
  }

  function closeDrawer(which, opts) {
    opts = opts || {};
    var panel = drawerEl(which);
    panel.classList.remove("is-open");
    if (narrowMQ().matches) {
      panel.setAttribute("inert", "");
    }

    if (which === "filters") {
      els.filtersToggle.setAttribute("aria-expanded", "false");
    }

    if (activeDrawer === which) {
      activeDrawer = null;
      els.backdrop.hidden = true;
      document.removeEventListener("keydown", onDrawerKeydown, true);
      els.backdrop.removeEventListener("click", onBackdropClick);
    }

    if (opts.restoreFocus !== false && lastFocusedBeforeDrawer) {
      lastFocusedBeforeDrawer.focus();
    }
  }

  function onBackdropClick() {
    if (activeDrawer) {
      closeDrawer(activeDrawer);
    }
  }

  function onDrawerKeydown(evt) {
    if (!activeDrawer) {
      return;
    }
    if (evt.key === "Escape") {
      evt.preventDefault();
      closeDrawer(activeDrawer);
      return;
    }
    if (evt.key === "Tab") {
      var panel = drawerEl(activeDrawer);
      var focusable = getFocusable(panel);
      if (!focusable.length) {
        return;
      }
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (evt.shiftKey && document.activeElement === first) {
        evt.preventDefault();
        last.focus();
      } else if (!evt.shiftKey && document.activeElement === last) {
        evt.preventDefault();
        first.focus();
      }
    }
  }

  function getFocusable(container) {
    var selector =
      'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.prototype.filter.call(
      container.querySelectorAll(selector),
      function (el) {
        return el.offsetParent !== null || el === document.activeElement;
      }
    );
  }

  function syncDrawerStateForViewport() {
    if (narrowMQ().matches) {
      if (!els.filtersDrawer.classList.contains("is-open")) {
        els.filtersDrawer.setAttribute("inert", "");
      }
      if (!els.detailPanel.classList.contains("is-open")) {
        els.detailPanel.setAttribute("inert", "");
      }
    } else {
      els.filtersDrawer.removeAttribute("inert");
      els.detailPanel.removeAttribute("inert");
      els.backdrop.hidden = true;
      activeDrawer = null;
    }
  }

  // ------------------------------------------------------------------
  // Static event bindings
  // ------------------------------------------------------------------

  function bindStaticEvents() {
    [els.countrySelect, els.themeSelect, els.languageSelect, els.decadeSelect].forEach(
      function (select) {
        select.addEventListener("change", renderAll);
      }
    );

    els.filtersReset.addEventListener("click", function () {
      els.filtersForm.reset();
      renderAll();
    });

    els.filtersForm.addEventListener("submit", function (evt) {
      evt.preventDefault();
    });

    els.filtersToggle.addEventListener("click", function () {
      if (activeDrawer === "filters") {
        closeDrawer("filters");
      } else {
        openDrawer("filters");
      }
    });

    els.filtersClose.addEventListener("click", function () {
      closeDrawer("filters");
    });

    els.detailClose.addEventListener("click", function () {
      closeDrawer("detail");
    });

    var mq = narrowMQ();
    var mqHandler = function () {
      syncDrawerStateForViewport();
    };
    if (mq.addEventListener) {
      mq.addEventListener("change", mqHandler);
    } else if (mq.addListener) {
      // Safari < 14
      mq.addListener(mqHandler);
    }
    syncDrawerStateForViewport();
  }
})();
