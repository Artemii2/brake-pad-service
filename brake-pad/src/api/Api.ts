/**
 * Swagger-codegen-style клиент (axios) для доменов:
 * - заявка: brake-wear
 * - связь м-м: brake-pad-wear
 */

export interface BrakePadJSON {
  id?: number;
  title?: string;
  description?: string;
  pad_type?: string;
  published_at?: string;
  image_url?: string;
  video_url?: string;
  short_description_en?: string;
}

export interface BrakeWearJSON {
  id?: number;
  status?: string;
  created_at?: string;
  creator_login?: string;
  moderator_login?: string | null;
  forming_date?: string | null;
  finish_date?: string | null;
  description?: string | null;
  completed_item_count?: number;
}

export interface BrakePadWearJSON {
  brake_wear_id?: number;
  brake_pad_id?: number;
  count?: number;
  price_per_item?: number;
  estimated_wear_percent?: number | null;
}

export interface BrakePadWearDetailJSON extends BrakePadWearJSON {
  brake_pad: BrakePadJSON;
}

export interface FinishStatusJSON {
  status?: "completed" | "rejected";
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, unknown>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  secure?: boolean;
  path: string;
  type?: ContentType;
  query?: QueryParamsType;
  format?: ResponseType;
  body?: unknown;
}

export type RequestParams = Omit<FullRequestParams, "body" | "method" | "query" | "path">;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export const ContentType = {
  Json: "application/json",
  FormData: "multipart/form-data",
  UrlEncoded: "application/x-www-form-urlencoded",
  Text: "text/plain",
} as const;

export type ContentType = (typeof ContentType)[keyof typeof ContentType];

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "//localhost:8080/api",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || params2?.method;
    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[method.toLowerCase() as keyof HeadersDefaults]) ||
          {}),
        ...(params1.headers || {}),
        ...(params2?.headers || {}),
      },
    };
  }

  public request = async <T = unknown, _E = unknown>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

export class Api<SecurityDataType extends unknown = unknown> extends HttpClient<SecurityDataType> {
  brakePadWearBinding = {
    addBrakePadToBrakeWearDraft: (brakePadId: number, params: RequestParams = {}) =>
      this.request<BrakeWearJSON, Record<string, string>>({
        path: `/brake-pad-wear/add/${brakePadId}`,
        method: "POST",
        secure: true,
        ...params,
      }),

    updateBrakePadWearLine: (
      brakePadId: number,
      brakeWearId: number,
      data: BrakePadWearJSON,
      params: RequestParams = {},
    ) =>
      this.request<BrakePadWearJSON, Record<string, string>>({
        path: `/brake-pad-wear/${brakePadId}/${brakeWearId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        secure: true,
        ...params,
      }),

    deleteBrakePadWearLine: (
      brakePadId: number,
      brakeWearId: number,
      params: RequestParams = {},
    ) =>
      this.request<void, Record<string, string>>({
        path: `/brake-pad-wear/${brakePadId}/${brakeWearId}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),
  };

  brakeWearApplication = {
    brakeWearCartList: (params: RequestParams = {}) =>
      this.request<{ has_draft?: boolean; brake_pads_count?: number; id?: number }, Record<string, string>>({
        path: "/brake-wear/cart",
        method: "GET",
        secure: true,
        ...params,
      }),

    brakeWearDetail: (brakeWearId: number, params: RequestParams = {}) =>
      this.request<{ brake_wear?: BrakeWearJSON; brake_pads?: BrakePadWearDetailJSON[] }, Record<string, string>>({
        path: `/brake-wear/${brakeWearId}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    allBrakeWearsList: (
      query?: { "from-date"?: string; "to-date"?: string; status?: string },
      params: RequestParams = {},
    ) =>
      this.request<BrakeWearJSON[], Record<string, string>>({
        path: "/brake-wear",
        method: "GET",
        query: query || {},
        secure: true,
        ...params,
      }),

    editBrakeWearUpdate: (brakeWearId: number, data: BrakeWearJSON, params: RequestParams = {}) =>
      this.request<BrakeWearJSON, Record<string, string>>({
        path: `/brake-wear/${brakeWearId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        secure: true,
        ...params,
      }),

    formBrakeWearUpdate: (brakeWearId: number, params: RequestParams = {}) =>
      this.request<BrakeWearJSON, Record<string, string>>({
        path: `/brake-wear/form/${brakeWearId}`,
        method: "PUT",
        secure: true,
        ...params,
      }),

    finishBrakeWearUpdate: (
      brakeWearId: number,
      data: FinishStatusJSON,
      params: RequestParams = {},
    ) =>
      this.request<BrakeWearJSON, Record<string, string>>({
        path: `/brake-wear/finish/${brakeWearId}`,
        method: "PUT",
        body: data,
        type: ContentType.Json,
        secure: true,
        ...params,
      }),

    deleteBrakeWearDelete: (brakeWearId: number, params: RequestParams = {}) =>
      this.request<void, Record<string, string>>({
        path: `/brake-wear/${brakeWearId}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),
  };
}
