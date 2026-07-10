/** Column/attribute definition used by the attributes UI. */
export interface ListAttribute {
  name: string;
  label?: string;
}

/** Per-attribute settings keyed by attribute name. */
export interface AttributeSetting {
  visible?: boolean;
  [key: string]: unknown;
}

export type AttrSettings = Record<string, AttributeSetting>;

/** Updates a single attribute setting value. */
export type UpdateAttrFn = (
  attrName: string,
  settingKey: string,
  value: boolean | unknown
) => void;

/** Arguments passed to a custom attribute renderer. */
export interface RenderAttributeArgs {
  key: string;
  attr: ListAttribute;
  updateAttr: UpdateAttrFn;
  attrSettings: AttrSettings;
}
