# dpanel
Dogebox Panel - Web UI for managing a Dogebox Server

### Directories

`/src`

> All source code lives here.  Whatever is contained in here is published. No build steps, compilation or transformation (at this stage), striving for “what you see is what you get”.

`/dev`

> Dev server, configs and tooling to aid in the development process.

To run this in production, simply serve the /src directory.
To run this locally (with some developer conveniences) follow the steps below.

---

### Getting Started

Prerequisites

- Expects to be running in a linux/unix environment (or WSL on Windows)
- Latest `npm` & `node`
- `dogeboxd` cloned alongside this repo (for protobuf definitions)

All commands below run from the repo root.

Install dependencies and generate protobuf TypeScript bindings (requires `dogeboxd` at `../dogeboxd`):

```
npm install
npm run generate
```

Install dev dependencies and add 3x hostname entries:

```
cd dev
npm run setup
```

Start the development server:

```
npm start
```

Navigate to

```
http://dogebox.local:8080
```

---

### Outcome:

**dPanel** running at [http://dogebox.local:8080](http://dogebox.local:8080), with:
- Hot reloading (auto browser refresh on modify)
- SPA ready (index.html served at all routes)
- Basic CORS configuration
- API mocks (via Ctrl+L)

Two sample '**pups**' (web-apps that dPanel iframes), running at
- [http://basic.pup.dogebox.local:9001](http://basic.pup.dogebox.local:9001)
- [http://spa.pup.dogebox.local:9002](http://spa.pup.dogebox.local:9002)