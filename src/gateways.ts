import { ClientCaller } from './client';

export class Gateways {
  constructor(private caller: ClientCaller) {}

  create() {
    console.log(this.caller);
  }
}
