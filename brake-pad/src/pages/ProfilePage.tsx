import { Navigate } from "react-router-dom";
import { ROUTES } from "../routes";
import { useAppSelector } from "../store/hooks";

export default function ProfilePage() {
  const { isAuthenticated, username, isModerator } = useAppSelector((s) => s.user);
  const token = localStorage.getItem("token");

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.SIGN_IN} replace />;
  }

  return (
    <section className="profile-page">
      <div className="profile-page__panel">
        <h1>Личный кабинет</h1>
        <p>
          <strong>Логин:</strong> {username}
        </p>
        <p>
          <strong>Роль:</strong> {isModerator ? "Модератор" : "Пользователь"}
        </p>
        <p>
          <strong>JWT в localStorage:</strong> {token ? "есть" : "нет"}
        </p>
        <p className="text-muted">
          API изменения профиля/пароля в текущем swagger не предусмотрен, поэтому страница показывает данные сессии.
        </p>
      </div>
    </section>
  );
}
