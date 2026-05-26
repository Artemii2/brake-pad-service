import { Api } from "./Api";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export const api = new Api({
  baseURL,
});

api.instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.instance.interceptors.response.use(
  (response) => {
    const data = response.data as { token?: unknown } | undefined;
    if (data?.token) {
      localStorage.setItem("token", String(data.token));
    }
    return response;
  },
  (error) => Promise.reject(error),
);
