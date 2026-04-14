import { useMemo } from "react";
import { Card, Container } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import { MOCK_SERVICES, fallbackImageUrl, resolveMediaUrl } from "../modules/mock";

export default function ServiceDetailsPage() {
  const { id } = useParams();

  const service = useMemo(() => MOCK_SERVICES.find((x) => x.id === Number(id)) ?? null, [id]);

  if (!service) {
    return (
      <Container className="py-4">
        <h1 className="h4">Услуга не найдена</h1>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Card>
        {service.videoUrl ? (
          <video
            className="service-details-video"
            src={service.videoUrl}
            controls
            autoPlay
            muted
            loop
            playsInline
            poster={resolveMediaUrl(service.imageUrl)}
          />
        ) : (
          <Card.Img variant="top" src={resolveMediaUrl(service.imageUrl)} onError={(e) => {
            e.currentTarget.src = fallbackImageUrl();
          }} />
        )}
        <Card.Body>
          <Card.Title>{service.title}</Card.Title>
          <Card.Text>{service.description}</Card.Text>
          <Card.Text>
            <strong>Тип:</strong> {service.padType}
          </Card.Text>
          <Card.Text>
            <strong>Дата публикации:</strong> {service.publishedAt}
          </Card.Text>
          <Link to="/" className="btn btn-dark">
            Назад к списку
          </Link>
        </Card.Body>
      </Card>
    </Container>
  );
}
