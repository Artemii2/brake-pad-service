import {
  MOCK_CART,
  MOCK_SERVICES,
  type BrakePadCart,
  type BrakePadService,
  filterMockServicesByTitle,
} from "./mock";

type BrakePadServiceJSON = {
  ID?: number;
  id?: number;
  brake_pad_id?: number;
  service_id?: number;
  Title?: string;
  title?: string;
  name?: string;
  Description?: string;
  description?: string;
  PadType?: string;
  pad_type?: string;
  padType?: string;
  CreatedAt?: string;
  published_at?: string;
  publishedAt?: string;
  ImageURL?: string;
  image_url?: string;
  imageUrl?: string;
  photo_url?: string;
  VideoURL?: string;
  video_url?: string;
  videoUrl?: string;
  video?: string;
  ShortDescriptionEn?: string;
  short_description_en?: string;
  shortDescriptionEn?: string;
};

type BrakePadCartJSON = {
  draft_id?: number;
  draftId?: number;
  id?: number;
  has_draft?: boolean;
  hasDraft?: boolean;
  items_count?: number;
  itemsCount?: number;
  brake_pads_count?: number;
};

export type ServiceListFilters = {
  title?: string;
};

const API_ROUTES = {
  services: "/api/brake-pad",
  service: (id: number) => `/api/brake-pad/${id}`,
  cart: "/api/brake-wear/cart",
};

/** Публичные GET: без cookie (same-origin иначе могут уехать лишние сессии и сломать анонимный доступ). */
const PUBLIC_GET_INIT: RequestInit = {
  headers: { Accept: "application/json" },
  credentials: "omit",
};

function toNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeService(raw: BrakePadServiceJSON, fallbackId: number): BrakePadService {
  const id = toNumber(raw.id ?? raw.ID ?? raw.brake_pad_id ?? raw.service_id, fallbackId);
  const mock = MOCK_SERVICES.find((service) => service.id === id);
  const shortDescriptionEn = normalizeShortDescriptionEn(
    raw.shortDescriptionEn ?? raw.ShortDescriptionEn ?? raw.short_description_en,
    mock?.shortDescriptionEn,
  );

  return {
    id,
    title: raw.title ?? raw.Title ?? raw.name ?? mock?.title ?? `Тормозные колодки ${id}`,
    description: raw.description ?? raw.Description ?? mock?.description ?? "Описание услуги пока не заполнено.",
    padType: raw.padType ?? raw.PadType ?? raw.pad_type ?? mock?.padType ?? "Тормозные колодки",
    publishedAt: raw.publishedAt ?? raw.published_at ?? raw.CreatedAt ?? mock?.publishedAt ?? "",
    imageUrl: raw.imageUrl ?? raw.ImageURL ?? raw.image_url ?? raw.photo_url ?? mock?.imageUrl ?? "",
    videoUrl: raw.videoUrl ?? raw.VideoURL ?? raw.video_url ?? raw.video ?? mock?.videoUrl,
    shortDescriptionEn,
  };
}

const SHORT_DESCRIPTION_EN_FALLBACK = "Reliable brake pad component card with balanced stopping power and low noise.";

function normalizeShortDescriptionEn(raw: string | undefined, mockValue: string | undefined): string {
  const candidate = raw?.trim() ?? "";
  if (isValidEnglishShortDescription(candidate)) return candidate;

  const mockCandidate = mockValue?.trim() ?? "";
  if (isValidEnglishShortDescription(mockCandidate)) return mockCandidate;

  return SHORT_DESCRIPTION_EN_FALLBACK;
}

function isValidEnglishShortDescription(value: string): boolean {
  if (value.length < 50 || value.length > 100) return false;
  return /^[A-Za-z0-9 ,.'-]+$/.test(value);
}

function normalizeServiceList(raw: unknown): BrakePadService[] {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { items?: unknown[] })?.items)
      ? (raw as { items: unknown[] }).items
      : Array.isArray((raw as { data?: unknown[] })?.data)
        ? (raw as { data: unknown[] }).data
        : [];

  return list.map((item, index) => normalizeService(item as BrakePadServiceJSON, index + 1));
}

function normalizeCart(raw: BrakePadCartJSON): BrakePadCart {
  const itemsCount = toNumber(raw.itemsCount ?? raw.items_count ?? raw.brake_pads_count, MOCK_CART.itemsCount);

  return {
    draftId: toNumber(raw.draftId ?? raw.draft_id ?? raw.id, MOCK_CART.draftId),
    hasDraft: Boolean(raw.hasDraft ?? raw.has_draft ?? itemsCount > 0),
    itemsCount,
  };
}

export function serviceClipDescription(service: BrakePadService): string {
  return service.shortDescriptionEn.trim() || `${service.title}. ${service.description}`;
}

export async function listServices(filters?: ServiceListFilters): Promise<BrakePadService[]> {
  try {
    const q = new URLSearchParams();
    if (filters?.title?.trim()) q.append("title", filters.title.trim());

    const path = q.size > 0 ? `${API_ROUTES.services}?${q.toString()}` : API_ROUTES.services;
    const res = await fetch(path, PUBLIC_GET_INIT);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = normalizeServiceList(await res.json());
    return data.length > 0 ? data : filterMockServicesByTitle(filters?.title);
  } catch {
    return filterMockServicesByTitle(filters?.title);
  }
}

export async function getService(id: number): Promise<BrakePadService | null> {
  try {
    const res = await fetch(API_ROUTES.service(id), PUBLIC_GET_INIT);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return normalizeService((await res.json()) as BrakePadServiceJSON, id);
  } catch {
    return MOCK_SERVICES.find((service) => service.id === id) ?? null;
  }
}

export async function getCartIcon(): Promise<BrakePadCart> {
  try {
    const res = await fetch(API_ROUTES.cart, PUBLIC_GET_INIT);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return normalizeCart((await res.json()) as BrakePadCartJSON);
  } catch {
    return { ...MOCK_CART };
  }
}
