import { ClientCaller, FetchErrorWithPayload } from './client';
import { Initd } from './initd';

export class Machine {
  public initd: Initd;

  constructor(
    public id: string,
    private fleetId: string,
    private machines: Machines
  ) {
    this.initd = new Initd(this.machines.caller.apiToken, id);
  }

  listEvents() {
    return this.machines.listEvents(this.fleetId, this.id);
  }

  getLogs() {
    return this.machines.getLogs(this.fleetId, this.id);
  }

  start() {
    return this.machines.start(this.fleetId, this.id);
  }

  stop(config: StopConfig) {
    return this.machines.stop(this.fleetId, this.id, config);
  }

  delete() {
    return this.machines.delete(this.fleetId, this.id);
  }

  wait(status: string, timeoutInSeconds?: number) {
    return this.machines.wait(this.fleetId, this.id, status, timeoutInSeconds);
  }

  exec(options: ExecOptions) {
    return this.machines.exec(this.fleetId, this.id, options);
  }
}

export class Machines {
  constructor(public caller: ClientCaller) {}

  async create(fleet: string, payload: CreateMachinePayload): Promise<Machine> {
    const record = await this.createRecord(fleet, payload);
    return new Machine(record.id, fleet, this);
  }

  createRecord(
    fleet: string,
    payload: CreateMachinePayload
  ): Promise<MachineRecord> {
    return this.caller.call<MachineRecord>({
      method: 'POST',
      path: `/fleets/${fleet}/machines`,
      payload,
    });
  }

  async list(fleet: string): Promise<Array<Machine>> {
    const records = await this.listRecords(fleet);
    const machines: Machine[] = [];
    for (const record of records) {
      machines.push(new Machine(record.id, fleet, this));
    }
    return machines;
  }

  listRecords(fleet: string): Promise<Array<MachineRecord>> {
    return this.caller.call<Array<MachineRecord>>({
      method: 'GET',
      path: `/fleets/${fleet}/machines`,
    });
  }

  async get(fleet: string, machine: string): Promise<Machine> {
    const record = await this.getRecord(fleet, machine);
    return new Machine(record.id, fleet, this);
  }

  getRecord(fleet: string, machine: string): Promise<MachineRecord> {
    return this.caller.call<MachineRecord>({
      method: 'GET',
      path: `/fleets/${fleet}/machines/${machine}`,
    });
  }

  delete(fleet: string, machine: string, force: boolean = false) {
    return this.caller.call({
      method: 'DELETE',
      path: `/fleets/${fleet}/machines/${machine}?force=${force}`,
      expectNoResponseData: true,
    });
  }

  getLogs(fleet: string, machine: string): Promise<Array<LogEntry>> {
    return this.caller.call<Array<LogEntry>>({
      method: 'GET',
      path: `/fleets/${fleet}/machines/${machine}/logs`,
    });
  }

  async *getLogsStream(
    fleet: string,
    machine: string
  ): AsyncIterableIterator<LogEntry> {
    const url = new URL(
      `/fleets/${fleet}/machines/${machine}/logs`,
      this.caller.endpoint
    );
    url.searchParams.set('follow', 'true');
    if (this.caller.namespace) {
      url.searchParams.set('namespace', this.caller.namespace);
    }

    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) {
      let data: any;
      try {
        data = await response.json();
      } catch {
        throw new FetchErrorWithPayload(
          `Failed to fetch NDJSON stream: ${response.status} (${response.statusText})`,
          {
            url: url.toString(),
          }
        );
      }
      throw new FetchErrorWithPayload(
        `Failed to fetch NDJSON stream: ${response.status} (${response.statusText})`,
        { ...data, url: url.toString() }
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No reader available on response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    // Create an async generator to yield logs as they are parsed
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process lines in the buffer
      let boundary = buffer.indexOf('\n');
      while (boundary !== -1) {
        const line = buffer.slice(0, boundary);
        try {
          const jsonObject = JSON.parse(line);
          yield jsonObject; // Yield each parsed log entry
        } catch (err) {
          console.error('Error parsing line:', err);
        }

        // Slice off the processed line
        buffer = buffer.slice(boundary + 1);
        boundary = buffer.indexOf('\n');
      }
    }
  }

  listEvents(fleet: string, machine: string): Promise<Array<MachineEvent>> {
    return this.caller.call<Array<MachineEvent>>({
      method: 'GET',
      path: `/fleets/${fleet}/machines/${machine}/events`,
    });
  }

  start(fleet: string, machine: string): Promise<void> {
    return this.caller.call({
      method: 'POST',
      path: `/fleets/${fleet}/machines/${machine}/start`,
      expectNoResponseData: true,
    });
  }

