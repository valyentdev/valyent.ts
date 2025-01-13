import { ClientCaller } from '../../client';
import { Machine, Machines } from '../../machines';
import { Execution, extractError, parseOutput } from './messaging';
import {
  readLines,
  formatExecutionTimeoutError,
  formatRequestTimeoutError,
} from './utils';

const DEFAULT_TIMEOUT_MS = 60_000; // 1 minute

export type SandboxType = 'code-interpreter' | 'computer-use';

export type SandboxRecord = {
  id: string;
  startedAt: number;
  endedAt: number;
  type: SandboxType;
  url: string;
};

export class Sandboxes {
  constructor(private caller: ClientCaller) {}

  async create(type: SandboxType) {
    const record = await this.caller.call<SandboxRecord>({
      method: 'POST',
      path: `/organizations/${this.caller.namespace}/ai/sandboxes`,
      payload: { type },
    });
    return new Sandbox(this.caller, record);
  }

  async get(sandboxId: string) {
    const record = await this.caller.call<SandboxRecord>({
      method: 'GET',
      path: `/organizations/${this.caller.namespace}/ai/sandboxes/${sandboxId}`,
    });
    return new Sandbox(this.caller, record);
  }
}

export class Sandbox extends Machine {
  constructor(private caller: ClientCaller, private record: SandboxRecord) {
    super(record.id, 'sandboxes', new Machines(caller));
  }

  async runCode(code: string, language?: string): Promise<Execution> {
    const controller = new AbortController();

    /**
     * TODO: Make request timeout customizable.
     */
    const requestTimeout = DEFAULT_TIMEOUT_MS;

    const reqTimer = requestTimeout
      ? setTimeout(() => {
          controller.abort();
        }, requestTimeout)
      : undefined;

    const url = new URL('/execute', this.record.url);

    try {
      const response = await fetch(url, {
        body: JSON.stringify({ code, language }),
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.caller.apiToken}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        keepalive: true,
      });
      const error = await extractError(response);
      if (error) {
        throw error;
      }

      if (!response.body) {
        throw new Error(
          `Not response body: ${response.statusText} ${await response?.text()}`
        );
      }

      clearTimeout(reqTimer);

      const bodyTimeout = DEFAULT_TIMEOUT_MS;

      const bodyTimer = bodyTimeout
        ? setTimeout(() => {
            controller.abort();
          }, bodyTimeout)
        : undefined;

      const execution = new Execution();

      try {
        for await (const chunk of readLines(response.body)) {
          await parseOutput(execution, chunk);
        }
      } catch (error) {
        throw formatExecutionTimeoutError(error);
      } finally {
        clearTimeout(bodyTimer);
      }

      return execution;
    } catch (error) {
      throw formatRequestTimeoutError(error);
    }
  }
}
