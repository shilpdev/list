import type { Meta, StoryObj } from '@storybook/react-vite'
import { createRequestHandler, requestHandler } from '@/api/request-handler'
import { sampleSkills } from '@/types/skill'
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
    endpoint: 'skills',
    page: 1,
    perPage: 10,
    paginationMode: 'pagination',
    requestHandler,
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
}

export const LoadMore: Story = {
  args: {
    endpoint: 'skills',
    page: 1,
    perPage: 8,
    paginationMode: 'loadMore',
    requestHandler,
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
}

export const ErrorState: Story = {
  args: {
    endpoint: 'skills',
    page: 1,
    perPage: 10,
    paginationMode: 'pagination',
    requestHandler: createRequestHandler({ shouldFail: true }),
  },
}
