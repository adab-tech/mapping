# Historical periods discussed — mapping for curators

`historical_period_start` / `historical_period_end` record **when the events
the testimony describes took place**, as distinct from `decade_start` /
`decade_end` (when the testimony was recorded). See METHODOLOGY §8.

The values below were **derived mechanically from each record's own
`title` and `summary`** by
[`scripts/migrations/2026-09-28-derived-fields.mjs`](../scripts/migrations/2026-09-28-derived-fields.mjs)
(review-log method `derived`). No source page was opened. They are meant to
be checked, and corrected, by a curator.

## Rules used

1. A value is set only when the collection is **principally about one
   bounded historical event** that the title or summary names.
2. Years come either from the record's own summary (“years stated in
   summary”) or, when the summary names the event without dates, from the
   event's standard, widely cited dates (“standard dates”).
3. A single-year event is recorded with start = end (e.g. 1947–1947 for
   Partition). The years bound the event itself; testimonies often also
   discuss its aftermath, which is not bounded here.
4. Everything else is left blank — most records. Blank means “not
   derived”, not “no historical focus”.

## Mappings applied (40 records)

| Event | Years | Basis for the years | Records — phrase in the record that names the event |
|---|---|---|---|
| Detention at Angel Island Immigration Station | 1910–1940 | years stated in summary | `MV-000106` Immigrant Voices Oral History Collection — “detained at Angel Island between 1910 and 1940” |
| Armenian Genocide | 1915–1923 | standard dates | `MV-000118` Armenian Film Foundation Genocide Testimony Collection — “Armenian Genocide survivors” |
| The Holocaust | 1933–1945 | standard dates | `MV-000045` Survivor Testimonies Collection — “Holocaust”<br>`MV-000057` Holocaust by Bullets Testimony Archive — “during the Holocaust”<br>`MV-000114` Fortunoff Video Archive for Holocaust Testimonies — “Holocaust witnesses and survivors”<br>`MV-000119` Voices of the Holocaust — “oral histories of the Holocaust” |
| World War II | 1939–1945 | standard dates | `MV-000115` Oral History Collection — “World War II veterans”<br>`MV-000167` CegeSoma Oral History Interview Collections — “WWII resistance fighters” |
| Bracero Program | 1942–1964 | standard dates of the programme | `MV-000108` Bracero History Archive — “oral histories of braceros” |
| Japanese American incarceration | 1942–1946 | standard dates (first removals 1942 – last camp closed 1946) | `MV-000003` Densho Digital Repository — “Japanese Americans unjustly incarcerated during World War II” |
| Atomic bombing of Hiroshima | 1945 | year stated in summary | `MV-000015` A-bomb Survivor Testimony Archive — “1945 atomic bombing” |
| Atomic bombing of Nagasaki | 1945 | year stated in summary | `MV-000079` Testimonies of the Atomic Bomb Survivors — “1945 atomic bombing” |
| Battle of Okinawa | 1945 | year stated in summary | `MV-000080` Battle of Okinawa Survivor Testimonies — “Battle of Okinawa” |
| Jeju 4.3 uprising and massacre | 1947–1954 | years stated in summary | `MV-000073` Jeju 4.3 Archives — “1947-54 Jeju uprising and massacre” |
| Partition of India | 1947 | year stated in summary | `MV-000014` The 1947 Partition Archive — “1947 Partition of British India” |
| Apartheid in South Africa | 1948–1994 | standard dates | `MV-000020` SAHA Oral History Collections — “struggle against apartheid” |
| Nakba | 1948 | year stated in summary | `MV-000041` Nakba Survivor Testimonies — “1948 Nakba” |
| White Terror (Taiwan) | 1949–1987 | years stated in summary | `MV-000076` White Terror Oral History Archive — “1949-1987 White Terror” |
| Korean War | 1950–1953 | standard dates | `MV-000075` Korean War Legacy Foundation Interview Archive — “Korean War oral histories” |
| Vietnam War | 1955–1975 | standard dates | `MV-000077` Oral History Project — “Vietnam War” |
| Guatemalan internal armed conflict | 1960–1996 | standard dates (to the 1996 peace accords) | `MV-000172` REMHI — Proyecto Interdiocesano de Recuperación de la Memoria Histórica — “Guatemala's internal armed conflict” |
| The Troubles (Northern Ireland) | 1968–1998 | standard dates (to the 1998 Good Friday Agreement) | `MV-000049` Prisons Memory Archive — “Northern Ireland's Troubles” |
| Solidarity and anti-communist opposition in Poland | 1970–1989 | years stated in summary | `MV-000053` European Solidarity Centre Archive — “from 1970 to 1989” |
| Bangladesh Liberation War | 1971 | year stated in summary | `MV-000078` Liberation War Museum Oral History Archive — “1971 Liberation War” |
| Chilean military dictatorship | 1973–1990 | years stated in summary | `MV-000129` Archivo Oral — “1973-1990 military dictatorship” |
| Civic-military dictatorship of Uruguay | 1973–1985 | standard dates | `MV-000179` Archivo Oral de la Memoria — “Uruguay's civil-military dictatorship” |
| Indonesian occupation of East Timor | 1974–1999 | years stated in summary | `MV-000130` Chega! CAVR Truth Commission Testimonies — “1974-1999 Indonesian occupation” |
| Khmer Rouge regime | 1975–1979 | standard dates (also stated in MV-000016) | `MV-000016` Documentation Center of Cambodia Oral History Project — “Khmer Rouge regime (1975-1979)”<br>`MV-000126` Khmer Legacies — “Khmer Rouge survivors” |
| Lebanese Civil War | 1975–1990 | years stated in summary | `MV-000042` UMAM Documentation & Research — “1975-1990 Lebanese Civil War” |
| Argentine military dictatorship | 1976–1983 | years stated in summary | `MV-000009` Archivo Oral de Memoria Abierta — “1976-1983 military dictatorship” |
| Internal armed conflict in Peru | 1980–2000 | years stated in summary | `MV-000128` Centro de Documentación e Investigación (CVR Testimonies) — “1980-2000 internal armed conflict” |
| Salvadoran Civil War | 1980–1992 | years stated in summary | `MV-000127` Museo de la Palabra y la Imagen — “1980-1992 civil war” |
| Bosnian War | 1992–1995 | standard dates (also stated in MV-000056) | `MV-000056` Ordinary Heroes Digital Archive — “1992-95 Bosnian War”<br>`MV-000206` War Childhood Museum — “lived through the Bosnian war” |
| Genocide against the Tutsi in Rwanda | 1994 | year stated in summary | `MV-000022` Genocide Archive of Rwanda — “1994 genocide against the Tutsi” |
| September 11 attacks | 2001 | date stated in summary | `MV-000116` Oral Histories — “September 11, 2001 attacks” |
| Hurricanes Katrina and Rita | 2005 | standard date | `MV-000117` Hurricane Digital Memory Bank — “Hurricanes Katrina and Rita” |
| Great East Japan Earthquake and tsunami | 2011 | year stated in summary | `MV-000081` Michinoku Shinrokuden — “2011 Great East Japan Earthquake and tsunami” |
| 2015 Baltimore protests | 2015 | year stated in summary | `MV-000203` Preserve the Baltimore Uprising — “2015 Baltimore protests” |

