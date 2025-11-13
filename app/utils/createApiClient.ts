/*
Original source code from:

https://github.com/drwpow/openapi-typescript/blob/ee908d0f12bea42eca27d3b33d7bb7814a2f6460/packages/openapi-fetch/src/index.ts

EDITIED BY DARREN Z to fit needs ty.
*/
import type {
  ErrorResponse,
  FilterKeys,
  HttpMethod,
  MediaType,
  OperationRequestBodyContent,
  PathsWithMethod,
  RequiredKeysOf,
  ResponseObjectMap,
  SuccessResponse,
} from 'openapi-typescript-helpers';
export interface MiddlewareRequest extends Request {
  /** The original OpenAPI schema path (including curly braces) */
  schemaPath: string;
  /** OpenAPI parameters as provided from openapi-fetch */
  params: {
    query?: Record<string, unknown>;
    header?: Record<string, unknown>;
    path?: Record<string, unknown>;
    cookie?: Record<string, unknown>;
  };
}

export type MergedOptions<T = unknown> = {
  baseUrl: string;
  parseAs: ParseAs;
  querySerializer: QuerySerializer<T>;
  bodySerializer: BodySerializer<T>;
  fetch: typeof globalThis.fetch;
};
export interface Middleware {
  onRequest?: (
    req: MiddlewareRequest,
    options: MergedOptions
  ) => Request | undefined | Promise<Request | undefined>;
  onResponse?: (
    res: Response,
    options: MergedOptions
  ) => Response | undefined | Promise<Response | undefined>;
}
type KeysWhereObjectsAreOptional<T> = {
  [K in keyof T]: T[K] extends object ? (Partial<T[K]> extends T[K] ? K : never) : never;
}[keyof T];

export type MakeObjectsWithoutRequiredKeysOptional<T> = Partial<Pick<T, KeysWhereObjectsAreOptional<T>>> &
  Omit<T, KeysWhereObjectsAreOptional<T>>;

// HTTP types

/** 2XX statuses */
export type OkStatus = 200 | 201 | 202 | 203 | 204 | 206 | 207 | '2XX';
// prettier-ignore
/** 4XX and 5XX statuses */
export type ErrorStatus = 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511 | '5XX' | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 429 | 431 | 444 | 450 | 451 | 497 | 498 | 499 | '4XX' | "default";

// OpenAPI type helpers

/** DO NOT USE! Only used only for OperationObject type inference */
export interface OperationObject {
  parameters: any;
  requestBody: any; // note: "any" will get overridden in inference
  responses: any;
}
/** Internal helper used in PathsWithMethod */
export type PathItemObject = {
  [M in HttpMethod]: OperationObject;
} & { parameters?: any };
/** Return `responses` for an Operation Object */

// settings & const
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};
const TRAILING_SLASH_RE = /\/*$/;

// Note: though "any" is considered bad practice in general, this library relies
// on "any" for type inference only it can give.  Same goes for the "{}" type.

export class FetchError extends Error {
  constructor(message?: string) {
    super(message ?? 'Network request failed');
  }
}

/** options for each client instance */
export interface ClientOptions extends Omit<RequestInit, 'headers'> {
  /** set the common root URL for all API requests */
  baseUrl?: string;
  /** custom fetch (defaults to globalThis.fetch) */
  fetch?: typeof fetch;
  /** global querySerializer */
  querySerializer?: QuerySerializer<unknown>;
  /** global bodySerializer */
  bodySerializer?: BodySerializer<unknown>;
  // headers override to make typing friendlier
  headers?: HeadersOptions;
}
export type HeadersOptions = HeadersInit | Record<string, string | number | boolean | null | undefined>;
export type QuerySerializer<T> = (
  query: T extends { parameters: any } ? NonNullable<T['parameters']['query']> : Record<string, unknown>
) => string;
export type BodySerializer<T> = (body: OperationRequestBodyContent<T>) => any;
export type ParseAs = 'json' | 'text' | 'blob' | 'arrayBuffer' | 'stream';
export interface DefaultParamsOption {
  params?: { query?: Record<string, unknown> };
}
export type ParamsOption<T> = T extends {
  parameters: any;
}
  ? RequiredKeysOf<T['parameters']> extends never
    ? { params?: T['parameters'] }
    : { params: T['parameters'] }
  : DefaultParamsOption;

