export type BrakePadService = {
  id: number;
  title: string;
  description: string;
  padType: string;
  publishedAt: string;
  imageUrl: string;
  shortDescriptionEn: string;
  videoUrl?: string;
};

export type BrakeWearCart = {
  hasDraft: boolean;
  brakePadsCount: number;
  id?: number;
};

export type BrakeWearStatus = "draft" | "formed" | "completed" | "rejected" | "deleted";

export type BrakeWear = {
  id: number;
  status: BrakeWearStatus;
  createdAt: string;
  creatorLogin: string;
  moderatorLogin?: string | null;
  formingDate?: string | null;
  finishDate?: string | null;
  description?: string | null;
  completedItemCount: number;
};

export type BrakePadWearLine = {
  brakeWearId: number;
  brakePadId: number;
  count: number;
  pricePerItem: number;
  estimatedWearPercent: number | null;
  brakePad: BrakePadService;
};

export type BrakeWearDetail = {
  brakeWear: BrakeWear;
  brakePads: BrakePadWearLine[];
};

export const MOCK_SERVICES: BrakePadService[] = [
  {
    id: 1,
    title: "Керамические тормозные колодки",
    description: "Стабильное торможение, минимальный шум и пыль.",
    padType: "Керамические",
    publishedAt: "2026-03-01",
    imageUrl: "/mock/card-2.svg",
    shortDescriptionEn: "Premium ceramic brake pads for quiet city driving and low dust wheels.",
    videoUrl: "/mock/ceramic.mp4",
  },
  {
    id: 2,
    title: "Органические тормозные колодки",
    description: "Мягкая работа и комфорт в городском режиме.",
    padType: "Органические",
    publishedAt: "2026-02-15",
    imageUrl: "/mock/card-1.svg",
    shortDescriptionEn: "Soft organic brake pads for smooth urban stops and comfortable daily use.",
  },
  {
    id: 3,
    title: "Полуметаллические тормозные колодки",
    description: "Подходят для активной езды и высоких нагрузок.",
    padType: "Полуметаллические",
    publishedAt: "2026-01-28",
    imageUrl: "/mock/card-3.svg",
    shortDescriptionEn: "Semi metallic brake pads for active driving, heat resistance, and heavy loads.",
  },
  {
    id: 4,
    title: "Усиленные колодки для SUV",
    description: "Повышенный ресурс для тяжёлых автомобилей.",
    padType: "Усиленные",
    publishedAt: "2026-03-21",
    imageUrl: "/mock/card-4.svg",
    shortDescriptionEn: "Heavy duty SUV brake pads with long service life for large vehicles.",
  },
];

export const MOCK_BRAKE_WEAR_CART: BrakeWearCart = {
  hasDraft: true,
  brakePadsCount: 2,
  id: 11,
};

export function filterMockServicesByTitle(titleRaw?: string): BrakePadService[] {
  const title = titleRaw?.trim().toLowerCase() ?? "";
  if (!title) return MOCK_SERVICES;
  return MOCK_SERVICES.filter((service) => service.title.toLowerCase().includes(title));
}

export const MOCK_BRAKE_WEARS: BrakeWear[] = [
  {
    id: 11,
    status: "draft",
    createdAt: "2026-05-12T08:20:00Z",
    creatorLogin: "demo_user",
    moderatorLogin: null,
    formingDate: null,
    finishDate: null,
    description: "Черновик по проверке ресурса тормозных колодок",
    completedItemCount: 0,
  },
  {
    id: 12,
    status: "formed",
    createdAt: new Date().toISOString(),
    creatorLogin: "admin",
    moderatorLogin: null,
    formingDate: new Date().toISOString(),
    finishDate: null,
    description: "Сформированная заявка за сегодня",
    completedItemCount: 1,
  },
  {
    id: 13,
    status: "completed",
    createdAt: new Date().toISOString(),
    creatorLogin: "admin",
    moderatorLogin: "admin",
    formingDate: new Date().toISOString(),
    finishDate: new Date().toISOString(),
    description: "Завершенная заявка",
    completedItemCount: 1,
  },
];

export const MOCK_BRAKE_WEAR_DETAIL: BrakeWearDetail = {
  brakeWear: MOCK_BRAKE_WEARS[0],
  brakePads: [
    {
      brakeWearId: 11,
      brakePadId: 1,
      count: 2,
      pricePerItem: 5200,
      estimatedWearPercent: 34.5,
      brakePad: MOCK_SERVICES[0],
    },
    {
      brakeWearId: 11,
      brakePadId: 3,
      count: 1,
      pricePerItem: 4100,
      estimatedWearPercent: 47.2,
      brakePad: MOCK_SERVICES[2],
    },
  ],
};

export function cloneBrakeWearDetail(detail: BrakeWearDetail): BrakeWearDetail {
  return {
    brakeWear: { ...detail.brakeWear },
    brakePads: detail.brakePads.map((line) => ({
      ...line,
      brakePad: { ...line.brakePad },
    })),
  };
}

export function fallbackImageUrl(): string {
  return (
    "data:image/svg+xml," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="220" viewBox="0 0 400 220"><rect width="100%" height="100%" fill="#e9ecef"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6c757d" font-family="sans-serif" font-size="16">Нет изображения</text></svg>',
    )
  );
}

const MINIO_PUBLIC_BASE =
  (import.meta.env.VITE_MINIO_PUBLIC_BASE?.replace(/\/$/, "") as string | undefined) ??
  "http://localhost:9000/test";

export function resolveMediaUrl(key: string): string {
  if (!key?.trim()) return fallbackImageUrl();
  if (
    key.startsWith("http://") ||
    key.startsWith("https://") ||
    key.startsWith("/") ||
    key.startsWith("blob:") ||
    key.startsWith("data:")
  ) {
    return key;
  }
  return `${MINIO_PUBLIC_BASE}/${key.replace(/^\//, "")}`;
}

export const BRAKE_WEAR_CART_UPDATED_EVENT = "brake-wear-cart-updated";

export function notifyBrakeWearCartUpdated() {
  window.dispatchEvent(new CustomEvent(BRAKE_WEAR_CART_UPDATED_EVENT));
}

export function subscribeBrakeWearCart(handler: () => void) {
  const listener = () => handler();
  window.addEventListener(BRAKE_WEAR_CART_UPDATED_EVENT, listener);
  return () => {
    window.removeEventListener(BRAKE_WEAR_CART_UPDATED_EVENT, listener);
  };
}
