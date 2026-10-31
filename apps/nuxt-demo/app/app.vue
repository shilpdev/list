<script setup lang="ts">
/*
 * Layout shared by every page: header (navigation + links) and page content.
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
    <UHeader title="Shilp List - Vue Demo">
      <UNavigationMenu :items="navItems" />

      <template #right>
        <UColorModeButton />
        <UButton
          to="https://github.com/shilpdev/list"
          target="_blank"
          icon="i-mdi-github"
          color="neutral"
          variant="ghost"
          label="GitHub"
        />
        <UButton
          to="https://7span.com/open-source/vue-list/"
          target="_blank"
          icon="i-mdi-book-open-page-variant-outline"
          color="neutral"
          variant="ghost"
          label="Docs"
        />
        <UButton
          to="https://www.npmjs.com/package/@shilp.dev/vue-list"
          target="_blank"
          icon="i-mdi-npm"
          color="neutral"
          variant="ghost"
          aria-label="npm"
        />
      </template>
    </UHeader>

    <UMain>
      <UContainer class="py-8">
        <NuxtPage />
      </UContainer>
    </UMain>
  </UApp>
</template>
