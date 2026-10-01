import { memo, useCallback, useMemo, type ReactNode } from 'react'
import type { AttributesScope, ListAttribute, RenderAttributeArgs } from '../../../../shared'
import { useListContext } from '../context/list-context'

type ListAttributesProps = {
  children?: ReactNode | ((scope: AttributesScope) => ReactNode)
  attribute?: (args: RenderAttributeArgs) => ReactNode
}

export const ListAttributes = memo(({ children, attribute: attributeFn }: ListAttributesProps) => {
  const { listState } = useListContext()
  const { attrs, attrSettings, updateAttr } = listState

  const normalizedAttrs = attrs as ListAttribute[]

  const handleAttrChange = useCallback(
    (attrName: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      updateAttr?.(attrName, 'visible', e.target.checked)
    },
    [updateAttr],
  )

  const scope = useMemo(
    (): AttributesScope => ({
      attrs: normalizedAttrs,
      attrSettings: attrSettings ?? {},
      updateAttr: updateAttr ?? (() => {}),
    }),
    [normalizedAttrs, attrSettings, updateAttr],
  )

  return (
    <div className="react-list__attributes">
      {typeof children === 'function'
        ? children(scope)
        : children
          ? children
          : normalizedAttrs.map((attr, index) => {
              if (attributeFn) {
                return attributeFn({
                  key: `attr-${index}`,
                  attr,
                  updateAttr: updateAttr ?? (() => {}),
                  attrSettings: attrSettings ?? {},
                })
              }

              return (
                <label key={`attr-${index}`}>
                  <span>{attr.label}</span>
                  <input
                    type="checkbox"
                    checked={attrSettings?.[attr.name]?.visible ?? true}
                    onChange={handleAttrChange(attr.name)}
                  />
                </label>
              )
            })}
    </div>
  )
})
