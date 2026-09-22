/** Column/attribute definition used by the attributes UI. */
export interface ListAttribute {
  name: string;
  label?: string;
}

/** Primitive or object-like value that can be stored per attribute setting. */
export type AttributeSettingValue =
  | boolean
  | string
  | number
  | null
  | undefined
  | Record<string, unknown>
  | unknown[];

/** Per-attribute settings keyed by attribute name. */
export interface AttributeSetting {
  visible?: boolean;
  [key: string]: AttributeSettingValue | undefined;
}

export type AttrSettings = Record<string, AttributeSetting>;

/** Updates a single attribute setting value. */
export type UpdateAttrFn = (
  attrName: string,
  settingKey: string,
  value: AttributeSettingValue
) => void;

/** Arguments passed to a custom attribute renderer. */
export interface RenderAttributeArgs {
  key: string;
  attr: ListAttribute;
  updateAttr: UpdateAttrFn;
  attrSettings: AttrSettings;
}