## Considered and left blank

These records name historical events, but not one bounded event that the
collection is principally about, so no period was derived. A curator with
the source in hand may set one.

| Record | Why left blank |
|---|---|
| `MV-000002` Veterans History Project | Covers wars from World War I to the present. |
| `MV-000004` Visual History Archive | The Holocaust *and* later genocides (Rwanda, Armenia, Cambodia, Nanjing). |
| `MV-000008` Human Rights and Historical Memory Virtual Archive | Colombia's armed conflict is described as “decades-long”, without dates. |
| `MV-000013` Memory of Nations | Several regimes across the 20th century. |
| `MV-000017` Palestinian Oral History Archive | Pre-1948 Palestine *and* subsequent displacement. |
| `MV-000021` District Six Museum Sound Archive | Memories of the community as well as its destruction under apartheid. |
| `MV-000033` Oral History Programme (Zimbabwe) | Two separate events (First and Second Chimurenga). |
| `MV-000036` 858: An Archive of Resistance | Footage span not stated. |
| `MV-000040` Documentation of War-Affected Communities | Conflict with the Lord's Resistance Army; no dates in the record. |
| `MV-000046` Iranian Oral History Project | “1920s through the 1980s” — a span of history, not one event. |
| `MV-000048` IWM Sound Archive | “Conflicts since 1914”. |
| `MV-000050` AJR Refugee Voices | Whole life stories of refugees, not only the Nazi period. |
| `MV-000055` Blinken OSA Archivum | “Cold War-era”, no bounded event. |
| `MV-000068` Citizens Archive of Pakistan | Began with Partition but expanded to broader narratives. |
| `MV-000072`, `MV-000074` “Comfort women” testimonies | The wartime system is named, but the record gives no dates. |
| `MV-000111` Viet Stories | Life stories: prewar Vietnam, the war, and resettlement. |
| `MV-000121` JANM oral histories | Japanese American history generally, as well as incarceration. |
| `MV-000138` HART | Flight *after* the 2021 takeover; ongoing. |
| `MV-000147` Mozambique oral history | The independence war *and* rural life. |
| `MV-000180` Narrativas Orales (Nicaragua) | The Somoza dictatorship *and* the insurrection. |
| `MV-000209` Slave Narratives | Slavery in the United States has no bounded start in the record. |
