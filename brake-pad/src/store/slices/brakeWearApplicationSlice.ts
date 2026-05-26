import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { api } from "../../api";
import type {
  BrakePadJSON,
  BrakePadWearDetailJSON,
  BrakePadWearJSON,
  BrakeWearJSON,
} from "../../api/Api";
import {
  MOCK_BRAKE_WEAR_CART,
  MOCK_BRAKE_WEAR_DETAIL,
  MOCK_BRAKE_WEARS,
  cloneBrakeWearDetail,
  notifyBrakeWearCartUpdated,
  type BrakePadWearLine,
  type BrakeWear,
  type BrakeWearCart,
  type BrakeWearDetail,
  type BrakeWearStatus,
} from "../../modules/mock";
import { apiErrMessage } from "../utils/apiError";
import { clearUserSession } from "./userSlice";

function mapBrakePad(raw: BrakePadJSON): BrakePadWearLine["brakePad"] {
  const obj = raw as unknown as Record<string, unknown>;
  return {
    id: Number(raw.id ?? obj.ID ?? obj.brake_pad_id ?? obj.brakePadId ?? obj.service_id ?? 0),
    title:
      (raw.title ??
        (obj.name as string | undefined) ??
        (obj.service_title as string | undefined) ??
        "Тормозные колодки"),
    description: raw.description ?? (obj.comment as string | undefined) ?? "",
    padType: raw.pad_type ?? (obj.padType as string | undefined) ?? (obj.type as string | undefined) ?? "Колодки",
    publishedAt:
      raw.published_at ??
      (obj.publishedAt as string | undefined) ??
      (obj.created_at as string | undefined) ??
      "",
    imageUrl: raw.image_url ?? (obj.imageUrl as string | undefined) ?? (obj.photo_url as string | undefined) ?? "",
    videoUrl: raw.video_url ?? (obj.videoUrl as string | undefined) ?? undefined,
    shortDescriptionEn:
      raw.short_description_en ??
      (obj.shortDescriptionEn as string | undefined) ??
      "Brake pad card for draft wear application and service request.",
  };
}

export function normalizeBrakeWearStatus(status: string | undefined): BrakeWearStatus | string {
  const s = String(status ?? "").toLowerCase();
  if (s === "draft" || s === "new" || s === "created" || s === "open" || s === "черновик") return "draft";
  if (
    s === "formed" ||
    s === "in_progress" ||
    s === "ready_for_moderation" ||
    s === "on_moderation" ||
    s === "moderation" ||
    s === "pending_moderation" ||
    s === "submitted" ||
    s === "сформирована" ||
    s === "сформирован"
  ) {
    return "formed";
  }
  if (s === "done" || s === "finished" || s === "approved" || s === "завершена" || s === "завершён") {
    return "completed";
  }
  if (
    s === "rejected" ||
    s === "canceled" ||
    s === "cancelled" ||
    s === "declined" ||
    s === "отклонена"
  ) {
    return "rejected";
  }
  if (s === "removed" || s === "deleted" || s === "удалена") return "deleted";
  return s;
}

function mapBrakeWear(raw: BrakeWearJSON): BrakeWear {
  const obj = raw as unknown as Record<string, unknown>;
  const statusRaw = (raw.status ?? obj.status ?? obj.state ?? obj.application_status ?? "draft") as string;
  const statusNormalized = normalizeBrakeWearStatus(statusRaw);
  const status: BrakeWearStatus =
    statusNormalized === "draft" ||
    statusNormalized === "formed" ||
    statusNormalized === "completed" ||
    statusNormalized === "rejected" ||
    statusNormalized === "deleted"
      ? statusNormalized
      : "draft";

  const formingDateRaw =
    raw.forming_date ??
    (obj.formingDate as string | null | undefined) ??
    (obj.formation_date as string | null | undefined) ??
    (obj.form_date as string | null | undefined) ??
    (obj.formed_at as string | null | undefined) ??
    (obj.formedAt as string | null | undefined) ??
    (obj.forming_at as string | null | undefined) ??
    null;

  return {
    id: Number(raw.id ?? obj.brake_wear_id ?? obj.brakeWearId ?? obj.application_id ?? 0),
    status: status || "draft",
    createdAt: String(raw.created_at ?? obj.createdAt ?? obj.creation_date ?? ""),
    creatorLogin:
      raw.creator_login ??
      (obj.creatorLogin as string | undefined) ??
      (obj.creator_login as string | undefined) ??
      (obj.username as string | undefined) ??
      "",
    moderatorLogin: raw.moderator_login ?? (obj.moderatorLogin as string | null | undefined) ?? null,
    formingDate: formingDateRaw,
    finishDate:
      raw.finish_date ??
      (obj.finishDate as string | null | undefined) ??
      (obj.finished_at as string | null | undefined) ??
      (obj.finishedAt as string | null | undefined) ??
      null,
    description: raw.description ?? null,
    completedItemCount: Number(raw.completed_item_count ?? obj.items_count ?? obj.completedItemCount ?? 0),
  };
}

