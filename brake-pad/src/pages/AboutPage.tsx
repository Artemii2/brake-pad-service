import { Container } from "react-bootstrap";

export default function AboutPage() {
  return (
    <Container className="py-4">
      <h1 className="h3">О проекте</h1>
      <p>
        Демонстрационный SPA для лабораторной 7: React + TypeScript, Redux Toolkit + thunk,
        авторизация, работа с заявками и доменом связи м-м через axios и codegen-клиент swagger.
      </p>
    </Container>
  );
}
