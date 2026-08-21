import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, waitFor, within } from '@storybook/test'
import VueListDemo from './vue-list-demo.vue'

/**
 * Sample JSON for the `requestHandler` control:
 * `{ "forceEmpty": false, "shouldFail": false }`
 *
 * - `forceEmpty: true` returns an empty list
 * - `shouldFail: true` throws and shows the error state
 */
const sampleRequestHandler = {
  forceEmpty: false,
  shouldFail: false,
}

const meta = {
  title: 'Vue List/List',
  component: VueListDemo,
  tags: ['autodocs'],
  args: {
    endpoint: 'skills',
    page: 1,
    perPage: 10,
    paginationMode: 'pagination',
    requestHandler: sampleRequestHandler,
  },
  argTypes: {
    endpoint: {
      control: 'text',
      description: 'API collection to fetch.',
    },
    page: {
      control: { type: 'number', min: 1 },
      description: 'Initial page. Changing this remounts the list.',
    },
    perPage: {
      control: 'select',
      options: [8, 10, 15, 25, 50, 100],
      description: 'Items fetched per page.',
    },
    paginationMode: {
      control: 'select',
      options: ['pagination', 'loadMore'],
      description: 'Switch between numbered pages and load-more.',
    },
    count: {
      control: { type: 'number', min: 0 },
      description: 'Initial count shown before the first response.',
    },
    requestHandler: {
      control: 'object',
      description:
        'Demo request-handler options (JSON). Sample: `{ "forceEmpty": false, "shouldFail": false }`.',
    },
  },
} satisfies Meta<typeof VueListDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Wait for data to load and table + rows to appear
    await waitFor(() => {
      expect(canvas.getByRole('table')).toBeInTheDocument()
      expect(canvas.getAllByRole('row').length).toBeGreaterThan(1)
    }, { timeout: 15000 })

    // Column headers are present
    expect(canvas.getByText('ID')).toBeInTheDocument()
    expect(canvas.getByText('Name')).toBeInTheDocument()
    expect(canvas.getByText('Updated')).toBeInTheDocument()

    // Summary shows item count
    await waitFor(() => {
      expect(canvas.getByText(/of \d+/)).toBeInTheDocument()
    }, { timeout: 5000 })

    // Pagination controls are present
    expect(canvas.getByRole('button', { name: /prev/i })).toBeInTheDocument()
    expect(canvas.getByRole('button', { name: /next/i })).toBeInTheDocument()

    // Search input is present
    expect(canvas.getByPlaceholderText('Search skills...')).toBeInTheDocument()

    // Status filter dropdown is present
    expect(canvas.getByRole('combobox', { name: /status/i })).toBeInTheDocument()
  },
}

export const LoadMore: Story = {
  args: {
    perPage: 8,
    paginationMode: 'loadMore',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Load-more button is rendered instead of pagination
    await waitFor(() => {
      const btn = canvas.queryByRole('button', { name: /load more|all loaded/i })
      expect(btn).toBeInTheDocument()
    })

    // No pagination Prev/Next buttons in loadMore mode
    expect(canvas.queryByRole('button', { name: /^prev$/i })).not.toBeInTheDocument()
    expect(canvas.queryByRole('button', { name: /^next$/i })).not.toBeInTheDocument()
  },
}

export const Empty: Story = {
  args: {
    requestHandler: { forceEmpty: true, shouldFail: false },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await waitFor(() => {
      expect(canvas.getByText('No skills found.')).toBeInTheDocument()
    })

    // Ensure empty state doesn't render any skill rows
    expect(canvas.queryByText('Sample Skill')).not.toBeInTheDocument()
  },
}

export const ErrorState: Story = {
  args: {
    requestHandler: { forceEmpty: false, shouldFail: true },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await waitFor(() => {
      expect(canvas.getByText('Failed to load list data.')).toBeInTheDocument()
    })

    // "Try again" retry button is present
    const retryBtn = canvas.getByRole('button', { name: /try again/i })
    expect(retryBtn).toBeInTheDocument()
  },
}
