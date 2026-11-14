# Branch: ccr-c5d06848-kcl6ga

**Started:** 2026-11-14
**Status:** In progress

## Purpose

A cloud session in Tim's office about moving towards AI roles. Tim (who calls himself a vibe coder and an ideas person) asked how to combine the two into roles he could move into, then asked for the new AI role types to be added to his search, a list of showcase projects, and a one-page write-up of his agent setup (the job scanning, not the CV writing).

## Change log

Newest entries first. Never delete or rewrite old entries.

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
