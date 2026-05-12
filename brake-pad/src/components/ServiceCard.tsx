import Card from "react-bootstrap/Card";
import { Link } from "react-router-dom";
import type { BrakePadService } from "../modules/mock";
import { fallbackImageUrl, resolveMediaUrl } from "../modules/mock";
import { useState } from "react";

type Props = {
  service: BrakePadService;
  similarityScore?: number;
};

function resolvePhotoSrc(photoUrl: string, imageError: boolean): string {
  if (imageError || !photoUrl?.trim()) return fallbackImageUrl();
  return resolveMediaUrl(photoUrl);
}

export default function ServiceCard({ service, similarityScore }: Props) {
  const [imageError, setImageError] = useState(false);
  const [img, setImg] = useState(resolvePhotoSrc(service.imageUrl, false));

  const handleImageError = () => {
    setImageError(true);
    setImg(resolvePhotoSrc(service.imageUrl, true));
  };

  return (
    <Card className="service-card h-100">
      <Card.Img variant="top" src={imageError ? fallbackImageUrl() : img} onError={handleImageError} />
      <Card.Body className="d-flex flex-column">
        <Card.Title>{service.title}</Card.Title>
        <Card.Text className="text-muted mb-2">{service.padType}</Card.Text>
        <Card.Text className="small flex-grow-1">{service.description}</Card.Text>
        <Card.Text className="service-card__short-en">{service.shortDescriptionEn}</Card.Text>
        {typeof similarityScore === "number" ? (
          <Card.Text className="service-card__similarity">
            Сходство: <strong>{Math.max(0, similarityScore * 100).toFixed(1)}%</strong>
          </Card.Text>
        ) : null}
        <Link to={`/brake-pad/${service.id}`} className="btn btn-dark">
          Подробнее
        </Link>
      </Card.Body>
    </Card>
  );
}
