# Tailwind CSS

Style the frontend with Tailwind CSS.

## Setup

Always use Tailwind CSS 4 or above, unless asked otherwise.

- **POC or snippets:** use the CDN version instead of pulling in a build pipeline.
- **Frontend frameworks:** set up the proper build pipeline.

## Classes and Spacing

1. Always use Tailwind's native classes and spacing scale instead of writing custom value classes (e.g. `p-4`, not `p-[17px]`).
2. When following a provided UI, adjust the classes to the closest Tailwind value instead of inventing a custom value class.
3. Write UI and animation classes from Tailwind CSS as close as possible.

## Colors

1. Create `primary` and `secondary` color variants and assign Tailwind's default color values to them, instead of building the UI directly with color names (e.g. use `bg-primary-500`, not `bg-blue-500`).
