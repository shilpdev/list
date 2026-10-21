# List parity: React vs Vue

| Priority | Difference | React | Vue |
| --- | --- | --- | --- |
| Low | `setPage(page)` with the page already shown | Refetches that page | Does nothing: Vue starts requests from a watcher on the local page, search, sort and per-page values, so an unchanged value does not fire it. Use `refresh` to refetch |

Remove a row once it is fixed, and add one when a new difference shows up.
