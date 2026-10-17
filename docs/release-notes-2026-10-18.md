# A3 fixes and submission preparation

This update combines the existing team's admin search and sorting commits with
the local API, validation and timezone fixes. Existing commit history is preserved.

## Changes

- A dedicated admin event-detail route includes suspended events without exposing
  them through the public detail route.
- MySQL sessions, date editing, public display and weather-date lookup consistently
  use Brisbane time. Unchanged edit values preserve seconds.
- Create and update validate actual calendar dates, start/end order, text limits,
  monetary ranges, coordinate bounds and organisation/category identifiers.
- Empty coordinates remain null; zero coordinates remain valid values.
- Public search excludes past and suspended events; closed registration pages do
  not show an open registration flow.
- Weather requests explicitly request 16 forecast days.
- Both frontends default to same-origin APIs for independent student deployments.
- The admin fundraising column reads Raised / Goal, with zero amounts shown as $0.
- Setup documentation and Xiang Hu's individual report reflect the current routes.

## Validation

The 22-case regression suite checks the API with database test doubles, date round
trips in three host timezones, validation, duplicate registration and deletion rules.
All 22 cases passed on 2026-10-18 (Asia/Shanghai), and both frontend production
builds passed before packaging. The admin build uses base href `/admin/`.

Read-only checks on 24832203 confirmed working home/search/detail/registration/admin
pages, the suspended edit form, 10 registrations, sorted registration records and
weather. Empty registration and create forms were rejected. These checks do not
claim that production database create/update/delete operations were exercised.

## Deployment reminder

This repository update does not deploy cPanel automatically. Both students should
deploy the final API and frontend builds to their own accounts. At the last check,
24832407 still served the older suspended-event detail implementation. Keep each
account's existing database credentials and data; do not re-import seed data just
to deploy a code update.
