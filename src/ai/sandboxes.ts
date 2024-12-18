import { ClientCaller } from '../client';

export class Sandboxes {
  constructor(private caller: ClientCaller) {}

  create() {
    console.log(this.caller);
  }
}
