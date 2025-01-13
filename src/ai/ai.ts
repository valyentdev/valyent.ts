import { ClientCaller } from '../client';
import { Sandboxes } from './sandboxes';

export class Ai {
  public sandboxes: Sandboxes;

  constructor(caller: ClientCaller) {
    this.sandboxes = new Sandboxes(caller);
  }
}
