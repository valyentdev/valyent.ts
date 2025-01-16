import Fleets from './fleets';
import { Gateways } from './gateways';
import { Machines } from './machines';

export const VALYENT_API_ENDPOINT = 'https://console.valyent.cloud';

export class Client {
  public fleets: Fleets;
  public gateways: Gateways;
  public machines: Machines;

  constructor(
    apiToken: string,
    namespace?: string,
    endpoint: string = VALYENT_API_ENDPOINT
  ) {
    const ravelCaller = new ClientCaller(apiToken, endpoint, namespace);
    this.fleets = new Fleets(ravelCaller);
    this.gateways = new Gateways(ravelCaller);
    this.machines = new Machines(ravelCaller);
  }
}

export class FetchErrorWithPayload extends Error {
  constructor(
    message: string,
    public payload: Record<string, string | Record<string, string>>
  ) {
    super(message);
  }
}

export class ClientCaller {
  constructor(
    public apiToken: string,
    public endpoint: string,
    public namespace?: string
  ) {}

  async call<T>({
    path,
    payload,
    method,
    expectNoResponseData,
    expectTextResponse,
    queryParams,
  }: {
    path: string;
    payload?: Record<string, any>;
    method: string;
    expectNoResponseData?: boolean;
    expectTextResponse?: boolean;
    queryParams?: Record<string, string | number | undefined>;
  }): Promise<T> {
    /**
     * Compute URL.
     */
    const url = new URL(path, this.endpoint);
    if (this.namespace) url.searchParams.set('namespace', this.namespace);

    if (queryParams) {
      for (const param in queryParams) {
        if (queryParams[param] !== undefined) {
          url.searchParams.set(param, queryParams[param]!.toString());
        }
      }
    }

    /**
     * Compute headers.
     */
    const headers = new Headers();
    headers.append('Authorization', `Bearer ${this.apiToken}`);
    headers.append('Content-Type', 'application/json');
    headers.append('Accept', 'application/json');

    /**
     * Compute body.
     */
    let body: BodyInit | undefined;
    if (payload !== undefined) {
      body = JSON.stringify(payload);
    }

    /**
     * Call Ravel API.
     */
    const response = await fetch(url, {
      headers,
      method,
      body,
    });

    if (!response.ok) {
      let data: any;
      try {
        data = await response.json();
      } catch {
        throw new Error(
          `Request failed with status: ${response.status} (${response.statusText})`
        );
      }
      throw new FetchErrorWithPayload(
        `Request failed with status: ${response.status} (${response.statusText})`,
        data
      );
    }

    if (expectNoResponseData) {
      return (undefined as unknown) as T;
    }

    if (expectTextResponse) {
      return ((await response.text()) as unknown) as T;
    } else {
      const data = (await response.json()) as T;
      return data;
    }
  }
}
