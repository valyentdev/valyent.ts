import { Ai } from './ai/ai';
import Fleets from './fleets';
import { Gateways } from './gateways';
import { Machines } from './machines';

export const VALYENT_API_ENDPOINT = 'https://console.valyent.cloud';

export class Client {
  public ai: Ai;
  public fleets: Fleets;
  public gateways: Gateways;
  public machines: Machines;

  constructor(
    secret: string,
    namespace?: string,
    endpoint: string = VALYENT_API_ENDPOINT
  ) {
    const ravelCaller = new ClientCaller(secret, endpoint, namespace);
    this.fleets = new Fleets(ravelCaller);
    this.gateways = new Gateways(ravelCaller);
    this.machines = new Machines(ravelCaller);

    const valyentCaller = new ClientCaller(secret, endpoint, namespace);
    this.ai = new Ai(valyentCaller);
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
    private secret: string,
    public endpoint: string,
    public namespace?: string
  ) {}

  async call<T>({
    path,
    payload,
    method,
    noResponseData,
  }: {
    path: string;
    payload?: Record<string, any>;
    method: string;
    noResponseData?: boolean;
  }): Promise<T> {
    /**
     * Compute URL.
     */
    const url = new URL(path, this.endpoint);
    if (this.namespace) url.searchParams.set('namespace', this.namespace);

    /**
     * Compute headers.
     */
    const headers = new Headers();
    headers.append('Authorization', `Bearer ${this.secret}`);
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

    if (noResponseData) {
      return (undefined as unknown) as T;
    }

    const data = (await response.json()) as T;
    return data;
  }
}
