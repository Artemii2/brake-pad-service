import axios from "axios";
import {
  MOCK_BRAKE_WEAR_CART,
  MOCK_SERVICES,
  type BrakePadService,
  type BrakeWearCart,
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
  addToDraft: (brakePadId: number) => `/api/brake-pad-wear/add/${brakePadId}`,
};

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "";

/** Для услуг и корзины используем axios без codegen по ТЗ. */
export const servicesAxios = axios.create({
  baseURL,
});

servicesAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

function normalizeCart(raw: BrakePadCartJSON): BrakeWearCart {
  const itemsCount = toNumber(
    raw.itemsCount ?? raw.items_count ?? raw.brake_pads_count,
    MOCK_BRAKE_WEAR_CART.brakePadsCount,
  );

  const draftId = toNumber(raw.draftId ?? raw.draft_id ?? raw.id, MOCK_BRAKE_WEAR_CART.id ?? 0);
  return {
    id: draftId > 0 ? draftId : undefined,
    hasDraft: Boolean(raw.hasDraft ?? raw.has_draft ?? itemsCount > 0),
    brakePadsCount: itemsCount,
  };
}

export function serviceClipDescription(service: BrakePadService): string {
  return service.shortDescriptionEn.trim() || `${service.title}. ${service.description}`;
}

export async function listServices(filters?: ServiceListFilters): Promise<BrakePadService[]> {
  try {
    const res = await servicesAxios.get(API_ROUTES.services, {
      params: filters?.title?.trim() ? { title: filters.title.trim() } : undefined,
      headers: { Accept: "application/json" },
      withCredentials: false,
    });
    const data = normalizeServiceList(res.data);
    return data.length > 0 ? data : filterMockServicesByTitle(filters?.title);
  } catch {
    return filterMockServicesByTitle(filters?.title);
  }
}

export async function getService(id: number): Promise<BrakePadService | null> {
  try {
    const res = await servicesAxios.get(API_ROUTES.service(id), {
      headers: { Accept: "application/json" },
      withCredentials: false,
    });
    return normalizeService(res.data as BrakePadServiceJSON, id);
  } catch {
    return MOCK_SERVICES.find((service) => service.id === id) ?? null;
  }
}

export async function getBrakeWearCart(): Promise<BrakeWearCart> {
  try {
    const res = await servicesAxios.get(API_ROUTES.cart, {
      headers: { Accept: "application/json" },
      withCredentials: false,
    });
    return normalizeCart(res.data as BrakePadCartJSON);
  } catch {
    return { ...MOCK_BRAKE_WEAR_CART };
  }
}

export async function addBrakePadToDraft(brakePadId: number): Promise<void> {
  await servicesAxios.post(API_ROUTES.addToDraft(brakePadId), null, {
    headers: { Accept: "application/json" },
    withCredentials: false,
  });
}