function mapLine(raw: BrakePadWearDetailJSON): BrakePadWearLine {
  const rawObj = raw as unknown as Record<string, unknown>;
  const rowCore = (rawObj.brake_pad_wear as Record<string, unknown> | undefined) ?? rawObj;
  const brakePadCandidate =
    (rawObj.brake_pad as BrakePadJSON | undefined) ??
    (rawObj.brakePad as BrakePadJSON | undefined) ??
    (rawObj.service as BrakePadJSON | undefined) ??
    (rawObj.brake_pad_service as BrakePadJSON | undefined);
  const brakePadFallback = rowCore as unknown as BrakePadJSON | undefined;
  const brakePad = brakePadCandidate ?? brakePadFallback ?? {};
  const estimatedRaw =
    (rowCore.estimated_wear_percent as number | null | undefined) ??
    (rowCore.estimatedWearPercent as number | null | undefined) ??
    (rowCore.wear_percent as number | null | undefined) ??
    (rowCore.resource_percent as number | null | undefined);

  return {
    brakeWearId: Number(
      raw.brake_wear_id ??
        rowCore.brakeWearId ??
        rowCore.application_id ??
        rowCore.system_load_id ??
        rowCore.systemLoadId ??
        0,
    ),
    brakePadId: Number(raw.brake_pad_id ?? rowCore.brakePadId ?? rowCore.service_id ?? rowCore.strategy_id ?? 0),
    count: Number(raw.count ?? rowCore.quantity ?? rowCore.qty ?? 0),
    pricePerItem: Number(raw.price_per_item ?? rowCore.pricePerItem ?? rowCore.price ?? 0),
    estimatedWearPercent:
      estimatedRaw === null || estimatedRaw === undefined
        ? null
        : Number(estimatedRaw),
    brakePad: mapBrakePad(brakePad),
  };
}

function asDetail(data: unknown): BrakeWearDetail | null {
  if (!data || typeof data !== "object") return null;

  const root = data as Record<string, unknown>;
  const wrapped =
    (root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : null) ??
    (root.result && typeof root.result === "object" ? (root.result as Record<string, unknown>) : null);
  const source = wrapped ?? root;

  const wearRaw = (
    source.brake_wear ??
    source.application ??
    source.brakeWear ??
    source.brake_wear_application ??
    source
  ) as BrakeWearJSON | undefined;

  const padsCandidate =
    source.brake_pads ??
    source.items ??
    source.brakePads ??
    source.brake_pad_wears ??
    source.brakePadWears ??
    source.lines ??
    source.services;
  const padsRaw = Array.isArray(padsCandidate)
    ? (padsCandidate as BrakePadWearDetailJSON[])
    : padsCandidate == null
      ? []
      : null;

  if (!wearRaw || padsRaw === null) return null;

  const brakeWear = mapBrakeWear(wearRaw);
  if (!brakeWear.id) return null;

  return {
    brakeWear,
    brakePads: padsRaw.map(mapLine),
  };
}

function defaultListFilters() {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  const day = `${y}-${m}-${d}`;
  return { fromDate: day, toDate: day, status: "", creatorLogin: "" };
}

