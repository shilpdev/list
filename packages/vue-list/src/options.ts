import type { VueListPluginOptions } from '@7span/list-types'

const defaultOptions: VueListPluginOptions = {
  componentPrefix: '',
  requestHandler() {
    return Promise.resolve({
      items: [],
      count: 0,
    })
  },
  stateManager: {
    set() {},
    get() {
      return null
    },
    init() {},
  },
}

export default defaultOptions
