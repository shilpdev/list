/** Read `page` from the current URL query string. */
export function getPageFromUrl(): number | null {
  if (typeof window === "undefined") return null;

  const raw = new URLSearchParams(window.location.search).get("page");
  if (raw == null || raw === "") return null;

  const page = Number(raw);
  return Number.isFinite(page) ? page : null;
}

/** Write `page` into the URL query, preserving other params (History API). */
export function updatePageInUrl(page: number | string): void {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  const next = String(page);

  if (url.searchParams.get("page") === next) return;

  url.searchParams.set("page", next);
  window.history.pushState({}, "", url);
}
