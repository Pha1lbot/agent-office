# Branch: ccr-c5d06848-kcl6ga

**Started:** 2026-11-14
**Status:** In progress

## Purpose

A cloud session in Tim's office about moving towards AI roles. Tim (who calls himself a vibe coder and an ideas person) asked how to combine the two into roles he could move into, then asked for the new AI role types to be added to his search, a list of showcase projects, and a one-page write-up of his agent setup (the job scanning, not the CV writing).

## Change log

Newest entries first. Never delete or rewrite old entries.

### 2026-11-15: Add Tim's Claude Code projects to his CV extras; portfolio pages

**What changed**
- `Tim's Job Search/shared/job-search/cv/extra-from-tim.md`: three facts Tim confirmed: the Esports Ops Suite (built with Claude Code at BLAST, tested alongside the Google Sheets with up to 12 freelancers and staff, ready to roll out), the FNCS Seat Tracker plan (planning stage, not used at an event), and the Agent Office job scanner.
- Outside the repo: three private portfolio pages published as claude.ai artifacts and linked to each other: Agent Office Job Scanner (https://claude.ai/artifact/6ZEsBF2h7dJjaXtuCc35zF), Esports Ops Suite (https://claude.ai/artifact/WLzLEg23AVuVtvq7Gvisz4) and FNCS Seat Tracker (https://claude.ai/artifact/Pa4ye8DBtYBu1vCRyDJBa1).

**Why**
Tim asked for five showcase project ideas, a one-pager on his agent setup (only the job scanning), and one-pagers on the projects from his old BLAST work repo, which he uploaded to his Google Drive (folder "Repo").

**Decisions**
- The BLAST files were read from Drive and never copied into this repo, because they are the employer's work and Hal can read everything in this repo. The pages leave out BLAST's data: the real 2027 event calendar in the Mission Control mockup, player photos, Airtable details and travel data.
- The Esports Ops Suite page says "tested alongside the existing sheets", not "used at a live event", because that is what Tim confirmed.
- The facts go under the Head of Esports Operations heading so Wren can use them in CVs and letters.

**How to check it**
Open the three links. Each page's top bar links to the other two. `extra-from-tim.md` has the new lines dated 2026-11-15.

**Open items**
- Tim's ops-home page links to RLCS Ops, BLAST eOps (freelancer availability) and Global Mobility (travel), whose files weren't in the upload. The suite page describes them from that landing page only.
- Tim could add how many hours a week the job scanner saves him.
- `cv-bank.md` and `base-cv.json` aren't updated. These are extras until Tim decides to put them in the CV itself.

### 2026-11-14: Add new AI role types to Tim's search

**What changed**
- `Tim's Job Search/shared/job-search/search.json`: track `ai-learning` renamed "AI operations, enablement and transformation", with 13 more titles (AI Enablement/Adoption/Operations/Transformation Lead, Head of AI Transformation/Adoption/Enablement, Automation Lead, Head of Automation, AI Change Manager, Senior/Lead/Principal AI Consultant) and keywords (ai transformation, ai adoption, generative ai, copilot, llm). Two new tracks: `product-implementation` (priority 8: product, product ops, implementation and solutions roles at event, sport, gaming and workforce tech companies; sector word required) and `business-systems` (priority 9: business systems, internal tools, automation roles; an Airtable, no-code or automation word required; ERP, SAP and IT support excluded). `updated` set to 2026-11-14.
- `Tim's Job Search/shared/job-search/preferences.md`: kind of work 6 reworded to match, 8 and 9 added, "Seven kinds" becomes "Nine kinds".

**Why**
Tim asked to "update my search to add the new AI roles" after I suggested six directions: AI enablement, AI transformation in his sectors, product at event or workforce tech, implementation or solutions consulting, business systems or ops tooling, and fractional AI consulting.

**Decisions**
- Kept Tim's existing order: the new tracks go at 8 and 9, and AI stays 6th. He can reorder or switch any track off in the office's Define my search.
- Directions 1, 2 and 6 went into the existing AI track rather than new tracks, as they share titles and words. Plain "AI Consultant" is still dropped by Scout's level rule (consultant isn't a manager word), so only Senior, Lead or Principal AI Consultant titles are listed.
- Both new tracks require sector or tool words in the advert. Without that, "Product Manager" or "Business Systems Manager" would let in fintech, banking or ERP jobs. "ai" was left out of the product track's words because almost every advert now mentions AI.
- Only Tim's office was changed. Hal's office has its own search and wasn't touched.

**How to check it**
`python3 -m unittest shared/tools/test_scout.py` in `Tim's Job Search` (29 tests pass). Sample titles checked with `scout.judge`: AI Enablement Lead, Head of AI Transformation, Senior Product Manager at an event tech company, Implementation Manager at a rota-software company, Business Systems Manager (Airtable) and Senior AI Consultant all match. Senior Product Manager in payments, Business Systems Manager on SAP, plain AI Consultant and Machine Learning Engineer don't.

**Open items**
- No new company boards were added for event tech or workforce tech firms. `scout.py discover` could find some once Tim names companies.
- Tim may want AI ranked higher than 6th.
