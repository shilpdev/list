<script setup lang="ts">
defineOptions({
  name: 'story-app',
})
</script>

<template>
  <main class="story-app">
    <h1>Vue List Storybook</h1>
    <p>Run <code>pnpm storybook</code> to browse component stories.</p>
  </main>
</template>

<style scoped>
.story-app {
  min-height: 100vh;
  display: grid;
  place-content: center;
  gap: 8px;
  padding: 24px;
  text-align: center;
}
</style>
