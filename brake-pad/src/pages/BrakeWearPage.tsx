import { useCallback, useEffect, useState } from "react";
import { Form, Spinner } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import {
  cloneBrakeWearDetail,
  MOCK_BRAKE_WEAR_DETAIL,
  fallbackImageUrl,
  resolveMediaUrl,
  type BrakePadWearLine,
} from "../modules/mock";
import { ROUTES } from "../routes";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  deleteBrakeWearApplication,
  fetchBrakeWearDetail,
  formBrakeWearApplication,
  removeBrakePadWearLine,
  updateBrakePadWearLine,
  updateBrakeWearDraft,
} from "../store/slices/brakeWearApplicationSlice";

type RowDraft = Pick<BrakePadWearLine, "count" | "pricePerItem" | "estimatedWearPercent">;

function normalizeStatus(status: string | undefined): string {
  const s = (status ?? "").toLowerCase();
  if (s === "new" || s === "created" || s === "open") return "draft";
  if (s === "in_progress" || s === "ready_for_moderation" || s === "on_moderation" || s === "pending_moderation") {
    return "formed";
  }
  if (s === "done" || s === "finished" || s === "approved") return "completed";
  if (s === "canceled" || s === "cancelled" || s === "declined") return "rejected";
  return s;
}

function statusLabel(status: string | undefined): string {
  const map: Record<string, string> = {
    draft: "Черновик",
    formed: "Сформирована",
    completed: "Завершена",
    rejected: "Отклонена",
    deleted: "Удалена",
  };
  const normalized = normalizeStatus(status);
  return normalized ? (map[normalized] ?? normalized) : "-";
}

