# Valyent TypeScript SDK

Official TypeScript SDK for interacting with the Valyent Cloud platform.

## Installation

```bash
# npm
npm install valyent.ts

# yarn
yarn add valyent.ts

# pnpm
pnpm add valyent.ts

# bun
bun add valyent.ts
```

## Quick Start

```typescript
import { Client } from 'valyent.ts';

// Initialize the client
const client = new Client('your-api-token');

// Create a new fleet
const fleet = await client.fleets.create({ name: 'my-fleet' });

// Deploy a machine in your fleet
const machine = await client.machines.create(fleet.id, {
  region: 'gra-1',
  config: {
    image: 'nginx:latest',
    guest: {
      cpu_kind: 'shared',
      memory_mb: 512,
      cpus: 1,
    },
    workload: {
      env: ['PORT=8080'],
    },
  },
});
```

## Core Concepts

### Client

The Client class is the main entry point for interacting with the Valyent Cloud API. It provides access to all available resources through dedicated sub-clients.

```typescript
const client = new Client(
  apiToken: string,
  namespace?: string,
  endpoint: string = 'https://console.valyent.cloud'
);
```

### Fleets

Fleets are logical groupings of machines. They help organize your resources and manage them collectively.

```typescript
// List all fleets
const fleets = await client.fleets.list();

// Create a new fleet
const fleet = await client.fleets.create({
  name: 'production-fleet',
});

// Get fleet details
const fleet = await client.fleets.get('fleet-id');

// Delete a fleet
await client.fleets.delete('fleet-id');
```

### Machines

Machines are the compute instances running your workloads. Each machine runs in a microVM with its own resources and configuration.

```typescript
// Create a new machine
const machine = await client.machines.create('fleet-id', {
  region: 'us-east-1',
  config: {
    image: 'my-image:latest',
    guest: {
      cpu_kind: 'shared',
      memory_mb: 1024,
      cpus: 2,
    },
    workload: {
      env: ['KEY=value'],
      restart: {
        policy: 'always',
        max_retries: 3,
      },
    },
  },
});

// List machines in a fleet
const machines = await client.machines.list('fleet-id');

// Get machine details
const machine = await client.machines.get('fleet-id', 'machine-id');

// Start a machine
await machine.start();

// Stop a machine
await machine.stop({
  timeout: 30,
  signal: 'SIGTERM',
});

// Delete a machine
await machine.delete();
```

### Machine Configuration

The machine configuration consists of several key components:

- **image** (string, required): Docker image to run in the machine

- **guest** (object, required):

  - cpu_kind (string, required): Type of CPU allocation
  - memory_mb (number, required): Memory allocation in MB (minimum: 1)
  - cpus (number, required): Number of CPU cores (minimum: 1)

- **workload** (object, required):

  - env (string[]): Environment variables
  - restart:
    - policy (string): One of: 'always', 'on-failure', 'never'
    - max_retries (number): Maximum number of restart attempts
  - init:
    - cmd (string[]): Command to run
    - entrypoint (string[]): Container entrypoint
    - user (string): User to run as

- **stop_config**:

  - timeout (number): Stop timeout in seconds
  - signal (string): Signal to send (e.g., 'SIGTERM')

- **auto_destroy** (boolean): Whether to automatically destroy the machine when stopped

### Gateways

Gateways provide network access to your machines. They can be used to expose services running in your machines.

```typescript
// Create a gateway
const gateway = await client.gateways.create('fleet-id', {
  name: 'web-gateway',
  target_port: 8080,
});

// List gateways
const gateways = await client.gateways.list('fleet-id');

// Get gateway details
const gateway = await client.gateways.get('fleet-id', 'gateway-id');

// Delete a gateway
await client.gateways.delete('fleet-id', 'gateway-id');
```

### Filesystem Operations

The SDK provides access to the machine's filesystem through the fs property on machine instances.

```typescript
// List directory contents
const entries = await machine.fs.ls('/app');

// Create a directory
await machine.fs.mkdir('/app/data');

// Read file contents
const content = await machine.fs.readFile('/app/config.json');

// Remove a file or directory
await machine.fs.rm('/app/temp');

// Get file/directory information
await machine.fs.stat('/app/logs');
```

### Logs and Events

You can access machine logs and events for monitoring and debugging:

```typescript
// Get machine logs
const logs = await machine.getLogs();

// Stream logs in real-time
for await (const log of client.machines.getLogsStream(
  'fleet-id',
  'machine-id'
)) {
  console.log(log.message);
}

// List machine events
const events = await machine.listEvents();
```

### Machine States

Machines can be in the following states:

- created: Initial state after creation
- preparing: Machine is being prepared
- starting: Machine is starting up
- running: Machine is running
- stopping: Machine is being stopped
- stopped: Machine has stopped
- destroying: Machine is being destroyed
- destroyed: Machine has been destroyed

You can wait for a specific machine state:

```typescript
// Wait for machine to be in running state
await machine.wait('running', 60); // timeout in seconds
```

## Error Handling

The SDK throws FetchErrorWithPayload for API errors, which includes both the error message and the response payload:

```typescript
try {
  await client.machines.create(/* ... */);
} catch (error) {
  if (error instanceof FetchErrorWithPayload) {
    console.error('API Error:', error.message);
    console.error('Error Details:', error.payload);
  }
}
```

## Best Practices

1. **Resource Cleanup**: Always clean up resources when they're no longer needed:

```typescript
await machine.stop();
await machine.delete();
```

2. **Error Handling**: Implement proper error handling for API calls to handle network issues and API errors gracefully.

3. **Configuration Management**: Keep machine configurations in version control and use environment variables for dynamic values.

4. **Monitoring**: Use the logs and events APIs to monitor your machines' health and troubleshoot issues.

## TypeScript Support

The SDK is written in TypeScript and provides full type definitions for all APIs. You can import types directly:

```typescript
import type {
  MachineConfig,
  GuestConfig,
  Workload,
  MachineStatus,
} from "valyent.ts";
```
