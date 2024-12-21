import { ClientCaller } from './client';

export class Machines {
  constructor(private caller: ClientCaller) {}

  create(fleet: string, payload: CreateMachinePayload) {
    return this.caller.call<Machine>({
      method: 'POST',
      path: `/fleets/${fleet}/machines`,
      payload,
    });
  }

  list(fleet: string) {
    return this.caller.call<Array<Machine>>({
      method: 'GET',
      path: `/fleets/${fleet}/machines`,
    });
  }

  get(fleet: string, machine: string) {
    return this.caller.call<Machine>({
      method: 'GET',
      path: `/fleets/${fleet}/machines/${machine}`,
    });
  }

  delete(fleet: string, machine: string) {
    return this.caller.call({
      method: 'DELETE',
      path: `/fleets/${fleet}/machines/${machine}`,
      noResponseData: true,
    });
  }

  getLogs(fleet: string, machine: string, follow: boolean = false) {
    return this.caller.call<Array<LogEntry>>({
      method: 'GET',
      path: `/fleets/${fleet}/machines/${machine}/logs?follow=${follow}`,
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
  auto_destroy?: boolean;
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

export type Machine = {
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
  skip_start: boolean;
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
