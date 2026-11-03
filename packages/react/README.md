# React List

Headless list components for React: fetching, pagination, search, sorting and filters, with your own markup.

Use it to build data tables, data grids, listing pages, card grids, infinite lists and admin dashboards that load from an API, with server-side pagination, sorting, filtering and search.

[![npm version](https://img.shields.io/npm/v/@shilp.dev/react-list.svg)](https://www.npmjs.com/package/@shilp.dev/react-list)
[![downloads](https://img.shields.io/npm/dm/@shilp.dev/react-list.svg)](https://www.npmjs.com/package/@shilp.dev/react-list)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@shilp.dev/react-list)](https://bundlephobia.com/package/@shilp.dev/react-list)
[![license](https://img.shields.io/npm/l/@shilp.dev/react-list.svg)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/shilpdev/list?style=social)](https://github.com/shilpdev/list)

Looking for Vue? Try [`@shilp.dev/vue-list`](https://www.npmjs.com/package/@shilp.dev/vue-list), which has the same API.

## Visit [Shilp List](https://7span.com/open-source/react-list/) for docs, guides, API and more!

## Quick Features

- Headless: you write all the markup with render props, and nothing is styled for you
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
- SSR ready: start from a server-fetched response in Next.js
- Lifecycle events: `beforePageChange`, `afterPageChange`, `onResponse`, `onError` and more
- Written in TypeScript, with types included
- About 5 kB gzipped, with no dependencies besides React

## Install

```bash
npm install @shilp.dev/react-list
```

Requires React 19 or newer.

## Contributing

Issues and pull requests are welcome on [GitHub](https://github.com/shilpdev/list).
