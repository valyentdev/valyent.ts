import { ClientCaller } from './client';

export type Fleet = {
  id: string;
  namespace: string;
  name: string;
  created_at: string;
  status: FleetStatus;
};

export type FleetStatus = 'active' | 'destroyed';

export type CreateFleetPayload = {
  name: string;
};

export default class Fleets {
  constructor(private caller: ClientCaller) {}

  async create(payload: CreateFleetPayload) {
    return this.caller.call<Fleet>({
      method: 'POST',
      path: '/fleets',
      payload,
    });
  }

  async list() {
    return this.caller.call<Array<Fleet>>({
      method: 'GET',
      path: '/fleets',
    });
  }

  async get(fleet: string) {
    return this.caller.call<Fleet>({
      method: 'GET',
      path: `/fleets/${fleet}`,
    });
  }

  async delete(fleet: string) {
    return this.caller.call({
      method: 'DELETE',
      path: `/fleets/${fleet}`,
    });
  }
}
