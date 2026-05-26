import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Col, Container, Form, ProgressBar, Row, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import CartIconLab from "../components/CartIconLab";
import ServiceCard from "../components/ServiceCard";
import ServiceFilterBar, { type FiltersState } from "../components/ServiceFilterBar";
import { useServiceImageSearch } from "../hooks/useServiceImageSearch";
import type { BrakePadService } from "../modules/mock";
import { notifyBrakeWearCartUpdated } from "../modules/mock";
import {
  addBrakePadToDraft,
  getBrakeWearCart,
  listServices,
  serviceClipDescription,
} from "../modules/servicesApi";
import { ROUTES } from "../routes";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setCart } from "../store/slices/brakeWearApplicationSlice";

const emptyFilters: FiltersState = { title: "" };

export default function ServicesPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((s) => s.user);
  const canAddToDraft = isAuthenticated;
  const [draft, setDraft] = useState<FiltersState>(emptyFilters);
  const [items, setItems] = useState<BrakePadService[]>([]);
  const [clipSourceItems, setClipSourceItems] = useState<BrakePadService[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const syncCart = useCallback(async () => {
    const cart = await getBrakeWearCart();
    dispatch(setCart(cart));
    notifyBrakeWearCartUpdated();
  }, [dispatch]);

  const clipItems = useMemo(
    () =>
      clipSourceItems.map((service) => ({
        id: service.id,
        description: serviceClipDescription(service),
      })),
    [clipSourceItems],
  );
  const imageSearch = useServiceImageSearch(clipItems, clipItems.length > 0);

  const visibleItems = useMemo(() => {
    if (!imageSearch.imageEmbedding) return items;

    const visibleIds = new Set(imageSearch.items.filter((item) => item.isVisible).map((item) => item.id));
    const orderedIds = imageSearch.items.filter((item) => item.isVisible).map((item) => item.id);
    const sourceById = new Map(clipSourceItems.map((service) => [service.id, service]));

    return orderedIds
      .filter((id) => visibleIds.has(id))
      .map((id) => sourceById.get(id))
      .filter((service): service is BrakePadService => Boolean(service));
  }, [clipSourceItems, imageSearch.imageEmbedding, imageSearch.items, items]);

  const similarItems = useMemo(() => {
    if (!imageSearch.imageEmbedding) return [];

    const sourceById = new Map(clipSourceItems.map((service) => [service.id, service]));
    return imageSearch.items
      .filter((item) => item.isVisible)
      .map((item) => {
        const service = sourceById.get(item.id);
        if (!service) return null;
        return { service, score: item.score };
      })
      .filter((item): item is { service: BrakePadService; score: number } => Boolean(item));
  }, [clipSourceItems, imageSearch.imageEmbedding, imageSearch.items]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      const data = await listServices();
      if (!cancelled) {
        setItems(data);
        setClipSourceItems(data);
        setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void syncCart();
    }
  }, [isAuthenticated, syncCart]);

  const handleApplyFilters = async () => {
    setLoading(true);
    imageSearch.resetSearch();
    const data = await listServices({ title: draft.title });
    setItems(data);
    setClipSourceItems(data);
    setLoading(false);
  };

  const handleAddToDraft = async (serviceId: number) => {
    if (!isAuthenticated) {
      navigate(ROUTES.SIGN_IN);
      return;
    }
    setAdding(true);
    try {
      await addBrakePadToDraft(serviceId);
      await syncCart();
    } catch {
      void 0;
    } finally {
      setAdding(false);
    }
  };

  return (
    <Container className="py-4">
      <div className="catalog-search-stack">
        <div className="catalog-search-stack__toolbar">
          <CartIconLab />
        </div>
        <ServiceFilterBar
          value={draft}
          onChange={setDraft}
          onApply={() => {
            void handleApplyFilters();
          }}
        />
      </div>

      <section className="clip-search-panel">
        <div>
          <h2 className="clip-search-panel__title">Поиск похожих колодок по изображению</h2>
          <p className="clip-search-panel__hint">
            Загрузите фото: CLIP сравнит изображение с английскими описаниями карточек. Порог{" "}
            {imageSearch.threshold}, TopK {imageSearch.topK}.
          </p>
        </div>
        <Form.Control
          type="file"
          accept="image/*"
          className="clip-search-panel__input"
          onChange={(e) => {
            const input = e.currentTarget as HTMLInputElement;
            const file = input.files?.[0];
            if (file) imageSearch.searchByImage(file);
          }}
        />
        {!imageSearch.ready ? (
          <div className="clip-search-panel__progress">
            <ProgressBar now={imageSearch.progress} label={`${imageSearch.progress}%`} />
          </div>
        ) : null}
        {imageSearch.imageEmbedding ? (
          <button type="button" className="clip-search-panel__reset" onClick={imageSearch.resetSearch}>
            Сбросить CLIP-поиск
          </button>
        ) : null}
        {imageSearch.imageProcessing ? (
          <p className="clip-search-panel__status">
            Обрабатываем изображение {imageSearch.uploadedImageName ? `«${imageSearch.uploadedImageName}»` : ""}...
          </p>
        ) : null}
        {imageSearch.imageEmbedding ? (
          <p className="clip-search-panel__status">
            CLIP-поиск выполнен: показано {visibleItems.length} из {clipSourceItems.length} карточек.
          </p>
        ) : null}
      </section>

      {imageSearch.workerError ? <Alert variant="warning">CLIP-поиск недоступен: {imageSearch.workerError}</Alert> : null}
      {loading ? (
        <div className="catalog-loading">
          <Spinner animation="border" size="sm" /> Загрузка каталога...
        </div>
      ) : null}

      {similarItems.length > 0 ? (
        <section className="similar-services">
          <h2 className="similar-services__title">Похожие тормозные колодки</h2>
          <Row className="g-3">
            {similarItems.map(({ service, score }) => (
              <Col key={service.id} sm={6} lg={4}>
                <ServiceCard
                  service={service}
                  similarityScore={score}
                  onAddToDraft={canAddToDraft ? handleAddToDraft : undefined}
                  addDisabled={adding}
                />
              </Col>
            ))}
          </Row>
        </section>
      ) : null}

      {!imageSearch.imageEmbedding ? (
        <Row className="g-3 mt-1">
          {visibleItems.map((service) => (
            <Col key={service.id} sm={6} lg={4}>
              <ServiceCard
                service={service}
                onAddToDraft={canAddToDraft ? handleAddToDraft : undefined}
                addDisabled={adding}
              />
            </Col>
          ))}
        </Row>
      ) : null}

      {!loading && visibleItems.length === 0 ? (
        <p className="text-muted mt-4">По заданным фильтрам услуги не найдены.</p>
      ) : null}
    </Container>
  );
}
