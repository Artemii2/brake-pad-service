import { Navigate, Route, Routes } from "react-router-dom";
import AppNavbar from "./components/AppNavbar";
import Breadcrumbs from "./components/Breadcrumbs";
import AboutPage from "./pages/AboutPage";
import CartMockPage from "./pages/CartMockPage";
import ServiceDetailsPage from "./pages/ServiceDetailsPage";
import ServicesPage from "./pages/ServicesPage";
import { ROUTES } from "./routes";

export default function App() {
  return (
    <>
      <AppNavbar />
      <main className="app-main">
        <div className="container">
          <Breadcrumbs />
        </div>
        <Routes>
          <Route path={ROUTES.SERVICES} element={<ServicesPage />} />
          <Route path={ROUTES.SERVICE_DETAILS} element={<ServiceDetailsPage />} />
          <Route path={ROUTES.CART} element={<CartMockPage />} />
          <Route path={ROUTES.ABOUT} element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
