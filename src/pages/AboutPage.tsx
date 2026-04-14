import { Container } from "react-bootstrap";

export default function AboutPage() {
  return (
    <Container className="py-4">
      <h1 className="h3">О проекте</h1>
      <p>
        Демонстрационный SPA для лабораторной 5: React + TypeScript + React-Bootstrap, фильтрация списка
        услуг из mock-коллекции, navbar и breadcrumbs.
      </p>
    </Container>
  );
}