function localDateIsoFromValue(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  const ruMatch = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(trimmed);
  if (ruMatch) {
    return `${ruMatch[3]}-${ruMatch[2]}-${ruMatch[1]}`;
  }
  const d = new Date(trimmed);
  if (!Number.isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  const datePart = trimmed.length >= 10 ? trimmed.slice(0, 10) : trimmed;
  return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : null;
}

function formingDateIsoForFilter(row: BrakeWear): string | null {
  const fromForming = localDateIsoFromValue(row.formingDate);
  if (fromForming) return fromForming;
  const status = normalizeBrakeWearStatus(row.status);
  if (status === "draft" || status === "deleted") return null;
  return localDateIsoFromValue(row.createdAt);
}

function filterBrakeWearsByFilters(
  list: BrakeWear[],
  filters: ReturnType<typeof defaultListFilters>,
): BrakeWear[] {
  return list.filter((row) => {
    const status = normalizeBrakeWearStatus(row.status);
    if (filters.status && status !== filters.status) return false;

    if (filters.fromDate || filters.toDate) {
      const iso = formingDateIsoForFilter(row);
      if (!iso) return false;
      if (filters.fromDate && iso < filters.fromDate) return false;
      if (filters.toDate && iso > filters.toDate) return false;
    }

    if (filters.creatorLogin.trim()) {
      const q = filters.creatorLogin.trim().toLowerCase();
      if (!(row.creatorLogin ?? "").toLowerCase().includes(q)) return false;
    }

    return true;
  });
}

function buildInitialState() {
  return {
    cart: null as BrakeWearCart | null,
    cartLoading: false,
    detail: null as BrakeWearDetail | null,
    detailLoading: false,
    detailError: null as string | null,
    list: [] as BrakeWear[],
    listLoading: false,
    listError: null as string | null,
    filters: defaultListFilters(),
    itemMutationLoading: {} as Record<string, boolean>,
    applicationMutationLoading: false,
  };
}

type AppStateWithUser = { user: { isAuthenticated: boolean } };

function emptyGuestCartPayload(): BrakeWearCart {
  return { ...MOCK_BRAKE_WEAR_CART, hasDraft: false, brakePadsCount: 0, id: undefined };
}

function axiosStatus(e: unknown): number | undefined {
  if (e && typeof e === "object" && "response" in e) {
    const response = (e as { response?: { status?: number } }).response;
    return response?.status;
  }
  return undefined;
}

async function tryFormBrakeWear(brakeWearId: number): Promise<void> {
  const formStatusAliases = ["formed", "in_progress", "ready_for_moderation", "on_moderation"] as const;
  const attempts: Array<() => Promise<unknown>> = [
    () => api.brakeWearApplication.formBrakeWearUpdate(brakeWearId),
    () => api.instance.put(`/brake-wear/${brakeWearId}/form`),
    () => api.instance.put(`/brake-wear/${brakeWearId}/form`, {}),
    () => api.instance.put(`/brake-wear/form/${brakeWearId}`),
    () => api.instance.put(`/brake-wear/form/${brakeWearId}`, {}),
    () => api.instance.post(`/brake-wear/form/${brakeWearId}`),
    () => api.instance.post(`/brake-wear/${brakeWearId}/form`),
    () => api.instance.patch(`/brake-wear/form/${brakeWearId}`),
    () => api.instance.patch(`/brake-wear/${brakeWearId}/form`),
  ];
  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      await attempt();
      return;
    } catch (e) {
      lastError = e;
      const status = axiosStatus(e);
      if (status === 409 || status === 422) {
        // Some backends return conflict/validation when application is already formed.
        return;
      }
    }
  }

  for (const statusAlias of formStatusAliases) {
    try {
      await api.brakeWearApplication.editBrakeWearUpdate(brakeWearId, { status: statusAlias });
      return;
    } catch (e) {
      lastError = e;
      const status = axiosStatus(e);
      if (status === 409 || status === 422) {
        return;
      }
    }
  }

  throw lastError ?? new Error("Unable to form brake wear");
}

async function tryFinishBrakeWear(
  brakeWearId: number,
  status: "completed" | "rejected",
): Promise<void> {
  const statusAliases =
    status === "completed"
      ? ["completed", "done", "finished", "approved"]
      : ["rejected", "canceled", "cancelled", "declined"];

  let lastError: unknown;
  for (const alias of statusAliases) {
    const attempts: Array<() => Promise<unknown>> = [
      () =>
        api.brakeWearApplication.finishBrakeWearUpdate(brakeWearId, {
          status: alias as "completed" | "rejected",
        }),
      () => api.instance.put(`/brake-wear/${brakeWearId}/finish`, { status: alias }),
    ];

    for (const attempt of attempts) {
      try {
        await attempt();
        return;
      } catch (e) {
        lastError = e;
      }
    }
  }

  throw lastError ?? new Error("Unable to finish brake wear");
}

type CartResponseDTO = {
  has_draft?: boolean;
  hasDraft?: boolean;
  brake_pads_count?: number;
  items_count?: number;
  itemsCount?: number;
  strategies_count?: number;
  id?: number;
  draft_id?: number;
  draftId?: number;
  brake_wear_id?: number;
  brakeWearId?: number;
  application_id?: number;
};

