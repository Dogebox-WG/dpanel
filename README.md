# dpanel
Dogebox Panel - Web UI for managing a Dogebox Server

### Directories

`/src`

> All source code lives here. Built with Vite (`npm run build`) into `/dist` for production.

`/dev`

> Test runner configs and tooling to aid in the development process.

To run this in production, serve the `/dist` directory produced by `npm run build` (or the Nix package, which builds the same thing).
To run this locally (with live reload) follow the steps below.

---

### Getting Started

Prerequisites

- Expects to be running in a linux/unix environment (or WSL on Windows)
- Latest `npm` & `node`
- `dogeboxd` cloned alongside this repo (for protobuf definitions)

All commands below run from the repo root.

Install dependencies and start the development servers (protobuf TypeScript
bindings are generated automatically before the servers start, which requires
`dogeboxd` at `../dogeboxd`):

```
npm install
npm run dev
```

Navigate to

```
http://localhost:9090
```

---

### Outcome:

Two live-reloading Vite dev servers:
- **dPanel** (main UI) at [http://localhost:9090](http://localhost:9090)
- **dPanel recovery UI** at [http://localhost:9091](http://localhost:9091)

Both expect a running `dogeboxd` for the API on port 3000 (`make dev` in the
`dogeboxd` repo; the recovery UI additionally needs `make recovery`). Running
`make dev` in `dogeboxd` also serves a production build of dPanel at
[http://localhost:8080](http://localhost:8080) (no live reload), built via this
repo's Nix package — the same derivation the Dogebox OS image ships.