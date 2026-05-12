import { useEffect, useState } from "react";
import { Card, Container, Spinner } from "react-bootstrap";
import { useParams } from "react-router-dom";
import type { BrakePadService } from "../modules/mock";
import { fallbackImageUrl, resolveMediaUrl } from "../modules/mock";
import { getService } from "../modules/servicesApi";

export default function ServiceDetailsPage() {
  const { id } = useParams();
  const [service, setService] = useState<BrakePadService | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const serviceId = Number(id);

    const run = async () => {
      setLoading(true);
      const data = Number.isFinite(serviceId) ? await getService(serviceId) : null;
      if (!cancelled) {
        setService(data);
        setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <Container className="py-4">
        <div className="catalog-loading">
          <Spinner animation="border" size="sm" /> Загрузка услуги...
        </div>
      </Container>
    );
  }

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
              src={resolveMediaUrl(service.videoUrl)}
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
          <Card.Text className="service-details-card__description">{service.shortDescriptionEn}</Card.Text>
          <div className="service-details-card__meta">
            <span>{service.padType}</span>
            <span>{service.publishedAt}</span>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
