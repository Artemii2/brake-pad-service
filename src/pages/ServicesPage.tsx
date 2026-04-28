import { useMemo, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import ServiceCard from "../components/ServiceCard";
import ServiceFilterBar, { type FiltersState } from "../components/ServiceFilterBar";
import { MOCK_SERVICES } from "../modules/mock";

const emptyFilters: FiltersState = { title: "" };

function applyFilters(input: FiltersState) {
  const title = input.title.trim().toLowerCase();
  return MOCK_SERVICES.filter((s) => {
    if (title && !s.title.toLowerCase().includes(title)) return false;
    return true;
  });
}

export default function ServicesPage() {
  const [draft, setDraft] = useState<FiltersState>(emptyFilters);
  const [applied, setApplied] = useState<FiltersState>(emptyFilters);

  const items = useMemo(() => applyFilters(applied), [applied]);

  return (
    <Container className="py-4">
      <ServiceFilterBar
        value={draft}
        onChange={setDraft}
        onApply={() => setApplied(draft)}
      />

      <Row className="g-3 mt-1">
        {items.map((service) => (
          <Col key={service.id} sm={6} lg={4}>
            <ServiceCard service={service} />
          </Col>
        ))}
      </Row>

      {items.length === 0 ? <p className="text-muted mt-4">По заданным фильтрам услуги не найдены.</p> : null}
    </Container>
  );
}
