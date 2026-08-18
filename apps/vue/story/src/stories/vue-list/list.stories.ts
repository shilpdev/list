import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { createMockRequestHandler } from '@/mocks/mock-request-handler'
import { mockItems } from '@/mocks/mock-items'
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
    endpoint: 'items',
    page: 1,
    perPage: 10,
    paginationMode: 'pagination',
    requestHandler: createMockRequestHandler(),
  },
}

export const WithInitialItems: Story = {
  args: {
    endpoint: 'items',
    page: 1,
    perPage: 10,
    paginationMode: 'pagination',
    initialItems: mockItems.slice(0, 5),
    count: mockItems.length,
    requestHandler: createMockRequestHandler(),
  },
}

export const LoadMore: Story = {
  args: {
    endpoint: 'items',
    page: 1,
    perPage: 8,
    paginationMode: 'loadMore',
    requestHandler: createMockRequestHandler(),
  },
}

export const Empty: Story = {
  args: {
    endpoint: 'items',
    page: 1,
    perPage: 10,
    paginationMode: 'pagination',
    requestHandler: createMockRequestHandler({ items: [] }),
  },
}

export const ErrorState: Story = {
  args: {
    endpoint: 'items',
    page: 1,
    perPage: 10,
    paginationMode: 'pagination',
    requestHandler: createMockRequestHandler({ shouldFail: true }),
  },
}
