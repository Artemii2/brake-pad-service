import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { Link } from "react-router-dom";
import { MOCK_CART } from "../modules/mock";
import { ROUTES } from "../routes";

export default function AppNavbar() {
  return (
    <Navbar className="app-topbar">
      <Container className="justify-content-between">
        <Navbar.Brand as={Link} to={ROUTES.SERVICES} className="app-logo">
          autodoc-ru
        </Navbar.Brand>
        <Nav className="app-topbar__nav">
          <Nav.Link as={Link} to={ROUTES.SERVICES}>
            Каталог колодок
          </Nav.Link>
          <Nav.Link as={Link} to={ROUTES.CART}>
            Текущая заявка {MOCK_CART.draftId}
          </Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
}
