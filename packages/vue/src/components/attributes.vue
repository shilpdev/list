<template>
  <div class="vue-list__attributes">
    <slot name="default" v-bind="scope">
      <template v-for="(attr, index) in scope.attrs" :key="`attr-${index}`">
        <slot :attr="attr" :updateAttr="scope.updateAttr">
          <label>
            <span>{{ attr.label }}</span>
            <input
              type="checkbox"
              :checked="scope.attrSettings?.[attr.name]?.visible"
              @change="
                scope.updateAttr(
                  attr.name,
                  'visible',
                  ($event.target as HTMLInputElement).checked,
                )
              "
            />
          </label>
        </slot>
      </template>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AttributesScope, ListAttribute } from '@shilp.dev/list-types'
import { useListContext } from '../composables/use-list-context'

defineOptions({
  name: 'ListAttributes',
})

const { listState } = useListContext()

const scope = computed((): AttributesScope => {
  const state = listState.value

  return {
    attrs: state.attrs as ListAttribute[],
    attrSettings: state.attrSettings ?? {},
    updateAttr: state.updateAttr ?? (() => {}),
  }
})
</script>
