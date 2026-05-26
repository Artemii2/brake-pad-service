import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Container, Form, Spinner, Table } from "react-bootstrap";
import { ROUTES } from "../routes";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchBrakeWearsList,
  finishBrakeWearApplication,
  normalizeBrakeWearStatus,
  setListFilters,
} from "../store/slices/brakeWearApplicationSlice";
import {
  formatDateRu,
  formatDateTimeRu,
  isoDateToRu,
  ruDateToIso,
  todayIso,
  todayRu,
} from "../utils/dateRu";

function statusLabel(status: string | undefined): string {
  const map: Record<string, string> = {
    draft: "Черновик",
    formed: "Сформирована",
    completed: "Завершена",
    rejected: "Отклонена",
    deleted: "Удалена",
  };
  const normalized = normalizeBrakeWearStatus(status);
  return normalized ? (map[normalized] ?? String(normalized)) : "—";
}

function resultSummary(count: number): string {
  if (count <= 0) return "—";
  const n = count % 10;
  const n100 = count % 100;
  let word = "непустых";
  if (n100 >= 11 && n100 <= 14) word = "непустых";
  else if (n === 1) word = "непустая";
  else if (n >= 2 && n <= 4) word = "непустые";
  return `${count} ${word}`;
}

export default function BrakeWearsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isModerator, username } = useAppSelector((s) => s.user);
  const { list, listLoading, listError, filters, itemMutationLoading } = useAppSelector(
    (s) => s.brakeWearApplication,
  );

  const [creatorFilter, setCreatorFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [draftFromRu, setDraftFromRu] = useState(() => isoDateToRu(filters.fromDate || todayIso()));
  const [draftToRu, setDraftToRu] = useState(() => isoDateToRu(filters.toDate || todayIso()));
  const [draftStatus, setDraftStatus] = useState(filters.status);
  const [dateError, setDateError] = useState<string | null>(null);

  const load = useCallback(() => {
    void dispatch(fetchBrakeWearsList());
  }, [dispatch]);

  useEffect(() => {
    setDraftFromRu(isoDateToRu(filters.fromDate || todayIso()));
    setDraftToRu(isoDateToRu(filters.toDate || todayIso()));
    setDraftStatus(filters.status);
  }, [filters.fromDate, filters.toDate, filters.status]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.SIGN_IN, { replace: true });
      return;
    }
    load();
    const id = window.setInterval(load, 4000);
    return () => window.clearInterval(id);
  }, [isAuthenticated, navigate, load]);

  const visible = useMemo(() => {
    const uname = username.trim().toLowerCase();

    let base = isModerator
      ? list
      : list.filter((x) => {
          const creator = (x.creatorLogin ?? "").trim().toLowerCase();
          if (!creator || !uname) return true;
          return creator === uname || creator.includes(uname);
        });

    if (isModerator) {
      const creatorQ = creatorFilter.trim().toLowerCase();
      if (creatorQ) {
        base = base.filter((x) => (x.creatorLogin ?? "").toLowerCase().includes(creatorQ));
      }
      const topicQ = topicFilter.trim().toLowerCase();
      if (topicQ) {
        base = base.filter((x) => (x.description ?? "").toLowerCase().includes(topicQ));
      }
    }

    return base;
  }, [creatorFilter, isModerator, list, topicFilter, username]);

  const handleApplyFilters = () => {
    const fromIso = ruDateToIso(draftFromRu);
    const toIso = ruDateToIso(draftToRu);
    if (!fromIso || !toIso) {
      setDateError("Даты укажите в формате дд.мм.гггг (например, " + todayRu() + ")");
      return;
    }
    if (fromIso > toIso) {
      setDateError("Дата «С даты» не может быть позже даты «По дату».");
      return;
    }
    setDateError(null);
    dispatch(
      setListFilters({
        fromDate: fromIso,
        toDate: toIso,
        status: draftStatus,
      }),
    );
    void dispatch(fetchBrakeWearsList());
  };

  if (!isAuthenticated) return null;

  return (
    <Container className="py-4">
      <section className="brake-wears-page">
        <h1 className="brake-wears-page__title">{isModerator ? "Заявки (модератор)" : "Мои заявки"}</h1>

        <section className="brake-wears-page__filters filter-bar">
        <div className="brake-wears-page__filter-row">
          <Form.Group>
            <Form.Label>С даты</Form.Label>
            <Form.Control
              type="text"
              inputMode="numeric"
              placeholder="дд.мм.гггг"
              value={draftFromRu}
              onChange={(e) => setDraftFromRu(e.target.value)}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>По дату</Form.Label>
            <Form.Control
              type="text"
              inputMode="numeric"
              placeholder="дд.мм.гггг"
              value={draftToRu}
              onChange={(e) => setDraftToRu(e.target.value)}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Статус</Form.Label>
            <Form.Select value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)}>
              <option value="">Все</option>
              <option value="draft">Черновик</option>
              <option value="formed">Сформирована</option>
              <option value="completed">Завершена</option>
              <option value="rejected">Отклонена</option>
            </Form.Select>
          </Form.Group>
        </div>
        {isModerator ? (
          <div className="brake-wears-page__filter-row brake-wears-page__filter-row--secondary">
            <Form.Group>
              <Form.Label>Создатель (на клиенте)</Form.Label>
              <Form.Control
                type="text"
                value={creatorFilter}
                onChange={(e) => setCreatorFilter(e.target.value)}
                placeholder="Часть логина"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Тема (на клиенте)</Form.Label>
              <Form.Control
                type="text"
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                placeholder="Часть темы заявки"
              />
            </Form.Group>
          </div>
        ) : null}
        <div className="brake-wears-page__filter-actions">
          <Button onClick={handleApplyFilters}>Применить фильтры</Button>
        </div>
        {dateError ? <p className="brake-wears-page__date-error">{dateError}</p> : null}
      </section>

      <p className="brake-wears-page__result">
        {listLoading ? "Загрузка…" : `Найдено заявок: ${visible.length}`}
      </p>

      {listError ? <p className="text-danger">{listError}</p> : null}

      {listLoading && visible.length === 0 ? (
        <div className="catalog-loading">
          <Spinner animation="border" size="sm" /> Загрузка заявок...
        </div>
      ) : null}

      {!listLoading && visible.length === 0 ? (
        <p className="brake-wears-page__empty">Нет заявок по текущим условиям.</p>
      ) : null}

      {visible.length > 0 ? (
        <div className="brake-wears-table-wrap">
          <Table responsive className="brake-wears-table mb-0" hover={false}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Статус</th>
                {isModerator ? <th>Тема</th> : null}
                <th>Результат</th>
                {isModerator ? <th>Создатель</th> : null}
                <th>Создана</th>
                <th>Формирование</th>
                <th>Завершение</th>
                {isModerator ? <th>Модератор</th> : null}
                {isModerator ? <th>Действия</th> : null}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => {
                const id = row.id;
                const normalizedStatus = normalizeBrakeWearStatus(row.status);
                const finishBusy = Boolean(itemMutationLoading[`finish-${id}`]);
                const topic = row.description?.trim() || "—";
                const resultText = resultSummary(row.completedItemCount);

                return (
                  <tr key={id}>
                    <td>
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => navigate(`/brake-wear/${id}`)}
                      >
                        {id}
                      </button>
                    </td>
                    <td>{statusLabel(row.status)}</td>
                    {isModerator ? <td className="brake-wears-table__topic">{topic}</td> : null}
                    <td>
                      {row.completedItemCount > 0 ? (
                        <span className="brake-wears-table__result">{resultText}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    {isModerator ? <td>{row.creatorLogin || "—"}</td> : null}
                    <td>{formatDateTimeRu(row.createdAt)}</td>
                    <td>
                      {row.formingDate && row.formingDate.includes("T")
                        ? formatDateTimeRu(row.formingDate)
                        : formatDateRu(row.formingDate)}
                    </td>
                    <td>{formatDateTimeRu(row.finishDate)}</td>
                    {isModerator ? <td>{row.moderatorLogin || "—"}</td> : null}
                    {isModerator ? (
                      <td className="brake-wears-table__actions-cell">
                        {normalizedStatus === "formed" ? (
                          <div className="brake-wears-table__actions">
                            <Button
                              size="sm"
                              disabled={finishBusy}
                              onClick={() =>
                                void dispatch(finishBrakeWearApplication({ brakeWearId: id, status: "completed" }))
                              }
                            >
                              Завершить
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              disabled={finishBusy}
                              onClick={() =>
                                void dispatch(finishBrakeWearApplication({ brakeWearId: id, status: "rejected" }))
                              }
                            >
                              Отклонить
                            </Button>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      ) : null}
      </section>
    </Container>
  );
}
