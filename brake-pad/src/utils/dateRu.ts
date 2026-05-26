/** ISO yyyy-mm-dd из локальной даты. */
export function todayIso(): string {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** dd.mm.yyyy → yyyy-mm-dd или null при ошибке. */
export function ruDateToIso(value: string): string | null {
  const trimmed = value.trim();
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(trimmed);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  const probe = new Date(year, month - 1, day);
  if (
    probe.getFullYear() !== year ||
    probe.getMonth() !== month - 1 ||
    probe.getDate() !== day
  ) {
    return null;
  }
  return `${yyyy}-${mm}-${dd}`;
}

/** yyyy-mm-dd → dd.mm.yyyy */
export function isoDateToRu(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return iso;
  const [, yyyy, mm, dd] = m;
  return `${dd}.${mm}.${yyyy}`;
}

export function todayRu(): string {
  return isoDateToRu(todayIso());
}

export function formatDateTimeRu(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateRu(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ru-RU");
}
