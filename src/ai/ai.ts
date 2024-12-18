import { ClientCaller } from '../client';
import { Predictions } from './predictions';
import { Sandboxes } from './sandboxes';

export class Ai {
  public predictions: Predictions;
  public sandboxes: Sandboxes;

  constructor(caller: ClientCaller) {
    this.predictions = new Predictions(caller);
    this.sandboxes = new Sandboxes(caller);
  }
}
