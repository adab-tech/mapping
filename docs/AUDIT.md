# Mapping Voices — dataset audit & expansion pass

Run against `data/collections.json` at commit state of `adab-tech/mapping@main`
(191 entries, 118 countries). Output: **210 entries, 120 countries**.

Every check below was run in code; the numbers are computed, not estimated.

---

## 1. What was added

**19 new entries**, each one carrying a real holding institution, a real
official URL, and a pin verified to fall inside its stated country.

Two countries appear on the map for the first time: **Eswatini** and the
**Cook Islands**.

### How they were found, and what was thrown away

| stage | count |
|---|---|
| Wikipedia pages harvested (archive/oral-history/sound-archive categories + list articles) | 2,397 |
| passed the oral-history content filter (text must evidence recordings of people speaking/singing) | 157 |
| not already in the dataset | 153 |
| judged in scope on the article text | 91 |
| had **both** an official URL and coordinates | 36 |
| survived duplicate + country-consistency + scope review | **19** |

The drop from 91 to 19 is the honesty rule doing its job. 49 in-scope
institutions had no official website recorded anywhere I could verify, and a
link to a Wikipedia article is a secondary write-up, not the archive's own
page — so they were not added. A further 7 were rejected on review: general
film/sound archives with no evidenced oral-history holding (British Library
Sound Archive, Australia's NFSA, Marr Sound Archives, American Radio
Archives), a scholarly society rather than a collection (Society for
Ethnomusicology), and one whose URL pointed at an institution in the wrong
country entirely (Iranian Oral History Project).

### Provenance, and the one thing you should check

Each new entry has a row in `new-entries-provenance.json` recording its
Wikidata QID, its Wikipedia source, the sentence that justified the scope
call, and where the URL came from (`wikidata:P856` or the Wikipedia infobox).

**Two caveats, stated plainly:**

1. **Link liveness is unverified.** This sandbox cannot reach arbitrary
   institutional domains, so no new URL was actually requested. Your weekly
   `check-links.mjs` job is the right place to catch any that are dead — run
   it before merging.
2. **`languages` is inferred, not sourced, on all 19.** No source article
   stated the recording language outright. Each value is the language the
   collection is overwhelmingly likely to be in given country and subject
   (a US university oral-history programme → English). `languages_sourced`
   is `false` for every new entry in the provenance file. This is the field
   most worth a human eye.

---

## 2. What was already correct

**Coordinates are clean.** Every one of the 191 original pins falls inside
its stated country, tested by point-in-polygon against Natural Earth 1:10m
boundaries. Four sit 0.2–2.0 km offshore (Angel Island, Solomon Islands
National Museum, Denmark's Folklore Archives, Mozambique's Arquivo
Histórico) — coastline-simplification artifacts, not data errors. **No entry
is mis-pinned.**

Also clean: all 191 `url` values unique and well-formed; no duplicate `id`s;
no `related_ids` pointing at a nonexistent entry; no `decade_end` preceding
its `decade_start`.

---

## 3. What was repaired

| problem | scale | fix |
|---|---|---|
| `related_ids` asymmetric — A links to B, B doesn't link back, so the cross-link shows on one side only | 44 of 164 links | back-links added; now 0 one-way |
| Theme filter fragmented by letter case — `"Indigenous history"` and `"indigenous history"` are two separate filter options | 15 entries | normalised to lowercase |

---

## 4. What still needs a decision

These are judgement calls, so they are reported rather than changed.

**The language filter is fragmenting.** 26 distinct free-text tags
begin "multiple…" — `"multiple Kenyan languages"`, `"multiple ni-Vanuatu
languages"`, `"multiple Papua New Guinean languages"` and so on. Each is a
filter option matching exactly one entry, which makes the language filter
progressively less usable as the dataset grows. A `language_note` string
field alongside a controlled `languages` array would fix this without
losing the detail.

**16 entries use `http://` rather than `https://`** — listed in
`audit-findings.csv`. Several are national institutions where the https
variant very likely works.

**Optional-field coverage is thin**: `access_notes` on 56/210 (27%),
`preview_url` on 5/210 (3%), and 94 entries have no `related_ids` at all.
None of these can be filled without reading each archive's own page, so
they are contribution work, not scripting work.

---

## 5. Where the map is still blank

**115 of 203 sovereign countries have at least one entry; 88 have none** —
about 0.62 billion people, 8% of world population, live in a country with no
collection on the map.

By region, ranked by population living in an uncovered country:

| region | countries covered | uncovered population |
|---|---|---|
| Africa | 28 / 55 | 221 M |
| Asia | 30 / 48 | 178 M |
| Europe | 31 / 48 | 164 M |
| Americas | 17 / 38 | 54 M |
| Oceania | 8 / 14 | 0.5 M |

**Russia has no entry at all** — the single largest gap, and a surprising
one given six Russian-language collections are already on the map (they sit
in the Baltics, Ukraine and Kazakhstan). After Russia: Tanzania, Myanmar,
Yemen, North Korea, Burkina Faso, Malawi, Zambia, Ecuador.

Burkina Faso is worth singling out given this project's Sahel focus — 20 M
people, directly adjacent to the Niger/Mali/Senegal cluster the dataset
already does well, and currently blank.

Full ranked list in `gap-countries.csv`.

---

## 6. Leads for the next pass

`review-queue.csv` holds **72 institutions** that passed the oral-history
scope filter but could not be completed automatically:

- 22 need only coordinates
- 12 need only an official URL
- 21 need both
- 17 were rejected on review, with the reason recorded

Each row carries the Wikipedia and Wikidata source, the evidence sentence,
and a draft summary. These are research leads with the scope question
already settled — the remaining work is finding the archive's own page,
which is exactly the task the contribution issue form is designed for.