export type RequestBodyOption<T> = OperationRequestBodyContent<T> extends never
  ? { body?: never }
  : undefined extends OperationRequestBodyContent<T>
  ? { body?: OperationRequestBodyContent<T> }
  : { body: OperationRequestBodyContent<T> };
export type FetchOptions<T> = RequestOptions<T> & Omit<RequestInit, 'body'>;

export type RequestOptions<T> = ParamsOption<T> &
  RequestBodyOption<T> & {
    querySerializer?: QuerySerializer<T>;
    bodySerializer?: BodySerializer<T>;
    parseAs?: ParseAs;
  };
type BodyType<T = unknown> = {
  json: T;
  text: Awaited<ReturnType<Response['text']>>;
  blob: Awaited<ReturnType<Response['blob']>>;
  arrayBuffer: Awaited<ReturnType<Response['arrayBuffer']>>;
  stream: Response['body'];
};
export type ParseAsResponse<T, Options> = Options extends {
  parseAs: ParseAs;
}
  ? BodyType<T>[Options['parseAs']]
  : T;
export type FetchResponse<T extends Record<string | number, any>, Options, Media extends MediaType> =
  | {
      data: ParseAsResponse<SuccessResponse<ResponseObjectMap<T>, Media>, Options>;
      error?: never;
      response: Response;
    }
  | {
      data?: never;
      error: ErrorResponse<ResponseObjectMap<T>, Media>;
      response: Response;
    };
export type MaybeOptionalInit<Params, Location extends keyof Params> = RequiredKeysOf<
  FetchOptions<FilterKeys<Params, Location>>
> extends never
  ? FetchOptions<FilterKeys<Params, Location>> | undefined
  : FetchOptions<FilterKeys<Params, Location>>;
type InitParam<Init> = RequiredKeysOf<Init> extends never
  ? [(Init & { [key: string]: unknown })?]
  : [Init & { [key: string]: unknown }];

export type ClientMethod<
  Paths extends Record<string, Record<HttpMethod, {}>>,
  Method extends HttpMethod,
  Media extends MediaType,
> = <Path extends PathsWithMethod<Paths, Method>, Init extends MaybeOptionalInit<Paths[Path], Method>>(
  url: Path,
  ...init: InitParam<Init>
) => Promise<FetchResponse<Paths[Path][Method], Init, Media>>;

