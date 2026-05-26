import { useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { subscribeBrakeWearCart } from "../modules/mock";
import { getBrakeWearCart } from "../modules/servicesApi";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setCart, setCartLoading } from "../store/slices/brakeWearApplicationSlice";

export default function CartIconLab() {
  const dispatch = useAppDispatch();
  const cart = useAppSelector((s) => s.brakeWearApplication.cart);

  const syncCart = useCallback(async () => {
    dispatch(setCartLoading(true));
    try {
      const data = await getBrakeWearCart();
      dispatch(setCart(data));
    } catch {
      dispatch(setCart(null));
    }
  }, [dispatch]);

  useEffect(() => {
    void syncCart();
    const unsubscribe = subscribeBrakeWearCart(() => {
      void syncCart();
    });
    return unsubscribe;
  }, [syncCart]);

  const hasDraft = Boolean(cart?.hasDraft && cart.brakePadsCount > 0 && cart.id != null);

  const inner = (
    <div className="catalog-cart-row">
      <span className="cart-icon-lab" title="Иконка корзины через GET /api/brake-wear/cart (без codegen)">
        🧺
      </span>
      <span className="catalog-cart-row__text">Колодок в заявке: {cart?.brakePadsCount ?? 0}</span>
    </div>
  );

  if (hasDraft && cart?.id != null) {
    return (
      <Link to={`/brake-wear/${cart.id}`} className="catalog-cart-row__link">
        {inner}
      </Link>
    );
  }

  return <div className="catalog-cart-row__inactive">{inner}</div>;
}