  stop(fleet: string, machine: string, config: StopConfig): Promise<void> {
    return this.caller.call({
      method: 'POST',
      path: `/fleets/${fleet}/machines/${machine}/stop`,
      payload: config,
      expectNoResponseData: true,
    });
  }

  exec(
    fleet: string,
    machine: string,
    options: ExecOptions
  ): Promise<ExecResult> {
    return this.caller.call<ExecResult>({
      method: 'POST',
      path: `/fleets/${fleet}/machines/${machine}/exec`,
      payload: options,
    });
  }

  wait(
    fleet: string,
    machine: string,
    status: string,
    timeoutInSeconds?: number
  ): Promise<void> {
    return this.caller.call({
      method: 'GET',
      path: `/fleets/${fleet}/machines/${machine}/wait`,
      expectNoResponseData: true,
      queryParams: { status, timeout: timeoutInSeconds },
    });
  }
}

export type LogEntry = {
  timestamp: number;
  instance_id: string;
  source: string;
  level: string;
  message: string;
};

export type StopConfig = {
  timeout?: number; // in seconds
  signal?: string;
};

export type MachineConfig = {
  image: string;
  guest: GuestConfig;
  workload: Workload;
  stop_config?: StopConfig;
};

export type GuestConfig = {
  cpu_kind: string;
  memory_mb: number; // minimum: 1
  cpus: number; // minimum: 1
};

export type Workload = {
  restart?: RestartPolicyConfig;
  env?: string[];
  init?: InitConfig;
  auto_destroy?: boolean;
};

export type InitConfig = {
  cmd?: string[];
  entrypoint?: string[];
  user?: string;
};

export type RestartPolicyConfig = {
  policy?: RestartPolicy;
  max_retries?: number;
};

export type Resources = {
  cpus_mhz: number; // in MHz
  memory_mb: number; // in MB
};

export type MachineRecord = {
  id: string;
  namespace: string;
  fleet: string;
  instance_id: string;
  machine_version: string;
  region: string;
  config: MachineConfig;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  events: MachineEvent[];
  state: MachineStatus;
};

export type MachineEvent = {
  id: string;
  machine_id: string;
  instance_id: string;
  status: MachineStatus;
  type: MachineEventType;
  origin: Origin;
  payload: MachineEventPayload;
  timestamp: string; // ISO date string
};

export type MachineEventPayload = {
  prepare_failed?: MachinePrepareFailedEventPayload;
  stop?: MachineStopEventPayload;
  start?: MachineStartEventPayload;
  start_failed?: MachineStartFailedEventPayload;
  started?: MachineStartedEventPayload;
  stopped?: MachineExitedEventPayload;
  destroy?: MachineDestroyEventPayload;
};

export type CreateMachinePayload = {
  region: string;
  config: MachineConfig;
  skip_start?: boolean;
  enable_machine_gateway?: boolean;
};

export type MachineStartEventPayload = {
  is_restart: boolean;
};

export type MachineStopEventPayload = {
  config?: StopConfig;
};

export type MachinePrepareFailedEventPayload = {
  error: string;
};

export type MachineStartFailedEventPayload = {
  error: string;
};

export type MachineStartedEventPayload = {
  started_at: string; // ISO date string
};

export type MachineExitedEventPayload = {
  exit_code: number;
  exited_at: string; // ISO date string
};

export type MachineDestroyEventPayload = {
  auto_destroy: boolean;
  reason: string;
  force: boolean;
};

export type ExecOptions = {
  cmd: string[];
  timeout_ms: number;
};

export type ExecResult = {
  stderr: string;
  stdout: string;
  exit_code: number;
};

export enum MachineStatus {
  Created = 'created',
  Preparing = 'preparing',
  Starting = 'starting',
  Running = 'running',
  Stopping = 'stopping',
  Stopped = 'stopped',
  Destroying = 'destroying',
  Destroyed = 'destroyed',
}

export enum RestartPolicy {
  Always = 'always',
  OnFailure = 'on-failure',
  Never = 'never',
}

export enum MachineEventType {
  MachineCreated = 'machine.created',
  MachinePrepare = 'machine.prepare',
  MachinePrepared = 'machine.prepared',
  MachinePrepareFailed = 'machine.prepare_failed',
  MachineStart = 'machine.start',
  MachineStartFailed = 'machine.start_failed',
  MachineStarted = 'machine.started',
  MachineStop = 'machine.stop',
  MachineStopFailed = 'machine.stop_failed',
  MachineExited = 'machine.exited',
  MachineDestroy = 'machine.destroy',
  MachineDestroyed = 'machine.destroyed',
}

export enum Origin {
  Ravel = 'ravel',
  User = 'user',
}
