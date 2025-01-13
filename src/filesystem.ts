import { ClientCaller } from './client';

export type FSEntry = {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  mod_time: number;
};

/**
 * Filesystem wraps a series of operations on the filesystem, provided by Ravel initd API.
 */
export class Filesystem {
  private clientCaller: ClientCaller;

  constructor(apiToken: string, machineID: string) {
    this.clientCaller = new ClientCaller(
      apiToken,
      `${machineID}-initd.valyent.dev`
    );
  }

  ls(path: string = '/') {
    return this.clientCaller.call<Array<FSEntry>>({
      method: 'GET',
      path: `/fs/ls?path=${path}`,
    });
  }

  mkdir(dir: string) {
    return this.clientCaller.call({
      expectNoResponseData: true,
      method: 'POST',
      path: `/fs/mkdir`,
      payload: { dir },
    });
  }

  readFile(path: string) {
    return this.clientCaller.call<string>({
      method: 'POST',
      path: `/fs/read?path=${path}`,
      expectTextResponse: true,
    });
  }

  uploadFile() {}

  rm(path: string) {
    return this.clientCaller.call<string>({
      method: 'POST',
      path: `/fs/rm?path=${path}`,
      expectNoResponseData: true,
    });
  }

  stat(path: string) {
    return this.clientCaller.call<string>({
      method: 'GET',
      path: `/fs/stat?path=${path}`,
      expectNoResponseData: true,
    });
  }

  watch() {}
}
