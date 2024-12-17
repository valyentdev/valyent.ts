import Fleets from './fleets';
import { Gateways } from './gateways';
import { Machines } from './machines';

export const VALYENT_API_ENDPOINT = 'https://api.valyent.dev';

export class Client {
  public fleets: Fleets;
  public machines: Machines;
  public gateways: Gateways;

  constructor(
    namespace: string,
    secret: string,
    endpoint: string = VALYENT_API_ENDPOINT
  ) {
    const caller = new ClientCaller(namespace, secret, endpoint);
    this.fleets = new Fleets(caller);
    this.machines = new Machines();
    this.gateways = new Gateways();
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
  }: {
    path: string;
    payload?: Record<string, any>;
    method: string;
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

    /**
     * Compute body.
     */
    let body: BodyInit | undefined;
    if (payload !== undefined) {
      body = JSON.stringify(payload);
    }

    /**
     * Call Fly.io's Machines API.
     */
    const response = await fetch(url, {
      headers,
      method,
      body,
    });

    return (await response.json()) as T;
  }
}
