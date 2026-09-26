You are refreshing the Hawaiʻi Permits data set in this repo. Read CLAUDE.md, CONTRIBUTING.md, and reports/stale.md first.

Goal: bring the oldest or most time sensitive entries back in line with their official sources, without inventing anything.

Do this:
1. Run `npm run stale` and `npm run links`. Work through, in order: broken links, then places with `status: closed`, `restricted`, or `seasonal` (closures change often), then the oldest `last_verified` dates. Stop after about 60 entries or 90 minutes so the pull request stays reviewable.
2. For each entry, open the official URLs in its `sources`. Use web search only to find the current official page when a link is broken. Never use review or listing sites as a source.
3. Update `status`, `fees`, `booking`, `rules`, `max_stay_nights`, and `permits_required` only when the official page clearly says so. If a fee or rule is no longer visible, set it to `see_source` or remove the optional field. Keep proper ʻokina and kahakō. No em dashes.
4. Set `last_verified` to today and `verified_by: ai_research` on every entry you checked, even if nothing changed.
5. Run `npm run validate` and `npm test`. Fix any errors you caused.
6. Write a short summary of every change to `reports/refresh-summary.md`: entry, what changed, source URL. List entries you could not verify because the site was down or rate limited.
7. Do not push. The workflow opens the pull request from your working tree.
