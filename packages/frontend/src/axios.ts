// This a simple wrapper around restyped-axios to improve typing

import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'restyped-axios';
import { RestypedBase, RestypedIndexedBase, RestypedRoute } from 'restyped';

export interface TypedAxiosRequestConfig<
  API extends RestypedIndexedBase,
  Path extends Extract<keyof API, string>,
  Method extends keyof API[Path],
  RouteDef extends RestypedRoute = API[Path][Method]
> extends AxiosRequestConfig {
    url?: Path;
    method?: Extract<Method, string>;
    params?: RouteDef['query'];
    data?: RouteDef['body'];
}

export interface TypedAxiosResponse<
  API extends RestypedIndexedBase,
  Path extends Extract<keyof API, string>, Method extends keyof API[Path],
  RouteDef extends RestypedRoute = API[Path][Method]
> extends AxiosResponse {
    data: RouteDef['response'];
    config: TypedAxiosRequestConfig<API, Path, Method>;
}
export interface TypedAxiosInstance<API extends RestypedBase = any> extends AxiosInstance {
    request<Path extends Extract<keyof API, string>, Method extends keyof API[Path] = 'GET'>(
      config: TypedAxiosRequestConfig<API, Path, Method>,
    ): Promise<TypedAxiosResponse<API, Path, Method>>;

    get<Path extends Extract<keyof API, string>>(
      url: Path, config?: TypedAxiosRequestConfig<API, Path, 'GET'>,
    ): Promise<TypedAxiosResponse<API, Path, 'GET'>>;

    delete<Path extends Extract<keyof API, string>>(
      url: Path, config?: TypedAxiosRequestConfig<API, Path, 'DELETE'>,
    ): Promise<TypedAxiosResponse<API, Path, 'DELETE'>>;

    head<Path extends Extract<keyof API, string>>(
      url: Path, config?: TypedAxiosRequestConfig<API, Path, 'HEAD'>,
    ): Promise<TypedAxiosResponse<API, Path, 'HEAD'>>;

    post<Path extends Extract<keyof API, string>>(
      url: Path, data?: API[Path]['POST']['body'], config?: TypedAxiosRequestConfig<API, Path, 'POST'>,
    ): Promise<TypedAxiosResponse<API, Path, 'POST'>>;

    put<Path extends Extract<keyof API, string>>(
      url: Path, data?: API[Path]['PUT']['body'], config?: TypedAxiosRequestConfig<API, Path, 'PUT'>,
    ): Promise<TypedAxiosResponse<API, Path, 'PUT'>>;

    patch<Path extends Extract<keyof API, string>>(
      url: Path, data?: API[Path]['PATCH']['body'], config?: TypedAxiosRequestConfig<API, Path, 'PATCH'>,
    ): Promise<TypedAxiosResponse<API, Path, 'PATCH'>>;

}

export interface TypedAxiosStatic<API extends RestypedBase = any> extends TypedAxiosInstance<API> {
  create<T extends API>(config?: AxiosRequestConfig): TypedAxiosInstance<T>;
}

const TypedAxios: TypedAxiosStatic = axios;
export default TypedAxios;
