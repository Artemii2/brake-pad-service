import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "/api";

/** Для авторизации/регистрации используем отдельный axios-клиент без codegen. */
export const authAxios = axios.create({
  baseURL,
});

authAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

authAxios.interceptors.response.use(
  (response) => {
    const data = response.data as { token?: unknown } | undefined;
    if (data?.token) {
      localStorage.setItem("token", String(data.token));
    }
    return response;
  },
  (error) => Promise.reject(error),
);

export interface SignInRequest {
  login: string;
  password: string;
}

export interface SignUpRequest {
  login: string;
  password: string;
}

export async function authLoginRequest(credentials: SignInRequest) {
  return authAxios.post<{ token?: string }>("/users/login", credentials);
}

export async function authRegisterRequest(user: SignUpRequest) {
  return authAxios.post("/users/register", user);
}

export async function authLogoutRequest() {
  return authAxios.post("/users/logout", null, { validateStatus: (s) => s === 204 || s < 300 });
}
