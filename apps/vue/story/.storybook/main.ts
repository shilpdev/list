import type { StorybookConfig } from '@storybook/vue3-vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mergeConfig } from 'vite'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-vitest',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
  ],
  framework: '@storybook/vue3-vite',
  async viteFinal(config) {
    return mergeConfig(config, {
      base: '/vue-list-story/',
      resolve: {
        alias: {
          '@': path.resolve(dirname, '../src'),
        },
      },
    })
  },
}

export default config
