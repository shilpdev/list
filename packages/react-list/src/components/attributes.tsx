import { memo, useCallback, useMemo, type ReactNode } from "react";
import type {
  AttributesScope,
  ListAttribute,
  RenderAttributeArgs,
} from "@7span/list-types";
import { useListContext } from "../context/list-context";

type ListAttributesProps = {
  children?: ReactNode | ((scope: AttributesScope) => ReactNode);
  renderAttribute?: (args: RenderAttributeArgs) => ReactNode;
};

export const ListAttributes = memo(
  ({ children, renderAttribute }: ListAttributesProps) => {
    const { listState } = useListContext();
    const { attrs, attrSettings, updateAttr } = listState;

    const normalizedAttrs = attrs as ListAttribute[];

    const handleAttrChange = useCallback(
      (attrName: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        updateAttr?.(attrName, "visible", e.target.checked);
      },
      [updateAttr]
    );

    const scope = useMemo(
      (): AttributesScope => ({
        attrs: normalizedAttrs,
        attrSettings: attrSettings ?? {},
        updateAttr: updateAttr ?? (() => {}),
      }),
      [normalizedAttrs, attrSettings, updateAttr]
    );

    if (typeof children === "function") {
      return children(scope);
    }

    if (children) {
      return children;
    }

    return (
      <div className="react-list-attributes">
        {normalizedAttrs.map((attr, index) => {
          if (renderAttribute) {
            return renderAttribute({
              key: `attr-${index}`,
              attr,
              updateAttr: updateAttr ?? (() => {}),
              attrSettings: attrSettings ?? {},
            });
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
          );
        })}
      </div>
    );
  }
);
