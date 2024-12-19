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

  create(fleet: string, payload: CreateGatewayPayload) {
    return this.caller.call<Gateway>({
      path: `/fleets/${fleet}/gateways`,
      method: 'POST',
      payload,
    });
  }

  list(fleet: string) {
    return this.caller.call<Array<Gateway>>({
      path: `/fleets/${fleet}/gateways`,
      method: 'GET',
    });
  }

  get(fleet: string, gateway: string) {
    return this.caller.call<Gateway>({
      path: `/fleets/${fleet}/gateways/${gateway}`,
      method: 'GET',
    });
  }

  delete(fleet: string, gateway: string) {
    return this.caller.call({
      path: `/fleets/${fleet}/gateways/${gateway}`,
      method: 'DELETE',
    });
  }
}
