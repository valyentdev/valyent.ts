import { ClientCaller } from './client';
import { Filesystem } from './filesystem';
import { ExecOptions, ExecResult } from './machines';

/**
 * Initd wraps a series of operations provided by Ravel initd API.
 */
export class Initd {
  private caller: ClientCaller;
  public fs: Filesystem;

  constructor(apiToken: string, machineID: string) {
    this.caller = new ClientCaller(apiToken, `${machineID}-initd.valyent.dev`);
    this.fs = new Filesystem(this.caller);
  }

  exec(options: ExecOptions): Promise<ExecResult> {
    return this.caller.call<ExecResult>({
      method: 'POST',
      path: `/exec`,
      payload: options,
    });
  }
}