export type ClientForPath<PathInfo extends Record<string | number, any>, Media extends MediaType> = {
  [Method in keyof PathInfo as Uppercase<string & Method>]: <
    Init extends MaybeOptionalInit<PathInfo, Method>,
  >(
    ...init: InitParam<Init>
  ) => Promise<FetchResponse<PathInfo[Method], Init, Media>>;
};
export function createClient<Paths extends Record<string, Record<HttpMethod, {}>>>(
  clientOptions: ClientOptions = {}
) {
  const middlewares: Middleware[] = [];
  const {
    fetch = globalThis.fetch,
    querySerializer: globalQuerySerializer,
    bodySerializer: globalBodySerializer,
    ...options
  } = clientOptions;

  async function coreFetch<Path extends keyof Paths, Method extends HttpMethod>(
    url: Path,
    fetchOptions: FetchOptions<Method extends keyof Paths[Path] ? Paths[Path][Method] : never>
  ): Promise<FetchResponse<Paths[Path][Method], FetchOptions<Paths[Path][Method]>, MediaType>> {
    const {
      headers,
      body: requestBody,
      params = {},
      parseAs = 'json',
      querySerializer = globalQuerySerializer ?? defaultQuerySerializer,
      bodySerializer = globalBodySerializer ?? defaultBodySerializer,
      ...init
    } = fetchOptions || {};

    // URL
    const finalURL = createFinalURL(url as string, {
      baseUrl: options.baseUrl,
      params,
      querySerializer,
    });
    const finalHeaders = mergeHeaders(
      DEFAULT_HEADERS,
      clientOptions?.headers,
      headers,
      (params as any).header
    );

    // fetch!
    const requestInit: RequestInit = {
      redirect: 'follow',
      ...options,
      ...init,
      body: requestBody,
      headers: finalHeaders,
    };

    // remove `Content-Type` if serialized body is FormData; browser will correctly set Content-Type & boundary expression

    if (requestInit.body instanceof FormData) {
      finalHeaders.delete('Content-Type');
    } else {
      requestInit.body = bodySerializer(requestBody as any);
    }

    let request: MiddlewareRequest = new Request(finalURL, requestInit) as MiddlewareRequest;

    // middleware (request)
    const mergedOptions: MergedOptions = {
      baseUrl: options.baseUrl!,
      fetch,
      parseAs,
      querySerializer,
      bodySerializer,
    };
    //middleware!

    for (const m of middlewares) {
      if (m && typeof m === 'object' && typeof m.onRequest === 'function') {
        request.schemaPath = url.toString(); // (re)attach original URL
        request.params = params; // (re)attach params
        const result = await m.onRequest(request, mergedOptions);
        if (result) {
          if (request instanceof Error) {
            throw request;
          }
          if (!(result instanceof Request)) {
            throw new Error(`Middleware must return new Request() when modifying the request`);
          }
          request = result as MiddlewareRequest;
        }
      }
    }

    let response = await fetch(request);
    // middleware (response)
    // execute in reverse-array order (first priority gets last transform)
    for (let i = middlewares.length - 1; i >= 0; i--) {
      const m = middlewares[i];
      if (m && typeof m === 'object' && typeof m.onResponse === 'function') {
        const result = await m.onResponse(response, mergedOptions);
        if (result) {
          if (!(result instanceof Response)) {
            throw new Error(`Middleware must return new Response() when modifying the response`);
          }
          response = result;
        }
      }
    }

    if (!response.headers.get('Content-Type')?.includes('application/json')) {
      return { data: response.body as any, response: response as any };
    }

    // handle empty content
    // note: we return `{}` because we want user truthy checks for `.data` or `.error` to succeed
    if (response.status === 204 || response.headers.get('Content-Length') === '0') {
      return response.ok
        ? { data: {} as any, response: response as any }
        : { error: {} as any, response: response as any };
    }
    // parse response (falling back to .text() when necessary)
    if (response.ok) {
      let data: any = response.body;
      if (parseAs !== 'stream') {
        const cloned = response.clone();
        data = typeof cloned[parseAs] === 'function' ? await cloned[parseAs]() : await cloned.text();
      }
      return { data, response: response as any };
    }

    // handle errors (always parse as .json() or .text())
    let error: any = {};
    try {
      error = await response.clone().json();
    } catch {
      error = await response.clone().text();
    }
    return { error, response: response as any };
  }

  return {
    /** Call a GET endpoint */
    async GET<Path extends PathsWithMethod<Paths, 'get'>>(
      url: Path,
      init: MakeObjectsWithoutRequiredKeysOptional<FetchOptions<FilterKeys<Paths[Path], 'get'>>>
    ) {
      return coreFetch<Path, 'get'>(url, { ...init, method: 'get' } as any);
    },
    /** Call a PUT endpoint */
    async PUT<P extends PathsWithMethod<Paths, 'put'>>(
      url: P,
      init: MakeObjectsWithoutRequiredKeysOptional<FetchOptions<FilterKeys<Paths[P], 'put'>>>
    ) {
      return coreFetch<P, 'put'>(url, { ...init, method: 'PUT' } as any);
    },
    /** Call a POST endpoint */
    async POST<P extends PathsWithMethod<Paths, 'post'>>(
      url: P,
      init: MakeObjectsWithoutRequiredKeysOptional<FetchOptions<FilterKeys<Paths[P], 'post'>>>
    ) {
      return coreFetch<P, 'post'>(url, { ...init, method: 'POST' } as any);
    },
    /** Call a DELETE endpoint */
    async DELETE<P extends PathsWithMethod<Paths, 'delete'>>(
      url: P,
      init: MakeObjectsWithoutRequiredKeysOptional<FetchOptions<FilterKeys<Paths[P], 'delete'>>>
    ) {
      return coreFetch<P, 'delete'>(url, { ...init, method: 'DELETE' } as any);
    },
    /** Call a OPTIONS endpoint */
    async OPTIONS<P extends PathsWithMethod<Paths, 'options'>>(
      url: P,
      init: MakeObjectsWithoutRequiredKeysOptional<FetchOptions<FilterKeys<Paths[P], 'options'>>>
    ) {
      return coreFetch<P, 'options'>(url, {
        ...init,
        method: 'OPTIONS',
      } as any);
    },
    /** Call a HEAD endpoint */
    async HEAD<P extends PathsWithMethod<Paths, 'head'>>(
      url: P,
      init: MakeObjectsWithoutRequiredKeysOptional<FetchOptions<FilterKeys<Paths[P], 'head'>>>
    ) {
      return coreFetch<P, 'head'>(url, { ...init, method: 'HEAD' } as any);
    },
    /** Call a PATCH endpoint */
    async PATCH<P extends PathsWithMethod<Paths, 'patch'>>(
      url: P,
      init: MakeObjectsWithoutRequiredKeysOptional<FetchOptions<FilterKeys<Paths[P], 'patch'>>>
    ) {
      return coreFetch<P, 'patch'>(url, { ...init, method: 'PATCH' } as any);
    },
    /** Call a TRACE endpoint */
    async TRACE<P extends PathsWithMethod<Paths, 'trace'>>(
      url: P,
      init: MakeObjectsWithoutRequiredKeysOptional<FetchOptions<FilterKeys<Paths[P], 'trace'>>>
    ) {
      return coreFetch<P, 'trace'>(url, { ...init, method: 'TRACE' } as any);
    },
    /** Register middleware */
    use(...middleware: Middleware[]) {
      if (!middleware || middleware.length === 0) return;
      for (const m of middleware) {
        if (!m) {
          continue;
        }
        if (typeof m !== 'object' || !('onRequest' in m || 'onResponse' in m)) {
          throw new Error('Middleware must be an object with one of `onRequest()` or `onResponse()`');
        }
        middlewares.push(m);
      }
    },
  };
}

