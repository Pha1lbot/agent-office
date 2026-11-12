# Where the search looks

Rewritten on 2026-11-11. The machine-readable list is `search.json` (the `sources` and `watch` parts); this page says the same in plain English and lists the alerts Tim needs to set up. The search checks every site below at least once a week, and the office's Sources panel (Leads) shows when each was last reached and what it found.

## How each source is read

| Source | How | Who |
|---|---|---|
| Hitmarker | Its job list (sitemap) and each job's own details, filtered free | Ada's script (Scout), no tokens |
| Company hiring pages (Greenhouse, Lever, Ashby, SmartRecruiters) for the watch list below | Their public job feeds, filtered free | Scout |
| Reed, Adzuna | Free APIs; need keys in `shared/job-search/.env` on Tim's PC | Scout, on Tim's PC |
| LinkedIn Jobs, Indeed UK | They block automated reading, so Tim's own **job-alert emails** are read instead | Hal, each weekday |
| Esports Insider, Event Industry Jobs, Work in Sports, Guardian Jobs, The Unit List, Access Jobs | Read as web pages, a couple each day in turn | Rita |

Sites that need a login or block automated reading may not work. The search says so, per site, rather than guessing.

## Employers to watch directly

- **Esports organisers:** ESL FACEIT Group, Riot Games, Epic Games, Hexagon World Series, Vitality, Team Liquid, Fnatic, Cloud9, Gen.G
- **Game publishers and platforms:** EA, Ubisoft, Activision Blizzard, Take-Two, Supercell, Roblox, Twitch, Discord
- **Sport and live entertainment:** Premier League, Chelsea FC, Formula 1, Live Nation, AEG, Wimbledon
- **AI and tech (learning and support roles):** Anthropic, Google, Microsoft, OpenAI, Meta

Skip BLAST roles: it is Tim's last employer.

## Alerts for Tim to set up

LinkedIn and Indeed block automated reading, so their own alert emails are the way in. Create each alert on the site, set it to **daily**, UK, and send it to the email address Hal reads (the Outlook account connected to Hal).

| Alert search | Track |
|---|---|
| "Head of Esports Operations" | Esports and gaming |
| "Tournament Operations" manager OR director | Esports and gaming |
| "Head of Live Operations" OR "Esports Programme Manager" | Esports and gaming |
| "Event Director" OR "Head of Events" | Live events |
| "Head of Event Operations" OR "Production Manager" live events | Live events |
| "Head of Operations" sport OR club OR league OR venue | Sports and venues |
| "Head of Operations" OR "Director of Operations" scale-up | Scale-ups |
| "Freelancer operations" OR "Workforce operations" OR "Resource planning manager" | Freelancer and workforce |
| "AI programme manager" OR "AI enablement" OR "AI adoption" | AI learning and support |
| "Senior Project Manager" OR "Programme Manager" OR "Head of PMO" with esports, gaming, events, sport or AI | Project and programme management |

Add the pay filter £50,000+ where the site has one, and "Remote" or "Hybrid" for London and Surrey.
