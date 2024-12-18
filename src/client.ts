import { Ai } from './ai/ai';
import Fleets from './fleets';
import { Gateways } from './gateways';
import { Machines } from './machines';

export const VALYENT_API_ENDPOINT = 'https://api.valyent.dev';
export const RAVEL_API_ENDPOINT = 'https://ravel.valyent.dev';

export class Client {
  public ai: Ai;
  public fleets: Fleets;
  public gateways: Gateways;
  public machines: Machines;

  constructor(
    namespace: string,
    secret: string,
    ravelEndpoint: string = VALYENT_API_ENDPOINT,
    valyentEndpoint: string = RAVEL_API_ENDPOINT
  ) {
    const ravelCaller = new ClientCaller(namespace, secret, ravelEndpoint);
    this.fleets = new Fleets(ravelCaller);
    this.gateways = new Gateways(ravelCaller);
    this.machines = new Machines(ravelCaller);

    const valyentCaller = new ClientCaller(namespace, secret, valyentEndpoint);
    this.ai = new Ai(valyentCaller);
  }
}

export class Success<Value> {
  public readonly success = true;

  constructor(public readonly value: Value) {}
}

export class Failure<Reason extends Error> {
  public readonly success = false;

  constructor(public readonly reason: Reason) {}
}

export type Result<Value, Reason extends Error = Error> =
  | { success: true; value: Value }
  | { success: false; reason: Reason };

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
  }): Promise<Result<T>> {
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

    if (!response.ok) {
      return new Failure(
        new Error(`HTTP request failed: ${response.statusText}.`)
      );
    }

    try {
      const data = (await response.json()) as T;
      return new Success(data);
    } catch {
      return new Failure(new Error('Failed to read JSON data.'));
    }
  }
}