// utils

/** serialize query params to string */
export function defaultQuerySerializer<T = unknown>(q: T): string {
  const search = new URLSearchParams();
  if (q && typeof q === 'object') {
    for (const [k, v] of Object.entries(q)) {
      if (v === undefined || v === null) continue;
      search.set(k, v);
    }
  }
  return search.toString();
}

/** serialize body object to string */
export function defaultBodySerializer<T>(body: T): string {
  return JSON.stringify(body);
}

/** Construct URL string from baseUrl and handle path and query params */
export function createFinalURL<O>(
  url: string,
  options: {
    baseUrl?: string;
    params: { query?: Record<string, unknown>; path?: Record<string, unknown> };
    querySerializer: QuerySerializer<O>;
  }
): string {
  let finalURL = `${options.baseUrl ? options.baseUrl.replace(TRAILING_SLASH_RE, '') : ''}${url as string}`;
  if (options.params.path) {
    for (const [k, v] of Object.entries(options.params.path))
      finalURL = finalURL.replace(`{${k}}`, encodeURIComponent(String(v)));
  }
  if (options.params.query) {
    const search = options.querySerializer(options.params.query as any);
    if (search) finalURL += `?${search}`;
  }
  return finalURL;
}

/** merge headers a and b, with b taking priority */
export function mergeHeaders(...allHeaders: (HeadersOptions | undefined)[]): Headers {
  const headers = new Headers();
  for (const headerSet of allHeaders) {
    if (!headerSet || typeof headerSet !== 'object') continue;
    const iterator = headerSet instanceof Headers ? headerSet.entries() : Object.entries(headerSet);
    for (const [k, v] of iterator) {
      if (v === null) {
        headers.delete(k);
      } else if (v !== undefined) {
        headers.set(k, v as any);
      }
    }
  }
  return headers;
}
