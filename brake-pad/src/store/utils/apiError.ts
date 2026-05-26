export function apiErrMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: unknown; status?: number } }).response;
    const data = response?.data;
    if (typeof data === "string" && data.trim()) return data;
    if (data && typeof data === "object" && "message" in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) return message;
    }
    if (response?.status === 404) {
      return "API не найден (404). Запустите бэкенд rip2026 на http://localhost:8080 и проверьте VITE_PROXY_TARGET в .env.";
    }
    if (typeof response?.status === "number") return `Ошибка API: ${response.status}`;
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Не удалось выполнить запрос";
}
