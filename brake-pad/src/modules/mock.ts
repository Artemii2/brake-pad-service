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

export type BrakePadCart = {
  draftId: number;
  hasDraft: boolean;
  itemsCount: number;
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

export const MOCK_CART: BrakePadCart = {
  draftId: 11,
  hasDraft: true,
  itemsCount: 2,
};

export function filterMockServicesByTitle(titleRaw?: string): BrakePadService[] {
  const title = titleRaw?.trim().toLowerCase() ?? "";
  if (!title) return MOCK_SERVICES;
  return MOCK_SERVICES.filter((service) => service.title.toLowerCase().includes(title));
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
