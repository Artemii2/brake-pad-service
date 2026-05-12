import { useEffect } from "react";
import { getCartIcon } from "../modules/servicesApi";

export default function CartIconLab() {
  useEffect(() => {
    void getCartIcon();
  }, []);

  return (
    <div className="catalog-cart-row">
      <span className="cart-icon-lab" title="Иконка корзины через GET /api/brake-wear/cart (без авторизации)">
        🧺
      </span>
    </div>
  );
}