async function requestBrakeWearCartWithFallback(): Promise<CartResponseDTO> {
  const paths = ["/brake-wear/cart", "/brake-pad-wear/cart", "/brake-pad-wear/cart-icon"] as const;
  let lastError: unknown;

  for (const path of paths) {
    try {
      const response = await api.instance.get<CartResponseDTO>(path);
      return response.data ?? {};
    } catch (e) {
      const status = axiosStatus(e);
      lastError = e;
      if (status !== 404) throw e;
    }
  }

  throw lastError ?? new Error("Cart endpoint is unavailable");
}

export const fetchBrakeWearCart = createAsyncThunk(
  "brakeWearApplication/fetchCart",
  async (_, { rejectWithValue, getState }) => {
    const before = getState() as AppStateWithUser;
    if (!before.user.isAuthenticated) {
      return emptyGuestCartPayload();
    }
    try {
      const data = await requestBrakeWearCartWithFallback();
      const after = getState() as AppStateWithUser;
      if (!after.user.isAuthenticated) {
        return emptyGuestCartPayload();
      }
      const countRaw =
        data.brake_pads_count ?? data.items_count ?? data.itemsCount ?? data.strategies_count ?? 0;
      const idRaw =
        data.id ??
        data.draft_id ??
        data.draftId ??
        data.brake_wear_id ??
        data.brakeWearId ??
        data.application_id;
      const normalizedId = typeof idRaw === "number" && Number.isFinite(idRaw) ? idRaw : undefined;
      return {
        hasDraft: Boolean(data.has_draft ?? data.hasDraft),
        brakePadsCount: Number(countRaw),
        id: normalizedId,
      };
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const fetchBrakeWearDetail = createAsyncThunk(
  "brakeWearApplication/fetchDetail",
  async (brakeWearId: number, { rejectWithValue }) => {
    try {
      const response = await api.brakeWearApplication.brakeWearDetail(brakeWearId);
      const detail = asDetail(response.data);
      if (!detail) return rejectWithValue("Неверный ответ сервера");
      return detail;
    } catch (e) {
      if (brakeWearId === MOCK_BRAKE_WEAR_DETAIL.brakeWear.id) {
        return cloneBrakeWearDetail(MOCK_BRAKE_WEAR_DETAIL);
      }
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const addBrakePadToBrakeWear = createAsyncThunk(
  "brakeWearApplication/addBrakePadLine",
  async (brakePadId: number, { rejectWithValue, dispatch }) => {
    try {
      await api.brakePadWearBinding.addBrakePadToBrakeWearDraft(brakePadId);
      await dispatch(fetchBrakeWearCart());
      notifyBrakeWearCartUpdated();
      return brakePadId;
    } catch (e) {
      if (axiosStatus(e) === 409) {
        await dispatch(fetchBrakeWearCart());
        notifyBrakeWearCartUpdated();
        return brakePadId;
      }
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const updateBrakePadWearLine = createAsyncThunk(
  "brakeWearApplication/updateBrakePadLine",
  async (
    {
      brakePadId,
      brakeWearId,
      body,
    }: { brakePadId: number; brakeWearId: number; body: BrakePadWearJSON },
    { rejectWithValue, dispatch },
  ) => {
    const key = `${brakePadId}-${brakeWearId}`;
    try {
      await api.brakePadWearBinding.updateBrakePadWearLine(brakePadId, brakeWearId, body);
      await dispatch(fetchBrakeWearDetail(brakeWearId));
      return key;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const removeBrakePadWearLine = createAsyncThunk(
  "brakeWearApplication/removeBrakePadLine",
  async (
    { brakePadId, brakeWearId }: { brakePadId: number; brakeWearId: number },
    { rejectWithValue, dispatch },
  ) => {
    try {
      await api.brakePadWearBinding.deleteBrakePadWearLine(brakePadId, brakeWearId);
      await dispatch(fetchBrakeWearDetail(brakeWearId));
      await dispatch(fetchBrakeWearCart());
      notifyBrakeWearCartUpdated();
      return brakePadId;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const updateBrakeWearDraft = createAsyncThunk(
  "brakeWearApplication/updateDraft",
  async (
    { brakeWearId, body }: { brakeWearId: number; body: BrakeWearJSON },
    { rejectWithValue, dispatch },
  ) => {
    try {
      await api.brakeWearApplication.editBrakeWearUpdate(brakeWearId, body);
      await dispatch(fetchBrakeWearDetail(brakeWearId));
      return true;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const formBrakeWearApplication = createAsyncThunk(
  "brakeWearApplication/form",
  async (brakeWearId: number, { rejectWithValue, dispatch }) => {
    try {
      await tryFormBrakeWear(brakeWearId);
      await dispatch(fetchBrakeWearDetail(brakeWearId));
      await dispatch(fetchBrakeWearCart());
      await dispatch(fetchBrakeWearsList());
      notifyBrakeWearCartUpdated();
      return true;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const deleteBrakeWearApplication = createAsyncThunk(
  "brakeWearApplication/delete",
  async (brakeWearId: number, { rejectWithValue, dispatch }) => {
    try {
      await api.brakeWearApplication.deleteBrakeWearDelete(brakeWearId);
      await dispatch(fetchBrakeWearCart());
      await dispatch(fetchBrakeWearsList());
      notifyBrakeWearCartUpdated();
      return true;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const finishBrakeWearApplication = createAsyncThunk(
  "brakeWearApplication/finish",
  async (
    { brakeWearId, status }: { brakeWearId: number; status: "completed" | "rejected" },
    { rejectWithValue, dispatch },
  ) => {
    try {
      await tryFinishBrakeWear(brakeWearId, status);
      await dispatch(fetchBrakeWearsList());
      return true;
    } catch (e) {
      return rejectWithValue(apiErrMessage(e));
    }
  },
);

export const fetchBrakeWearsList = createAsyncThunk(
  "brakeWearApplication/fetchList",
  async (_, { getState }) => {
    const st = getState() as {
      brakeWearApplication: { filters: ReturnType<typeof defaultListFilters> };
    };
    const f = st.brakeWearApplication.filters;

    try {
      const parseList = (payload: unknown): BrakeWear[] => {
        const root = payload;
        const rootObj = root && typeof root === "object" ? (root as Record<string, unknown>) : null;
        const listCandidate = Array.isArray(root)
          ? root
          : Array.isArray(rootObj?.items)
            ? (rootObj.items as unknown[])
            : Array.isArray(rootObj?.data)
              ? (rootObj.data as unknown[])
              : Array.isArray(rootObj?.result)
                ? (rootObj.result as unknown[])
                : Array.isArray(rootObj?.applications)
                  ? (rootObj.applications as unknown[])
                  : Array.isArray(rootObj?.brake_wears)
                    ? (rootObj.brake_wears as unknown[])
                    : [];
        return listCandidate.map((item) => mapBrakeWear(item as BrakeWearJSON));
      };

      const query: Record<string, string> = {};
      if (f.fromDate) {
        query["from-date"] = f.fromDate;
        query.from_date = f.fromDate;
        query.forming_from = f.fromDate;
      }
      if (f.toDate) {
        query["to-date"] = f.toDate;
        query.to_date = f.toDate;
        query.forming_to = f.toDate;
      }
      if (f.status) query.status = f.status;

      const response = await api.brakeWearApplication.allBrakeWearsList(
        query as { "from-date"?: string; "to-date"?: string; status?: string },
      );
      let list = parseList(response.data);

      if (f.status === "formed" && list.length === 0) {
        const altStatuses = ["in_progress", "ready_for_moderation", "on_moderation", "submitted"];
        for (const alt of altStatuses) {
          const altResponse = await api.brakeWearApplication.allBrakeWearsList(
            { ...query, status: alt } as { "from-date"?: string; "to-date"?: string; status?: string },
          );
          const altList = parseList(altResponse.data);
          if (altList.length > 0) {
            list = altList;
            break;
          }
        }
      }

      if (list.length === 0 && (f.fromDate || f.toDate || f.status)) {
        const wideResponse = await api.brakeWearApplication.allBrakeWearsList({});
        list = filterBrakeWearsByFilters(parseList(wideResponse.data), f);
      }

      return list;
    } catch {
      return filterBrakeWearsByFilters([...MOCK_BRAKE_WEARS], f);
    }
  },
);

const brakeWearApplicationSlice = createSlice({
  name: "brakeWearApplication",
  initialState: buildInitialState(),
  reducers: {
    clearBrakeWearDetailError: (state) => {
      state.detailError = null;
    },
    setListFilters: (
      state,
      action: PayloadAction<Partial<ReturnType<typeof defaultListFilters>>>,
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetListFiltersToToday: (state) => {
      state.filters = defaultListFilters();
    },
    setCart: (state, action: PayloadAction<BrakeWearCart | null>) => {
      state.cart = action.payload;
      state.cartLoading = false;
    },
    setCartLoading: (state, action: PayloadAction<boolean>) => {
      state.cartLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(clearUserSession, () => buildInitialState())
      .addCase(fetchBrakeWearCart.pending, (state) => {
        state.cartLoading = true;
      })
      .addCase(fetchBrakeWearCart.fulfilled, (state, action) => {
        state.cartLoading = false;
        state.cart = action.payload;
      })
      .addCase(fetchBrakeWearCart.rejected, (state) => {
        state.cartLoading = false;
        state.cart = emptyGuestCartPayload();
      })
      .addCase(fetchBrakeWearDetail.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
        state.detail = null;
      })
      .addCase(fetchBrakeWearDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.detail = action.payload;
      })
      .addCase(fetchBrakeWearDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload as string;
      })
      .addCase(fetchBrakeWearsList.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(fetchBrakeWearsList.fulfilled, (state, action) => {
        state.listLoading = false;
        state.list = action.payload;
      })
      .addCase(fetchBrakeWearsList.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload as string;
      })
      .addCase(addBrakePadToBrakeWear.pending, (state) => {
        state.applicationMutationLoading = true;
      })
      .addCase(addBrakePadToBrakeWear.fulfilled, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(addBrakePadToBrakeWear.rejected, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(updateBrakeWearDraft.pending, (state) => {
        state.applicationMutationLoading = true;
      })
      .addCase(updateBrakeWearDraft.fulfilled, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(updateBrakeWearDraft.rejected, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(formBrakeWearApplication.pending, (state) => {
        state.applicationMutationLoading = true;
      })
      .addCase(formBrakeWearApplication.fulfilled, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(formBrakeWearApplication.rejected, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(deleteBrakeWearApplication.pending, (state) => {
        state.applicationMutationLoading = true;
      })
      .addCase(deleteBrakeWearApplication.fulfilled, (state) => {
        state.applicationMutationLoading = false;
        state.detail = null;
      })
      .addCase(deleteBrakeWearApplication.rejected, (state) => {
        state.applicationMutationLoading = false;
      })
      .addCase(updateBrakePadWearLine.pending, (state, action) => {
        const key = `${action.meta.arg.brakePadId}-${action.meta.arg.brakeWearId}`;
        state.itemMutationLoading[`line-${key}`] = true;
      })
      .addCase(updateBrakePadWearLine.fulfilled, (state, action) => {
        delete state.itemMutationLoading[`line-${action.payload}`];
      })
      .addCase(updateBrakePadWearLine.rejected, (state, action) => {
        const arg = action.meta?.arg;
        if (arg) delete state.itemMutationLoading[`line-${arg.brakePadId}-${arg.brakeWearId}`];
      })
      .addCase(removeBrakePadWearLine.pending, (state, action) => {
        const id = action.meta.arg.brakePadId;
        state.itemMutationLoading[`rm-${id}`] = true;
      })
      .addCase(removeBrakePadWearLine.fulfilled, (state, action) => {
        delete state.itemMutationLoading[`rm-${action.payload}`];
      })
      .addCase(removeBrakePadWearLine.rejected, (state, action) => {
        const id = action.meta?.arg?.brakePadId;
        if (id != null) delete state.itemMutationLoading[`rm-${id}`];
      })
      .addCase(finishBrakeWearApplication.pending, (state, action) => {
        const id = action.meta.arg.brakeWearId;
        state.itemMutationLoading[`finish-${id}`] = true;
      })
      .addCase(finishBrakeWearApplication.fulfilled, (state, action) => {
        const id = action.meta.arg.brakeWearId;
        delete state.itemMutationLoading[`finish-${id}`];
      })
      .addCase(finishBrakeWearApplication.rejected, (state, action) => {
        const id = action.meta?.arg?.brakeWearId;
        if (id != null) delete state.itemMutationLoading[`finish-${id}`];
      });
  },
});

export const {
  clearBrakeWearDetailError,
  setListFilters,
  resetListFiltersToToday,
  setCart,
  setCartLoading,
} =
  brakeWearApplicationSlice.actions;
export default brakeWearApplicationSlice.reducer;
