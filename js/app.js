/**
 * Mapping Voices — app.js
 *
 * Fetches data/collections.json (see DATA_DICTIONARY.md) plus the controlled
 * vocabularies in data/vocab/, and renders:
 *  - a Leaflet map with one accessible, keyboard-focusable pin per collection
 *  - free-text search + country / theme / language / decade / access filters, all
 *    mirrored in the page URL so a filtered view can be shared or cited
 *  - live dataset counts (collections, countries, languages)
 *  - a scrollable text index of the current results (a first-class
 *    alternative to "reading" pins on the map)
 *  - a detail panel with the selected collection's metadata, verification
 *    status, citation, related collections, and source link
 *
 * All UI chrome text (as opposed to the dataset's own content — entry
 * summaries, archive names, themes/languages as authored in the data) is
 * sourced from locales/<code>.json via the tiny i18n helper below, with
 * English as both the default locale and the fallback for any key missing
 * from another locale.
 *
 * No build step, no framework — plain DOM + Leaflet's global `L`.
 */
(function () {
  "use strict";

  var DATA_URL = "data/collections.json";
  var THEMES_URL = "data/vocab/themes.json";
  var LANGUAGES_URL = "data/vocab/languages.json";
  var SEARCH_DEBOUNCE_MS = 150;
  // Query-string keys for the shareable URL state. "c" holds the selected
  // collection's persistent mv_id (MV-000123).
  var URL_KEYS = { q: "q", country: "country", theme: "theme", language: "language", decade: "decade", access: "access", collection: "c" };
  // Display order for the controlled `access` terms (data/vocab/access.json),
  // most to least open. Values not listed here sort after these.
  var ACCESS_ORDER = ["open online", "partial online", "registration required", "on request", "on site only", "restricted"];
  var NARROW_QUERY = "(max-width: 979px)";

  // ------------------------------------------------------------------
  // i18n
  // ------------------------------------------------------------------

  var LOCALES_BASE = "locales/";
  var DEFAULT_LOCALE = "en";
  var SUPPORTED_LOCALES = ["en", "ha", "fr", "ar"];
  var RTL_LOCALES = ["ar"];
  var LOCALE_STORAGE_KEY = "mappingVoices.locale";

  var i18nCache = {}; // locale code -> parsed strings object
  var activeLocale = DEFAULT_LOCALE;
  var activeStrings = null;
  var fallbackStrings = null;

  /** @type {Array<Object>} */
  var collections = [];
  var markersById = new Map();
  var markerLayer = null;
  var map = null;
  var zoomControl = null;
  var selectedId = null;
  var lastFocusedBeforeDrawer = null;
  var activeDrawer = null; // 'filters' | 'detail' | null
  // Controlled vocabularies (optional: the app degrades to flat option
  // lists if they fail to load).
  var themeVocab = null; // { groups: [{id,label}], terms: [{name,group}] }
  var collectiveLanguages = new Set(["Multiple languages"]);
  var searchTimer = null;

  var els = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheEls();
    initI18n().then(function () {
      bindStaticEvents();
      loadData();
    });
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
    els.accessSelect = document.getElementById("filter-access");
    els.resultsList = document.getElementById("results-list");
    els.resultsCount = document.getElementById("results-count");
    els.resultsEmpty = document.getElementById("results-empty");
    els.detailPanel = document.getElementById("detail-panel");
    els.detailClose = document.getElementById("detail-close");
    els.detailBody = document.getElementById("detail-body");
    els.backdrop = document.getElementById("drawer-backdrop");
    els.liveRegion = document.getElementById("live-region");
    els.langSelect = document.getElementById("lang-select");
    els.searchInput = document.getElementById("filter-search");
    els.stats = document.getElementById("dataset-stats");
    els.statCollections = document.getElementById("stat-collections");
    els.statCountries = document.getElementById("stat-countries");
    els.statLanguages = document.getElementById("stat-languages");
  }

  function narrowMQ() {
    return window.matchMedia(NARROW_QUERY);
  }

  // ------------------------------------------------------------------
  // i18n: loading, lookup, and applying strings to the DOM
  // ------------------------------------------------------------------

  function isRtl(code) {
    return RTL_LOCALES.indexOf(code) !== -1;
  }

  function getStoredLocale() {
    try {
      var stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (stored && SUPPORTED_LOCALES.indexOf(stored) !== -1) {
        return stored;
      }
    } catch (e) {
      // localStorage can throw (private browsing, disabled storage, etc.) —
      // fall through to the default locale rather than failing to load.
    }
    return DEFAULT_LOCALE;
  }

  function storeLocale(code) {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, code);
    } catch (e) {
      // Non-fatal: the choice just won't persist across reloads.
    }
  }

  function fetchLocale(code) {
    if (i18nCache[code]) {
      return Promise.resolve(i18nCache[code]);
    }
    return fetch(LOCALES_BASE + code + ".json")
      .then(function (res) {
        if (!res.ok) {
          throw new Error("HTTP " + res.status);
        }
        return res.json();
      })
      .then(function (json) {
        i18nCache[code] = json;
        return json;
      });
  }

  function getByPath(obj, path) {
    if (!obj) {
      return undefined;
    }
    var parts = path.split(".");
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null || typeof cur !== "object") {
        return undefined;
      }
      cur = cur[parts[i]];
    }
    return typeof cur === "string" ? cur : undefined;
  }

  function interpolate(str, vars) {
    if (!vars) {
      return str;
    }
    return str.replace(/\{(\w+)\}/g, function (match, key) {
      return Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match;
    });
  }

  /**
   * Look up a UI-chrome string by dot-path key (e.g. "filters.country") in
   * the active locale, falling back to English (with a console warning) if
   * the key is missing, and finally to the raw key itself if even the
   * fallback is missing — so the app degrades instead of crashing.
   */
  function t(key, vars) {
    var str = getByPath(activeStrings, key);
    if (str === undefined) {
      if (activeLocale !== DEFAULT_LOCALE) {
        console.warn(
          'Mapping Voices i18n: missing key "' + key + '" in locale "' + activeLocale +
            '" — falling back to "' + DEFAULT_LOCALE + '".'
        );
      }
      str = getByPath(fallbackStrings, key);
    }
    if (str === undefined) {
      console.warn('Mapping Voices i18n: missing key "' + key + '" in the fallback locale too.');
      return key;
    }
    return interpolate(str, vars);
  }

  function applyStaticI18n() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n]"), function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n-aria-label]"), function (el) {
      el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria-label")));
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n-placeholder]"), function (el) {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });
  }

  function updateFooterI18n() {
    var p = document.getElementById("footer-text");
    var link = document.getElementById("footer-osm-link");
    if (!p || !link) {
      return;
    }
    link.textContent = t("footer.osmLinkText");
    var template = t("footer.template");
    var parts = template.split("%LINK%");
    p.innerHTML = "";
    p.appendChild(document.createTextNode(parts[0] || ""));
    p.appendChild(link);
    p.appendChild(document.createTextNode(parts[1] || ""));
  }

  function repositionMapControls() {
    if (!map || !zoomControl) {
      return;
    }
    zoomControl.setPosition(isRtl(activeLocale) ? "topright" : "topleft");
  }

  function setLocale(code, strings) {
    activeLocale = code;
    activeStrings = strings;
    document.documentElement.lang = code;
    document.documentElement.dir = isRtl(code) ? "rtl" : "ltr";
    document.title = t("meta.title");
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", t("meta.description"));
    }
    if (els.langSelect) {
      els.langSelect.value = code;
    }
    applyStaticI18n();
    updateFooterI18n();
    repositionMapControls();
  }

  function initI18n() {
    var desired = getStoredLocale();
    return fetchLocale(DEFAULT_LOCALE)
      .then(function (enStrings) {
        fallbackStrings = enStrings;
        if (desired === DEFAULT_LOCALE) {
          setLocale(DEFAULT_LOCALE, enStrings);
          return;
        }
        return fetchLocale(desired)
          .then(function (strings) {
            setLocale(desired, strings);
          })
          .catch(function (err) {
            console.error(
              'Mapping Voices: failed to load locale "' + desired + '", falling back to English.',
              err
            );
            setLocale(DEFAULT_LOCALE, enStrings);
          });
      })
      .catch(function (err) {
        console.error("Mapping Voices: failed to load the default (English) locale strings.", err);
        // Without any strings at all, t() will still warn per-key and return
        // the raw key as a last resort, so the app renders (in key form)
        // rather than throwing.
        fallbackStrings = {};
        setLocale(DEFAULT_LOCALE, {});
      });
  }

  function onLanguageChange(evt) {
    var code = evt.target.value;
    if (SUPPORTED_LOCALES.indexOf(code) === -1) {
      return;
    }
    fetchLocale(code)
      .then(function (strings) {
        setLocale(code, strings);
        storeLocale(code);
        refreshDynamicI18n();
      })
      .catch(function (err) {
        console.error('Mapping Voices: failed to load locale "' + code + '".', err);
        setLocale(DEFAULT_LOCALE, fallbackStrings || {});
        storeLocale(DEFAULT_LOCALE);
        refreshDynamicI18n();
      });
  }

  /** Re-render everything whose text is generated in JS (not just static
   *  [data-i18n] elements) after the active locale changes. */
  function refreshDynamicI18n() {
    var prevFilters = captureFilterValues();
    buildFilterOptions();
    restoreFilterValues(prevFilters);
    renderStats();
    renderAll();

    if (selectedId) {
      var c = collections.find(function (x) {
        return x.id === selectedId;
      });
      if (c) {
        renderDetail(c);
      }
    } else {
      renderDetailPlaceholder();
    }
  }

  // ------------------------------------------------------------------
  // Data loading
  // ------------------------------------------------------------------

  function fetchJson(url) {
    return fetch(url).then(function (res) {
      if (!res.ok) {
        throw new Error("HTTP " + res.status);
      }
      return res.json();
    });
  }

  /** The vocabularies only improve how filter options are grouped, so a
   *  failure to load them is logged and otherwise ignored. */
  function loadVocab() {
    return Promise.all([
      fetchJson(THEMES_URL).catch(function (err) {
        console.warn("Mapping Voices: theme vocabulary unavailable; using a flat theme list.", err);
        return null;
      }),
      fetchJson(LANGUAGES_URL).catch(function (err) {
        console.warn("Mapping Voices: language vocabulary unavailable.", err);
        return null;
      }),
    ]).then(function (results) {
      themeVocab = results[0];
      if (results[1] && Array.isArray(results[1].terms)) {
        results[1].terms.forEach(function (term) {
          if (term.type === "collective") {
            collectiveLanguages.add(term.name);
          }
        });
      }
    });
  }

  function loadData() {
    setMapStatus(t("map.loading"));
    Promise.all([fetchJson(DATA_URL), loadVocab()])
      .then(function (results) {
        var data = results[0];
        if (!Array.isArray(data)) {
          throw new Error("Expected an array of collections.");
        }
        collections = data.filter(isValidCollection);
        clearMapStatus();
        buildMap();
        buildFilterOptions();
        renderStats();
        var selectFromUrl = readUrlState();
        renderAll();
        if (selectFromUrl && isShown(selectFromUrl)) {
          selectCollection(selectFromUrl, { openDrawerOnMobile: true, panTo: true });
        }
        window.addEventListener("popstate", onPopState);
      })
      .catch(function (err) {
        console.error("Mapping Voices: failed to load " + DATA_URL, err);
        setMapStatus(t("map.loadError", { url: DATA_URL }));
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
      zoomControl: false,
    }).setView([15, 10], 2);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Added manually (rather than via the `zoomControl` map option) so its
    // corner can be flipped to top-right for RTL locales — see
    // repositionMapControls().
    zoomControl = L.control.zoom({ position: isRtl(activeLocale) ? "topright" : "topleft" });
    zoomControl.addTo(map);

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

  function formatDecade(n) {
    return t("detail.decadeFormat", { n: n });
  }

  function decadeLabel(c) {
    var start = c.decade_start != null ? formatDecade(c.decade_start) : t("detail.decadeUnknown");
    if (c.decade_end == null) {
      return t("detail.decadeToPresent", { start: start, present: t("detail.decadePresent") });
    }
    if (c.decade_start === c.decade_end) {
      return start;
    }
    return t("detail.decadeRange", { start: start, end: formatDecade(c.decade_end) });
  }

  // Joins the collection's own title/archive/country (dataset content, not
  // UI chrome — left as authored, not run through t()).
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
      pLang.textContent = t("popup.languagesPrefix") + " " + langs;
      wrap.appendChild(pLang);
    }

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "text-button";
    btn.textContent = t("popup.viewDetails");
    btn.addEventListener("click", function () {
      selectCollection(c.id, { openDrawerOnMobile: true, panTo: false });
    });
    wrap.appendChild(btn);

    return wrap;
  }

  function renderMarkers(list) {
    if (!markerLayer) {
      return;
    }
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
          el.setAttribute("aria-label", t("map.markerLabel", { label: accessibleLabel(c) }));
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
    var accessValues = uniqueSorted(collections.map(function (c) {
      return c.access;
    })).sort(function (a, b) {
      var ia = ACCESS_ORDER.indexOf(a);
      var ib = ACCESS_ORDER.indexOf(b);
      return (ia === -1 ? ACCESS_ORDER.length : ia) - (ib === -1 ? ACCESS_ORDER.length : ib);
    });

    fillSelect(els.countrySelect, countries, t("filters.allCountries"));
    fillSelect(els.themeSelect, themes, t("filters.allThemes"), null, themeGroupsFor(themes));
    fillSelect(els.languageSelect, languages, t("filters.allLanguages"), null, languageGroupsFor(languages));
    fillSelect(
      els.decadeSelect,
      decades,
      t("filters.allDecades"),
      function (d) {
        return formatDecade(d);
      }
    );
    fillSelect(els.accessSelect, accessValues, t("filters.allAccess"), accessLabel);
  }

  /** Translated label for a controlled term (e.g. access "open online" ->
   *  accessTerms.open_online), falling back to the term itself — the term
   *  is dataset content, so it is always a meaningful label. */
  function termLabel(prefix, value) {
    var key = prefix + "." + String(value).replace(/[^a-z0-9]+/gi, "_");
    var str = getByPath(activeStrings, key);
    if (str === undefined) {
      str = getByPath(fallbackStrings, key);
    }
    return str === undefined ? String(value) : str;
  }

  function accessLabel(value) {
    return termLabel("accessTerms", value);
  }

  function archiveTypeLabel(value) {
    return termLabel("archiveTypes", value);
  }

  /** "1939–1945", or a single year when the period starts and ends in it. */
  function historicalPeriodLabel(c) {
    var start = c.historical_period_start;
    var end = c.historical_period_end;
    if (typeof start !== "number" && typeof end !== "number") {
      return "";
    }
    if (typeof start !== "number" || typeof end !== "number" || start === end) {
      return String(typeof start === "number" ? start : end);
    }
    return t("detail.yearRange", { start: start, end: end });
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

  /** Themes grouped under the taxonomy's top-level headings, in taxonomy
   *  order. Returns null (flat list) if the vocabulary didn't load. */
  function themeGroupsFor(themes) {
    if (!themeVocab || !Array.isArray(themeVocab.groups) || !Array.isArray(themeVocab.terms)) {
      return null;
    }
    var groupOf = {};
    themeVocab.terms.forEach(function (term) {
      groupOf[term.name] = term.group;
    });
    var groups = themeVocab.groups
      .map(function (g) {
        return {
          label: g.label,
          values: themes.filter(function (name) {
            return groupOf[name] === g.id;
          }),
        };
      })
      .filter(function (g) {
        return g.values.length;
      });
    var ungrouped = themes.filter(function (name) {
      return !groupOf[name];
    });
    if (ungrouped.length) {
      groups.push({ label: "—", values: ungrouped });
    }
    return groups;
  }

  /** Individual languages first, then collective terms ("Multiple
   *  languages", "Mayan languages", …) in their own group. */
  function languageGroupsFor(languages) {
    return [
      {
        label: t("filters.individualLanguages"),
        values: languages.filter(function (l) {
          return !collectiveLanguages.has(l);
        }),
      },
      {
        label: t("filters.languageGroups"),
        values: languages.filter(function (l) {
          return collectiveLanguages.has(l);
        }),
      },
    ].filter(function (g) {
      return g.values.length;
    });
  }

  function fillSelect(select, values, allLabel, labelFn, groups) {
    select.innerHTML = "";
    var allOpt = document.createElement("option");
    allOpt.value = "";
    allOpt.textContent = allLabel;
    select.appendChild(allOpt);
    var makeOption = function (v) {
      var opt = document.createElement("option");
      opt.value = String(v);
      opt.textContent = labelFn ? labelFn(v) : String(v);
      return opt;
    };
    if (groups) {
      groups.forEach(function (g) {
        var optgroup = document.createElement("optgroup");
        optgroup.label = g.label;
        g.values.forEach(function (v) {
          optgroup.appendChild(makeOption(v));
        });
        select.appendChild(optgroup);
      });
      return;
    }
    values.forEach(function (v) {
      select.appendChild(makeOption(v));
    });
  }

  function currentFilters() {
    return {
      q: els.searchInput.value,
      country: els.countrySelect.value,
      theme: els.themeSelect.value,
      language: els.languageSelect.value,
      decade: els.decadeSelect.value ? Number(els.decadeSelect.value) : "",
      access: els.accessSelect.value,
    };
  }

  // Raw <select>.value snapshot (decade kept as a string) so it can be
  // restored verbatim after buildFilterOptions() regenerates the option
  // list with translated labels — the underlying option *values* (country
  // names, theme/language strings, decade numbers) are dataset content and
  // don't change with locale, so a value-based restore just works.
  function captureFilterValues() {
    return {
      country: els.countrySelect.value,
      theme: els.themeSelect.value,
      language: els.languageSelect.value,
      decade: els.decadeSelect.value,
      access: els.accessSelect.value,
    };
  }

  function restoreFilterValues(values) {
    els.countrySelect.value = values.country;
    els.themeSelect.value = values.theme;
    els.languageSelect.value = values.language;
    els.decadeSelect.value = values.decade;
    els.accessSelect.value = values.access;
  }

  /** Lowercase and strip diacritics so "Maori" finds "Māori" and
   *  "cote d'ivoire" finds "Côte d'Ivoire". */
  function fold(str) {
    return String(str)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function searchText(c) {
    if (!c._searchText) {
      c._searchText = fold(
        [
          c.title,
          c.archive,
          c.country,
          c.mv_id,
          (c.languages || []).join(" "),
          c.language_note,
          (c.themes || []).join(" "),
          c.summary,
        ]
          .filter(Boolean)
          .join(" \n ")
      );
    }
    return c._searchText;
  }

  function applyFilters() {
    var f = currentFilters();
    var terms = fold(f.q).split(/\s+/).filter(Boolean);
    return collections.filter(function (c) {
      if (terms.length) {
        var haystack = searchText(c);
        for (var i = 0; i < terms.length; i++) {
          if (haystack.indexOf(terms[i]) === -1) {
            return false;
          }
        }
      }
      if (f.country && c.country !== f.country) {
        return false;
      }
      if (f.theme && (!c.themes || c.themes.indexOf(f.theme) === -1)) {
        return false;
      }
      if (f.language && (!c.languages || c.languages.indexOf(f.language) === -1)) {
        return false;
      }
      if (f.access && c.access !== f.access) {
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
    writeUrlState();
  }

  // ------------------------------------------------------------------
  // Dataset statistics (computed live from the loaded records)
  // ------------------------------------------------------------------

  function renderStats() {
    if (!els.stats || !collections.length) {
      return;
    }
    var countries = new Set();
    var languages = new Set();
    collections.forEach(function (c) {
      countries.add(c.country);
      (c.languages || []).forEach(function (l) {
        if (!collectiveLanguages.has(l)) {
          languages.add(l);
        }
      });
    });
    var nf;
    try {
      nf = new Intl.NumberFormat(activeLocale);
    } catch (e) {
      nf = { format: String };
    }
    els.statCollections.textContent = nf.format(collections.length);
    els.statCountries.textContent = nf.format(countries.size);
    els.statLanguages.textContent = nf.format(languages.size);
    els.stats.hidden = false;
  }

  // ------------------------------------------------------------------
  // URL state: filters, search, and selection live in the query string
  // (e.g. ?country=Niger&language=Hausa&c=MV-000012) so any view can be
  // bookmarked, shared, or cited.
  // ------------------------------------------------------------------

  function findCollection(key) {
    return collections.find(function (x) {
      return x.mv_id === key || x.id === key;
    });
  }

  function setSelectIfPresent(select, value) {
    if (value == null) {
      select.value = "";
      return;
    }
    var exists = Array.prototype.some.call(select.options, function (opt) {
      return opt.value === value;
    });
    select.value = exists ? value : "";
  }

  /** Applies the query string to the form controls. Returns the id of a
   *  collection to select, if the URL names one that exists. */
  function readUrlState() {
    var params = new URLSearchParams(window.location.search);
    els.searchInput.value = params.get(URL_KEYS.q) || "";
    setSelectIfPresent(els.countrySelect, params.get(URL_KEYS.country));
    setSelectIfPresent(els.themeSelect, params.get(URL_KEYS.theme));
    setSelectIfPresent(els.languageSelect, params.get(URL_KEYS.language));
    setSelectIfPresent(els.decadeSelect, params.get(URL_KEYS.decade));
    setSelectIfPresent(els.accessSelect, params.get(URL_KEYS.access));
    var key = params.get(URL_KEYS.collection);
    var c = key ? findCollection(key) : null;
    return c ? c.id : null;
  }

  function writeUrlState() {
    if (!window.history || !window.history.replaceState) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var f = captureFilterValues();
    var set = function (key, value) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    };
    set(URL_KEYS.q, els.searchInput.value.trim());
    set(URL_KEYS.country, f.country);
    set(URL_KEYS.theme, f.theme);
    set(URL_KEYS.language, f.language);
    set(URL_KEYS.decade, f.decade);
    set(URL_KEYS.access, f.access);
    var selected = selectedId ? findCollection(selectedId) : null;
    set(URL_KEYS.collection, selected ? selected.mv_id || selected.id : "");
    var query = params.toString();
    var next = window.location.pathname + (query ? "?" + query : "") + window.location.hash;
    if (next !== window.location.pathname + window.location.search + window.location.hash) {
      window.history.replaceState(null, "", next);
    }
  }

  /** True if the collection passes the current search and filters. */
  function isShown(id) {
    return applyFilters().some(function (c) {
      return c.id === id;
    });
  }

  function onPopState() {
    var id = readUrlState();
    renderAll();
    if (id && isShown(id)) {
      selectCollection(id, { panTo: true });
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

  /**
   * Locale-correct pluralization via the standard Intl.PluralRules API
   * (built into every modern browser, no dependency needed) rather than a
   * hardcoded one/other split — that split is wrong for languages with
   * richer plural systems, most notably Arabic's six categories (zero,
   * one, two, few, many, other), e.g. 3 collections needs a different
   * grammatical form than 11 collections. Falls back to "other" for any
   * category a given locale's strings don't define (English/French/Hausa
   * only need "one"/"other"; only Arabic currently defines all six).
   */
  function announceCount(n) {
    var category;
    try {
      category = new Intl.PluralRules(activeLocale).select(n);
    } catch (e) {
      category = n === 1 ? "one" : "other";
    }
    var key = "results.count." + category;
    if (getByPath(activeStrings, key) === undefined && getByPath(fallbackStrings, key) === undefined) {
      category = "other";
    }
    var text = t("results.count." + category, { n: n });
    els.resultsCount.textContent = text;
  }

  // ------------------------------------------------------------------
  // Selection + detail panel
  // ------------------------------------------------------------------

  function selectCollection(id, opts) {
    opts = opts || {};
    var c = findCollection(id);
    if (!c) {
      return;
    }
    id = c.id;
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
    writeUrlState();

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
    renderDetailPlaceholder();
    writeUrlState();
  }

  function renderDetailPlaceholder() {
    els.detailBody.innerHTML = "";
    var p = document.createElement("p");
    p.className = "detail-placeholder";
    p.setAttribute("data-i18n", "detail.placeholder");
    p.textContent = t("detail.placeholder");
    els.detailBody.appendChild(p);
  }

  function renderDetail(c) {
    els.detailBody.innerHTML = "";

    var h3 = document.createElement("h3");
    h3.className = "detail-title";
    h3.tabIndex = -1; // focus target when moving between related collections
    h3.textContent = c.title;
    els.detailBody.appendChild(h3);

    var archive = document.createElement("p");
    archive.className = "detail-archive";
    archive.textContent = [c.archive, c.country].filter(Boolean).join(" — ");
    els.detailBody.appendChild(archive);

    if (c.verification_status) {
      var badge = document.createElement("p");
      badge.className = "verification-badge is-" + c.verification_status.replace(/_/g, "-");
      badge.textContent = t("verification." + c.verification_status);
      els.detailBody.appendChild(badge);
    }

    if (c.summary) {
      var summary = document.createElement("p");
      summary.className = "detail-summary";
      summary.textContent = c.summary;
      els.detailBody.appendChild(summary);
    }

    var dl = document.createElement("dl");

    if (c.languages && c.languages.length) {
      var langList = document.createElement("ul");
      langList.className = "inline-list";
      c.languages.forEach(function (name) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = "languages.html#" + languageSlug(name);
        a.textContent = name;
        a.title = t("detail.languageExplorer");
        li.appendChild(a);
        langList.appendChild(li);
      });
      dl.appendChild(detailRow(t("detail.languages"), langList));
    }
    if (c.language_note) {
      dl.appendChild(detailRow(t("detail.languageNote"), c.language_note));
    }
    if (c.themes && c.themes.length) {
      var ul = document.createElement("ul");
      ul.className = "tag-list";
      c.themes.forEach(function (tag) {
        var li = document.createElement("li");
        li.className = "tag";
        li.textContent = tag;
        ul.appendChild(li);
      });
      dl.appendChild(detailRow(t("detail.themes"), ul));
    }
    dl.appendChild(detailRow(t("detail.period"), decadeLabel(c)));
    var discussed = historicalPeriodLabel(c);
    if (discussed) {
      dl.appendChild(detailRow(t("detail.periodDiscussed"), discussed));
    }
    if (c.archive_type) {
      dl.appendChild(detailRow(t("detail.archiveType"), archiveTypeLabel(c.archive_type)));
    }
    if (c.access || c.access_notes) {
      var accessBox = document.createElement("div");
      if (c.access) {
        var accessTerm = document.createElement("span");
        accessTerm.className = "access-term";
        accessTerm.textContent = accessLabel(c.access);
        accessBox.appendChild(accessTerm);
      }
      if (c.access_notes) {
        var accessNotes = document.createElement("span");
        accessNotes.className = "access-notes";
        accessNotes.textContent = c.access_notes;
        accessBox.appendChild(accessNotes);
      }
      dl.appendChild(detailRow(t("detail.access"), accessBox));
    }
    if (c.verification_status) {
      var verification = t("verification." + c.verification_status);
      if (c.verification_note) {
        verification += " — " + c.verification_note;
      }
      dl.appendChild(detailRow(t("detail.verification"), verification));
    }
    if (c.mv_id) {
      dl.appendChild(detailRow(t("detail.identifier"), c.mv_id));
    }
    if (c.citation) {
      var cite = document.createElement("cite");
      cite.className = "detail-citation";
      cite.textContent = c.citation;
      dl.appendChild(detailRow(t("detail.citation"), cite));
    }

    var related = (c.related_ids || []).map(findCollection).filter(Boolean);
    if (related.length) {
      var relList = document.createElement("ul");
      relList.className = "related-list";
      related.forEach(function (r) {
        var li = document.createElement("li");
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "text-button";
        btn.textContent = r.title;
        btn.addEventListener("click", function () {
          // A related collection may be outside the current filters; clear
          // them so the map, index, and URL stay consistent with the panel.
          if (!isShown(r.id)) {
            els.filtersForm.reset();
            renderAll();
          }
          selectCollection(r.id, { panTo: true });
          var heading = els.detailBody.querySelector(".detail-title");
          if (heading) {
            heading.focus();
          }
        });
        li.appendChild(btn);
        relList.appendChild(li);
      });
      dl.appendChild(detailRow(t("detail.related"), relList));
    }

    els.detailBody.appendChild(dl);

    if (c.url && /^https?:\/\//i.test(c.url)) {
      var link = document.createElement("a");
      link.className = "detail-link";
      link.href = c.url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = t("detail.visitSource");
      var visually = document.createElement("span");
      visually.className = "visually-hidden";
      visually.textContent = " " + t("detail.opensNewTab");
      link.appendChild(visually);
      els.detailBody.appendChild(link);
    }

    var copy = document.createElement("button");
    copy.type = "button";
    copy.className = "text-button detail-copy";
    copy.textContent = t("detail.copyLink");
    copy.addEventListener("click", function () {
      copyText(window.location.href).then(function () {
        els.liveRegion.textContent = t("detail.copied");
        copy.textContent = t("detail.copied");
        window.setTimeout(function () {
          copy.textContent = t("detail.copyLink");
        }, 2000);
      });
    });
    els.detailBody.appendChild(copy);

    var notice = document.createElement("p");
    notice.className = "detail-notice";
    notice.textContent = t("detail.contentNotice");
    els.detailBody.appendChild(notice);
  }

  /** Must match the anchor ids generated in js/languages.js. */
  function languageSlug(name) {
    return (
      "lang-" +
      fold(name)
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    );
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () {
        return legacyCopy(text);
      });
    }
    return legacyCopy(text);
  }

  function legacyCopy(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "absolute";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand("copy");
    } catch (e) {
      // Nothing else to try; the URL is still in the address bar.
    }
    document.body.removeChild(area);
    return Promise.resolve();
  }

  /** value is either plain text or a DOM node to place inside the <dd>. */
  function detailRow(label, value) {
    var row = document.createElement("div");
    row.className = "detail-row";
    var dt = document.createElement("dt");
    dt.textContent = label;
    var dd = document.createElement("dd");
    if (typeof value === "string") {
      dd.textContent = value;
    } else {
      dd.appendChild(value);
    }
    row.appendChild(dt);
    row.appendChild(dd);
    return row;
  }

  function announceSelection(c) {
    els.liveRegion.textContent = t("detail.selectionAnnounce", { title: c.title });
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
    [els.countrySelect, els.themeSelect, els.languageSelect, els.decadeSelect, els.accessSelect].forEach(
      function (select) {
        select.addEventListener("change", renderAll);
      }
    );

    els.searchInput.addEventListener("input", function () {
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(renderAll, SEARCH_DEBOUNCE_MS);
    });

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

    if (els.langSelect) {
      els.langSelect.addEventListener("change", onLanguageChange);
    }

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
