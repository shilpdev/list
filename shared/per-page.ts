/** Single option in the per-page selector. */
export interface PerPageOption {
  value: number
  label: string | number
}

/** Options for the per-page selector component. */
export interface PerPageComponentOptions {
  options?: Array<number | PerPageOption>
}

/** Scope for per-page slot. */
export interface PerPageScope {
  perPage: number
  setPerPage: (perPage: number) => void
  options: PerPageOption[]
}
