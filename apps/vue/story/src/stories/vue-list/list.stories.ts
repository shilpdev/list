import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, waitFor, within } from '@storybook/test'
import { createRequestHandler, requestHandler } from '@/api/request-handler'
import { sampleSkills } from '@/types/skill'
import VueListDemo from './vue-list-demo.vue'

const meta = {
  title: 'Vue List/List',
  component: VueListDemo,
  tags: ['autodocs'],
  argTypes: {
    paginationMode: {
      control: 'select',
      options: ['pagination', 'loadMore'],
    },
  },
} satisfies Meta<typeof VueListDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    endpoint: 'skills',
    page: 1,
    perPage: 10,
    paginationMode: 'pagination',
    requestHandler: createRequestHandler({ forceEmpty: false }),
    initialItems: sampleSkills,
    count: sampleSkills.length,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Table structure renders
    await waitFor(() => {
      expect(canvas.getByRole('table')).toBeInTheDocument()
    })

    // Column headers are present
    expect(canvas.getByText('ID')).toBeInTheDocument()
    expect(canvas.getByText('Name')).toBeInTheDocument()
    expect(canvas.getByText('Updated')).toBeInTheDocument()

    // At least one skill row renders
    await waitFor(() => {
      expect(canvas.getByText('Sample Skill')).toBeInTheDocument()
    })

    // Summary shows item count
    await waitFor(() => {
      expect(canvas.getByText(/of \d+/)).toBeInTheDocument()
    })

    // Pagination controls are present
    expect(canvas.getByRole('button', { name: /prev/i })).toBeInTheDocument()
    expect(canvas.getByRole('button', { name: /next/i })).toBeInTheDocument()

    // Search input is present
    expect(canvas.getByPlaceholderText('Search skills...')).toBeInTheDocument()

    // Status filter dropdown is present
    expect(canvas.getByRole('combobox', { name: /status/i })).toBeInTheDocument()
  },
}

export const WithInitialItems: Story = {
  args: {
    endpoint: 'skills',
    page: 1,
    perPage: 10,
    paginationMode: 'pagination',
    initialItems: sampleSkills,
    count: sampleSkills.length,
    requestHandler,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Items render immediately from initialItems — no async fetch needed
    expect(canvas.getByText('Sample Skill')).toBeInTheDocument()
    expect(canvas.getByText('Another Skill')).toBeInTheDocument()
    expect(canvas.getByText('Archived Skill')).toBeInTheDocument()

    // Draft / published / archived statuses display
    expect(canvas.getByText('draft')).toBeInTheDocument()
    expect(canvas.getByText('published')).toBeInTheDocument()
    expect(canvas.getByText('archived')).toBeInTheDocument()
  },
}

export const LoadMore: Story = {
  args: {
    endpoint: 'skills',
    page: 1,
    perPage: 8,
    paginationMode: 'loadMore',
    requestHandler: createRequestHandler({ forceEmpty: false }),
    initialItems: sampleSkills,
    count: sampleSkills.length,
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
    endpoint: 'skills',
    page: 1,
    perPage: 10,
    paginationMode: 'pagination',
    requestHandler: createRequestHandler({ forceEmpty: true }),
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
    endpoint: 'skills',
    page: 1,
    perPage: 10,
    paginationMode: 'pagination',
    requestHandler: createRequestHandler({ shouldFail: true }),
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
