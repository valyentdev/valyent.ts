import { ClientCaller } from './client';

export type Gateway = {
  id: string;
  name: string;
  namespace: string;
  fleet_id: string;
  protocol: string;
  target_port: number;
};

export type CreateGatewayPayload = {
  name: string;
  fleet: string;
  target_port: number;
};

export class Gateways {
  constructor(private caller: ClientCaller) {}

  create(payload: CreateGatewayPayload) {
    return this.caller.call<Gateway>({
      path: `/gateways`,
      method: 'POST',
      payload,
    });
  }

  list(fleet?: string) {
    return this.caller.call<Array<Gateway>>({
      path: `/gateways?fleet=${fleet}`,
      method: 'GET',
    });
  }

  get(gateway: string) {
    return this.caller.call<Gateway>({
      path: `/gateways/${gateway}`,
      method: 'GET',
    });
  }

  delete(gateway: string) {
    return this.caller.call({
      path: `/gateways/${gateway}`,
      method: 'DELETE',
      expectNoResponseData: true,
    });
  }
}
