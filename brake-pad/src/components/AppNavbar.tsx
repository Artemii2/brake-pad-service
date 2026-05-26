import Nav from "react-bootstrap/Nav";
import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import { Link } from "react-router-dom";
import { authLogoutRequest } from "../modules/authApi";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { clearUserSession } from "../store/slices/userSlice";
import { ROUTES } from "../routes";

export default function AppNavbar() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, username } = useAppSelector((s) => s.user);
  const cart = useAppSelector((s) => s.brakeWearApplication.cart);
  const hasDraft = Boolean(cart?.hasDraft && cart.brakePadsCount > 0 && cart.id != null);

  const handleLogout = async () => {
    try {
      await authLogoutRequest();
    } catch {
      localStorage.removeItem("token");
    }
    dispatch(clearUserSession());
  };

  return (
    <Navbar className="app-topbar" expand="lg" collapseOnSelect>
      <Container className="app-topbar__container">
        <Navbar.Brand as={Link} to={ROUTES.SERVICES} className="app-logo">
          autodoc-ru
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav className="ms-auto app-topbar__nav">
            <Nav.Link as={Link} to={ROUTES.SERVICES}>
              Каталог
            </Nav.Link>
            {isAuthenticated ? (
              <>
                <Nav.Link as={Link} to={ROUTES.BRAKE_WEARS}>
                  Заявки
                </Nav.Link>
                <Nav.Link as={Link} to={ROUTES.PROFILE}>
                  Личный кабинет
                </Nav.Link>
              </>
            ) : null}
            {hasDraft ? (
              <Nav.Link as={Link} to={`/brake-wear/${cart?.id ?? 0}`}>
                Текущая заявка
              </Nav.Link>
            ) : (
              <Nav.Link disabled className="app-topbar__link--muted">
                Текущая заявка
              </Nav.Link>
            )}
            {isAuthenticated ? (
              <>
                <Nav.Link
                  href="#logout"
                  onClick={(e) => {
                    e.preventDefault();
                    void handleLogout();
                  }}
                >
                  Выход
                </Nav.Link>
                <span className="app-topbar__username d-none d-lg-inline">{username}</span>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to={ROUTES.SIGN_IN}>
                  Вход
                </Nav.Link>
                <Nav.Link as={Link} to={ROUTES.SIGN_UP}>
                  Регистрация
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
