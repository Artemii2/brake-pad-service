import { useMemo } from "react";
import { Card, Container } from "react-bootstrap";
import { useParams } from "react-router-dom";
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
      <Card className="service-details-card">
        <div className="service-details-card__media">
          {service.videoUrl ? (
            <video
              className="service-details-card__video"
              src={service.videoUrl}
              autoPlay
              muted
              loop
              playsInline
              poster={resolveMediaUrl(service.imageUrl)}
            />
          ) : (
            <Card.Img
              className="service-details-card__image"
              src={resolveMediaUrl(service.imageUrl)}
              onError={(e) => {
                e.currentTarget.src = fallbackImageUrl();
              }}
            />
          )}
        </div>
        <Card.Body className="service-details-card__body">
          <Card.Title className="service-details-card__title">{service.title}</Card.Title>
          <Card.Text className="service-details-card__description">{service.description}</Card.Text>
          <div className="service-details-card__meta">
            <span>{service.padType}</span>
            <span>{service.publishedAt}</span>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
