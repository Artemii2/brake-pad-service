import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import { Link } from "react-router-dom";
import { ROUTES } from "../routes";

export default function AppNavbar() {
  return (
    <Navbar className="app-topbar">
      <Container className="app-topbar__container">
        <Navbar.Brand as={Link} to={ROUTES.SERVICES} className="app-logo">
          autodoc-ru
        </Navbar.Brand>
      </Container>
    </Navbar>
  );
}
