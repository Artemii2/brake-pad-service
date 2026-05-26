export const ROUTES = {
  SERVICES: "/",
  SERVICE_DETAILS: "/brake-pad/:id",
  BRAKE_WEAR: "/brake-wear/:id",
  BRAKE_WEARS: "/brake-wears",
  SIGN_IN: "/signin",
  SIGN_UP: "/signup",
  PROFILE: "/profile",
  ABOUT: "/about",
} as const;

export type RouteKeyType = keyof typeof ROUTES;

export const ROUTE_LABELS: { [key in RouteKeyType]: string } = {
  SERVICES: "Каталог",
  SERVICE_DETAILS: "Карточка колодок",
  BRAKE_WEAR: "Корзина",
  BRAKE_WEARS: "Заявки",
  SIGN_IN: "Вход",
  SIGN_UP: "Регистрация",
  PROFILE: "Личный кабинет",
  ABOUT: "О проекте",
};
