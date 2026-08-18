import type { Meta, StoryObj } from '@storybook/react-vite'
import { createMockRequestHandler } from '@/mocks/mock-request-handler'
import { mockItems } from '@/mocks/mock-items'
import { ReactListDemo } from './react-list-demo'

const meta = {
  title: 'React List/List',
  component: ReactListDemo,
  tags: ['autodocs'],
  argTypes: {
    paginationMode: {
      control: 'select',
      options: ['pagination', 'loadMore'],
    },
  },
} satisfies Meta<typeof ReactListDemo>

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
