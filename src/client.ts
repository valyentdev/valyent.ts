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
    namespace: string,
    secret: string,
    endpoint: string = VALYENT_API_ENDPOINT
  ) {
    const ravelCaller = new ClientCaller(namespace, secret, endpoint);
    this.fleets = new Fleets(ravelCaller);
    this.gateways = new Gateways(ravelCaller);
    this.machines = new Machines(ravelCaller);

    const valyentCaller = new ClientCaller(namespace, secret, endpoint);
    this.ai = new Ai(valyentCaller);
  }
}

export class ClientCaller {
  constructor(
    private namespace: string,
    private secret: string,
    private endpoint: string
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
    url.searchParams.set('namespace', this.namespace);

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
      throw new Error();
    }

    if (noResponseData) {
      return null as T;
    }

    const data = (await response.json()) as T;
    return data;
  }
}
