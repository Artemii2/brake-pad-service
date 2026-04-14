import { useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { fallbackImageUrl, MOCK_CART, MOCK_SERVICES, resolveMediaUrl } from "../modules/mock";

export default function CartMockPage() {
  const [mileage, setMileage] = useState("2500");
  const [drivingStyle, setDrivingStyle] = useState("Спокойный");
  const [comments, setComments] = useState<Record<number, string>>({
    2: "Тест",
    1: "",
  });
  const items = [
    { serviceId: 2, quantity: 2, remainingKm: 32500, remainingPercent: 93 },
    { serviceId: 1, quantity: 3, remainingKm: 57500, remainingPercent: 96 },
  ];

  return (
    <Container className="py-4">
      <section className="application-card">
        <h1 className="application-card__title">Заявка № {MOCK_CART.draftId}</h1>

        <Row className="g-3 application-card__meta">
          <Col md={2}>
            <div className="application-card__meta-item">
              <strong>Статус:</strong> draft
            </div>
          </Col>
          <Col md={4}>
            <div className="application-card__meta-item">
              <strong>Создана:</strong> 2026-03-18 12:45:28.095449 +0300 MSK
            </div>
          </Col>
          <Col md={3}>
            <div className="application-card__meta-item">
              <strong>Стиль вождения:</strong> {drivingStyle}
            </div>
          </Col>
        </Row>

        <Row className="g-2 mt-2">
          <Col md={3}>
            <Form.Label className="application-card__label">Пробег: {mileage} км</Form.Label>
            <Form.Control value={mileage} onChange={(e) => setMileage(e.target.value)} />
          </Col>
          <Col md={3}>
            <Form.Label className="application-card__label">Стиль</Form.Label>
            <Form.Select value={drivingStyle} onChange={(e) => setDrivingStyle(e.target.value)}>
              <option>Спокойный</option>
              <option>Смешанный</option>
              <option>Агрессивный</option>
            </Form.Select>
          </Col>
        </Row>

        <Button variant="danger" className="application-card__delete-btn mt-3">
          Удалить заявку
        </Button>
      </section>

      <section className="application-lines mt-3">
        <div className="application-lines__head">
          <span>Изображение</span>
          <span>Услуга</span>
          <span>Кол-во</span>
          <span>Остаток ресурса</span>
          <span>Комментарий</span>
        </div>
        {items.map((line) => {
          const service = MOCK_SERVICES.find((s) => s.id === line.serviceId);
          if (!service) return null;
          return (
            <div key={line.serviceId} className="application-lines__row">
              <div className="application-lines__img-wrap">
                <img
                  src={resolveMediaUrl(service.imageUrl)}
                  alt={service.title}
                  className="application-lines__img"
                  onError={(e) => {
                    e.currentTarget.src = fallbackImageUrl();
                  }}
                />
              </div>
              <div className="application-lines__title">{service.title}</div>
              <div className="application-lines__qty">{line.quantity}</div>
              <div className="application-lines__remain">
                <div>{line.remainingKm} км</div>
                <div>{line.remainingPercent}%</div>
              </div>
              <div>
                <Form.Control
                  value={comments[line.serviceId] ?? ""}
                  onChange={(e) =>
                    setComments((prev) => ({
                      ...prev,
                      [line.serviceId]: e.target.value,
                    }))
                  }
                  placeholder="Комментарий"
                />
              </div>
            </div>
          );
        })}
      </section>
    </Container>
  );
}
