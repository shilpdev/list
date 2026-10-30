# JavaScript

## Null and Undefined Checks

1. **No overly defensive null/undefined checks.** Trust generated types and return types.
   - Handle a missing value once, at the boundary where it can really happen (e.g. a 404 guard after a lookup).
   - Don't add redundant `?.`, `?? fallback` or `v-if` downstream.
   - Genuinely optional fields still get `v-if`.

## Reusable Functions

1. If the same logic is used more than 2 times, write a function with the required arguments and import it at all the instances.

## NPM Packages

1. Instead of writing all the logic from scratch, try to use popular npm packages like `lodash`, `date-fns`, `dayjs`, etc. Don't reinvent the wheel. Ask for specific instructions when required.
2. Always prefer tree-shakable npm packages to keep the bundle size minimal.

## Readable Code

1. Write readable code instead of fitting it in a one-liner. Readability and maintainability are preferred over shorter code.
