export interface RequestParams {
  routeUrl: string;
  body?: any;
  signal?: AbortSignal;
  authToken?: string;
  headers?: any;
}

export interface GetRequestParams extends RequestParams {
  responseType?: "json" | "blob";
}
