import { useMemo } from "react";
import { Breadcrumb } from "react-bootstrap";
import { Link, matchPath, useLocation } from "react-router-dom";
import { MOCK_SERVICES } from "../modules/mock";
import { ROUTES } from "../routes";

export default function Breadcrumbs() {
  const { pathname } = useLocation();

  const parts = useMemo(() => {
    const detail = matchPath(ROUTES.SERVICE_DETAILS, pathname);
    const wearDetail = matchPath(ROUTES.BRAKE_WEAR, pathname);
    if (pathname === "/") return [{ label: "Каталог", to: undefined }];
    if (pathname === ROUTES.ABOUT) return [{ label: "Каталог", to: "/" }, { label: "О проекте" }];
    if (pathname === ROUTES.BRAKE_WEARS) return [{ label: "Каталог", to: "/" }, { label: "Заявки" }];
    if (pathname === ROUTES.SIGN_IN) return [{ label: "Каталог", to: "/" }, { label: "Вход" }];
    if (pathname === ROUTES.SIGN_UP) return [{ label: "Каталог", to: "/" }, { label: "Регистрация" }];
    if (pathname === ROUTES.PROFILE) return [{ label: "Каталог", to: "/" }, { label: "Личный кабинет" }];
    if (detail?.params.id) {
      const id = Number(detail.params.id);
      const title = MOCK_SERVICES.find((x) => x.id === id)?.title ?? `Услуга ${id}`;
      return [{ label: "Каталог", to: "/" }, { label: title }];
    }
    if (wearDetail?.params.id) {
      const id = Number(wearDetail.params.id);
      return [{ label: "Каталог", to: "/" }, { label: "Заявки", to: ROUTES.BRAKE_WEARS }, { label: `Заявка #${id}` }];
    }
    return [{ label: "Каталог", to: "/" }, { label: "Страница" }];
  }, [pathname]);

  return (
    <Breadcrumb className="app-breadcrumbs">
      {parts.map((p, idx) => (
        <Breadcrumb.Item
          key={`${p.label}-${idx}`}
          active={idx === parts.length - 1}
          linkAs={p.to ? Link : "span"}
          linkProps={p.to ? { to: p.to } : undefined}
        >
          {p.label}
        </Breadcrumb.Item>
      ))}
    </Breadcrumb>
  );
}
