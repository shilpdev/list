import type { ReactNode } from 'react'
import type { ColumnScope } from '@shared'
import { getColumnScope } from '@shared/utils'
import { useListContext } from '../context/list-context'
import { Slot } from './slot'
import { ListColumnsProps } from '../types'

export const ListColumns = ({ children, ...columnSlots }: ListColumnsProps) => {
  const context = useListContext()
  const { columns, setColumn } = context

  // `children` is the whole control; each column is a nested slot named after it.
  return (
    <Slot
      className="shilp-list__columns"
      scope={{ context, setColumn }}
      children={children}
      fallback={() => {
        return columns.map((column) => {
          return (
            <Slot
              key={column.name}
              scope={getColumnScope(column, context)}
              children={columnSlots[column.name] as ((scope: ColumnScope) => ReactNode) | undefined}
              fallback={() => (
                <label>
                  <span>{column.label ?? column.name}</span>
                  <input
                    type="checkbox"
                    checked={column.visibility}
                    onChange={(e) => setColumn(column.name, 'visibility', e.target.checked)}
                  />
                </label>
              )}
            />
          )
        })
      }}
    />
  )
}