export default function BrakeWearPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((s) => s.user);
  const { detail, detailLoading, detailError, applicationMutationLoading, itemMutationLoading } =
    useAppSelector((s) => s.brakeWearApplication);
  const [mockData, setMockData] = useState<typeof detail>(null);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [rowDrafts, setRowDrafts] = useState<Record<number, RowDraft>>({});
  const [mileageDraft, setMileageDraft] = useState(2500);
  const [rowNotes, setRowNotes] = useState<Record<number, string>>({});

  const reloadMock = useCallback(() => {
    if (!id) return;
    const n = Number(id);
    if (n === MOCK_BRAKE_WEAR_DETAIL.brakeWear.id) {
      setMockData(cloneBrakeWearDetail(MOCK_BRAKE_WEAR_DETAIL));
    } else {
      setMockData(null);
    }
  }, [id]);

  useEffect(() => {
    if (!id || !isAuthenticated) return;
    setMockData(null);
    void dispatch(fetchBrakeWearDetail(Number(id))).then((a) => {
      if (fetchBrakeWearDetail.rejected.match(a)) {
        reloadMock();
      }
    });
  }, [id, isAuthenticated, dispatch, reloadMock]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.SIGN_IN, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const data = detail ?? mockData;

  useEffect(() => {
    if (!data) return;
    setDescriptionDraft(data.brakeWear.description ?? "");
    const next: Record<number, RowDraft> = {};
    const notes: Record<number, string> = {};
    data.brakePads.forEach((line) => {
      next[line.brakePadId] = {
        count: line.count,
        pricePerItem: line.pricePerItem,
        estimatedWearPercent: line.estimatedWearPercent,
      };
      notes[line.brakePadId] = line.brakePad.description ?? "";
    });
    const calculatedMileage = data.brakePads.reduce((sum, line) => sum + line.count * 12000, 0);
    setMileageDraft(calculatedMileage > 0 ? calculatedMileage : 2500);
    setRowDrafts(next);
    setRowNotes(notes);
  }, [data]);

  const applicationId = data?.brakeWear.id;
  const isDraft = normalizeStatus(data?.brakeWear.status) === "draft";
  const canEditDraft = Boolean(isDraft && !mockData);
  const busy = applicationMutationLoading || detailLoading;

  const updateRowDraft = useCallback((brakePadId: number, patch: Partial<RowDraft>) => {
    setRowDrafts((prev) => ({
      ...prev,
      [brakePadId]: { ...(prev[brakePadId] ?? { count: 0, pricePerItem: 0, estimatedWearPercent: null }), ...patch },
    }));
  }, []);

  const lineBusyKey = (brakePadId: number) =>
    Boolean(itemMutationLoading[`line-${brakePadId}-${applicationId ?? 0}`]);
  const rmBusy = (brakePadId: number) => Boolean(itemMutationLoading[`rm-${brakePadId}`]);

  const handleSaveDescription = () => {
    if (!applicationId || !canEditDraft) return;
    void dispatch(updateBrakeWearDraft({ brakeWearId: applicationId, body: { description: descriptionDraft } }));
  };

  const handleSaveRow = (brakePadId: number) => {
    if (!applicationId || !canEditDraft) return;
    const draft = rowDrafts[brakePadId];
    if (!draft) return;
    void dispatch(
      updateBrakePadWearLine({
        brakePadId,
        brakeWearId: applicationId,
        body: {
          brake_wear_id: applicationId,
          brake_pad_id: brakePadId,
          count: draft.count,
          price_per_item: draft.pricePerItem,
          estimated_wear_percent: draft.estimatedWearPercent,
        },
      }),
    );
  };

  const handleRemoveRow = (brakePadId: number) => {
    if (!applicationId || !canEditDraft) return;
    if (!window.confirm("Убрать колодки из заявки?")) return;
    void dispatch(removeBrakePadWearLine({ brakePadId, brakeWearId: applicationId }));
  };

  const handleForm = () => {
    if (!applicationId || !canEditDraft) return;
    void dispatch(formBrakeWearApplication(applicationId));
  };

  const handleDeleteApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId || !canEditDraft) return;
    if (!window.confirm("Удалить заявку?")) return;
    if (mockData) {
      navigate(ROUTES.SERVICES, { replace: true });
      return;
    }
    void dispatch(deleteBrakeWearApplication(applicationId)).then(() => {
      navigate(ROUTES.SERVICES, { replace: true });
    });
  };

  if (!isAuthenticated) return null;
  if (detailLoading && !data) {
    return (
      <section className="brake-wear-page">
        <div className="catalog-loading">
          <Spinner animation="border" size="sm" /> Загрузка заявки...
        </div>
      </section>
    );
  }
  if (!data || !applicationId) {
    return (
      <section className="brake-wear-page">
        <p className="application-not-found">{detailError || "Заявка не найдена."}</p>
      </section>
    );
  }

  return (
    <section className="brake-wear-page">
      {busy ? (
        <div className="brake-wear-page__blocking" aria-live="polite">
          <Spinner animation="border" size="sm" /> Обработка...
        </div>
      ) : null}
      <div className={`brake-wear-detail ${busy ? "brake-wear-detail--blocked" : ""}`}>
        <div className="brake-wear-detail__header-card">
          <h1 className="brake-wear-detail__title">Заявка № {applicationId}</h1>
          <div className="brake-wear-detail__info">
            <div className="brake-wear-detail__info-item">
              <span className="brake-wear-detail__info-label">ID заявки:</span>{" "}
              <span className="brake-wear-detail__info-value">{applicationId}</span>
            </div>
            <div className="brake-wear-detail__info-item">
              <span className="brake-wear-detail__info-label">Статус:</span>{" "}
              <span className="brake-wear-detail__info-value">{statusLabel(data.brakeWear.status)}</span>
            </div>
            <div className="brake-wear-detail__info-item">
              <span className="brake-wear-detail__info-label">Создана:</span>{" "}
              <span className="brake-wear-detail__info-value">
                {data.brakeWear.createdAt ? new Date(data.brakeWear.createdAt).toLocaleString("ru-RU") : "-"}
              </span>
            </div>
            <div className="brake-wear-detail__info-item">
              <span className="brake-wear-detail__info-label">Стиль вождения:</span>{" "}
              <span className="brake-wear-detail__info-value">{descriptionDraft || "Спокойный"}</span>
            </div>
          </div>
          <div className="brake-wear-page__controls">
            <Form.Group className="brake-wear-page__control" controlId="brake-wear-mileage">
              <Form.Label>Пробег: {mileageDraft} км</Form.Label>
              <Form.Control
                type="number"
                min={0}
                value={mileageDraft}
                onChange={(e) => setMileageDraft(Number(e.target.value) || 0)}
                disabled={!canEditDraft}
              />
            </Form.Group>
            <Form.Group className="brake-wear-page__control" controlId="brake-wear-description">
              <Form.Label>Стиль</Form.Label>
              <Form.Control
                type="text"
                value={descriptionDraft}
                onChange={(e) => setDescriptionDraft(e.target.value)}
                disabled={!canEditDraft}
                placeholder="Спокойный"
              />
            </Form.Group>
          </div>
          {canEditDraft ? (
            <div className="brake-wear-page__header-actions">
              <form className="brake-wear-page__delete-form" onSubmit={handleDeleteApplication}>
                <button type="submit" className="brake-wear-page__delete-btn" disabled={busy || Boolean(mockData)}>
                  Удалить заявку
                </button>
              </form>
              <button type="button" className="brake-wear-page__method-btn" disabled={busy} onClick={handleSaveDescription}>
                Сохранить параметры
              </button>
              <button
                type="button"
                className="brake-wear-page__method-btn brake-wear-page__method-btn--accent"
                disabled={busy}
                onClick={handleForm}
              >
                Сформировать заявку
              </button>
            </div>
          ) : null}
        </div>

        <p className="brake-wear-page__methods-hint">
          Доступны действия с заявкой и ее строками: сохранение параметров, сохранение строки таблицы, удаление строки,
          формирование и удаление черновика.
        </p>

        <div className="wear-table-wrap">
          <table className="wear-table">
            <thead>
              <tr>
                <th className="wear-table__col-photo">Изображение</th>
                <th>Услуга</th>
                <th>Кол-во</th>
                <th>Остаток ресурса</th>
                <th>Комментарий</th>
              </tr>
            </thead>
            <tbody>
              {data.brakePads.map((line) => {
                const photo = resolveMediaUrl(line.brakePad.imageUrl) || fallbackImageUrl();
                const draft = rowDrafts[line.brakePadId];
                const wear = draft?.estimatedWearPercent ?? line.estimatedWearPercent ?? 0;
                const safeWear = Number.isFinite(Number(wear)) ? Math.max(0, Math.min(100, Number(wear))) : 0;
                const remainingPercent = Math.max(0, 100 - safeWear);
                const remainingKm = Math.round((remainingPercent / 100) * 40000);
                return (
                  <tr key={`${line.brakeWearId}-${line.brakePadId}`}>
                    <td className="wear-table__col-photo">
                      <img src={photo} alt={line.brakePad.title} className="brake-wear-page__thumb" />
                    </td>
                    <td>{line.brakePad.title}</td>
                    <td>
                      {canEditDraft ? (
                        <Form.Control
                          type="number"
                          min={1}
                          className="wear-table__input"
                          value={draft?.count ?? line.count}
                          disabled={!canEditDraft}
                          onChange={(e) => updateRowDraft(line.brakePadId, { count: Number(e.target.value) || 1 })}
                        />
                      ) : (
                        <strong>{line.count}</strong>
                      )}
                    </td>
                    <td>
                      <div className="wear-table__resource">
                        <span>{remainingKm} км</span>
                        <span>{remainingPercent}%</span>
                      </div>
                      {canEditDraft ? (
                        <Form.Control
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          className="wear-table__input wear-table__input--meta"
                          value={safeWear}
                          disabled={!canEditDraft}
                          onChange={(e) =>
                            updateRowDraft(line.brakePadId, {
                              estimatedWearPercent: Number(e.target.value) || 0,
                            })
                          }
                        />
                      ) : null}
                    </td>
                    <td className="wear-table__actions">
                      <Form.Control
                        type="text"
                        className="wear-table__input wear-table__note"
                        value={rowNotes[line.brakePadId] ?? ""}
                        disabled={!canEditDraft}
                        onChange={(e) =>
                          setRowNotes((prev) => ({
                            ...prev,
                            [line.brakePadId]: e.target.value,
                          }))
                        }
                      />
                      {canEditDraft ? (
                        <div className="wear-table__inline-actions">
                          <button
                            type="button"
                            className="brake-wear-page__row-btn"
                            disabled={busy || lineBusyKey(line.brakePadId) || Boolean(mockData)}
                            onClick={() => handleSaveRow(line.brakePadId)}
                          >
                            Сохранить строку
                          </button>
                          <button
                            type="button"
                            className="brake-wear-page__row-btn brake-wear-page__row-btn--danger"
                            disabled={busy || rmBusy(line.brakePadId) || Boolean(mockData)}
                            onClick={() => handleRemoveRow(line.brakePadId)}
                          >
                            Удалить из заявки
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </section>
  );
}
