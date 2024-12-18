import { ClientCaller } from '../client';

export class Predictions {
  constructor(private caller: ClientCaller) {}

  run() {
    console.log(this.caller);
  }
}
