# Vue List

Headless list components for Vue 3: fetching, pagination, search, sorting and filters, with your own markup.

Use it to build data tables, data grids, listing pages, card grids, infinite lists and admin dashboards that load from an API, with server-side pagination, sorting, filtering and search.

[![npm version](https://img.shields.io/npm/v/@shilp.dev/vue-list.svg)](https://www.npmjs.com/package/@shilp.dev/vue-list)
[![downloads](https://img.shields.io/npm/dm/@shilp.dev/vue-list.svg)](https://www.npmjs.com/package/@shilp.dev/vue-list)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@shilp.dev/vue-list)](https://bundlephobia.com/package/@shilp.dev/vue-list)
[![license](https://img.shields.io/npm/l/@shilp.dev/vue-list.svg)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/shilpdev/list?style=social)](https://github.com/shilpdev/list)

Looking for React? Try [`@shilp.dev/react-list`](https://www.npmjs.com/package/@shilp.dev/react-list), which has the same API.

## Visit [Shilp List](https://7span.com/open-source/vue-list/) for docs, guides, API and more!

## Quick Features

- Headless: you write all the markup in scoped slots, and nothing is styled for you
- Works with any backend (REST, GraphQL, anything that returns a promise)
- One shared `requestHandler` for every list in your app
- Refetches automatically when page, page size, search, sort or filters change
- Only the latest response is used, so a slow old request never overwrites a newer one
- Numbered pagination or load more, switched with one prop
- Debounced search
- Filters, sorting and column visibility
- Row selection with select all and a partial (indeterminate) state
- Loading, initial loading, empty and error states
- Saves page, filters and search to `localStorage`, the URL or your API through a `stateManager`
- SSR ready: start from a server-fetched response in Nuxt
- Lifecycle events: `beforePageChange`, `afterPageChange`, `onResponse`, `onError` and more
- Written in TypeScript, with types included
- About 6 kB gzipped, with no dependencies besides Vue

## Install

```bash
npm install @shilp.dev/vue-list
```

Requires Vue 3.5 or newer.

## Contributing

Issues and pull requests are welcome on [GitHub](https://github.com/shilpdev/list).
