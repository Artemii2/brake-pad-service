import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppNavbar from "./components/AppNavbar";
import { useAppDispatch } from "./store/hooks";
import { restoreUserFromToken } from "./store/slices/userSlice";
import Breadcrumbs from "./components/Breadcrumbs";
import AboutPage from "./pages/AboutPage";
import BrakeWearPage from "./pages/BrakeWearPage";
import BrakeWearsPage from "./pages/BrakeWearsPage";
import ProfilePage from "./pages/ProfilePage";
import ServiceDetailsPage from "./pages/ServiceDetailsPage";
import ServicesPage from "./pages/ServicesPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import { ROUTES } from "./routes";

export default function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(restoreUserFromToken());
  }, [dispatch]);

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
          <Route path={ROUTES.BRAKE_WEAR} element={<BrakeWearPage />} />
          <Route path={ROUTES.BRAKE_WEARS} element={<BrakeWearsPage />} />
          <Route path={ROUTES.SIGN_IN} element={<SignInPage />} />
          <Route path={ROUTES.SIGN_UP} element={<SignUpPage />} />
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
          <Route path={ROUTES.ABOUT} element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
