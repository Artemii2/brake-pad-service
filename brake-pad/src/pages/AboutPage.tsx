import { Container } from "react-bootstrap";

export default function AboutPage() {
  return (
    <Container className="py-4">
      <h1 className="h3">О проекте</h1>
      <p>
        Демонстрационный SPA для лабораторной 6: React + TypeScript, fetch-запросы через proxy,
        fallback на mock-коллекцию и мультимодальный поиск похожих карточек через CLIP.
      </p>
    </Container>
  );
}
