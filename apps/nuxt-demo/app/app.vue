<script setup lang="ts">
/*
 * Layout shared by every page: header (navigation + links), page content and footer.
 * Only Nuxt UI components are used. UApp is required by Nuxt UI for overlays and tooltips.
 */
const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Products', to: '/products' },
  { label: 'Users', to: '/users' },
]
</script>

<template>
  <UApp>
    <UHeader title="Shilp List Demo">
      <UNavigationMenu :items="navItems" />

      <template #right>
        <UColorModeButton />
        <UButton
          to="https://github.com/shilpdev/list"
          target="_blank"
          icon="i-simple-icons-github"
          color="neutral"
          variant="ghost"
          label="GitHub"
        />
        <UButton
          to="https://7span.com/open-source/vue-list/"
          target="_blank"
          icon="i-lucide-book-open"
          color="neutral"
          variant="ghost"
          label="Docs"
        />
      </template>
    </UHeader>

    <UMain>
      <UContainer class="py-8">
        <NuxtPage />
      </UContainer>
    </UMain>

    <USeparator />

    <UFooter>
      <template #left>
        <p class="text-sm text-muted">
          <strong>@shilp.dev/vue-list</strong> - headless list component for Vue and Nuxt: fetch,
          paginate, search, filter and show or hide columns. You own the UI.
        </p>
      </template>
      <template #right>
        <UButton
          to="https://www.npmjs.com/package/@shilp.dev/vue-list"
          target="_blank"
          icon="i-simple-icons-npm"
          color="neutral"
          variant="ghost"
          aria-label="npm"
        />
      </template>
    </UFooter>
  </UApp>
</template>
