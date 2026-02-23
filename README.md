# Tauri Terminal Template

A starter template for building desktop apps that wrap CLI tools. It gives you a terminal, a file browser, a prompt textarea, and a theme system out of the box — so you can focus on your tool, not the shell plumbing.

Built with Tauri 2, React 19, xterm.js, and Rust.

## Getting Started

```bash
# Clone the template
git clone https://github.com/youruser/tauri-terminal-template.git my-app
cd my-app

# Rename everything to your project
./scripts/init-project.sh my-app com.yourname.my-app "My App"

# Install and run
npm install
npm run dev
```

The init script updates `package.json`, `Cargo.toml`, `tauri.conf.json`, and `main.rs` so you don't have to find-and-replace by hand.

## What You Get

- **Interactive terminal** with a real PTY backend (not a fake shell)
- **Hidden PTY** for running CLI commands programmatically and capturing output
- **File browser** sidebar with flat and tree views, git status badges, and file search
- **Prompt textarea** for composing multi-line input before sending it to the terminal
- **CLI launcher** that detects installed CLIs and launches them with one shortcut
- **21 themes** you can switch at runtime
- **Linux sandboxing** via bubblewrap (optional)

## Build Your Own Tool

This template is designed to be forked and customized. Here are the most common things you'll want to do:

### Register a new CLI

If your app wraps a specific CLI tool, add it to `src/hooks/useCliLauncher.js`:

```js
const CLI_CONFIG = {
  'my-tool': {
    command: 'mytool',
    displayName: 'My Tool',
    check: 'mytool',           // used to verify the binary exists
    fallback: 'npx my-tool',   // optional: run via npx if not installed
  },
};
```

Users can then launch it with **Ctrl+K**.

### Run a CLI headlessly

The hidden PTY lets you run any command in the background and stream its output — no terminal UI needed. This is useful for building features that invoke a CLI and process the result.

```js
import { useHiddenPty } from './hooks/useHiddenPty';

const { run, output, status, reset } = useHiddenPty();

await run({
  command: "mytool analyze src/",
  projectDir: '/path/to/project',
});

// status: 'idle' | 'running' | 'done' | 'error'
// output: accumulated stdout as a string
```

### Add a Tauri command (Rust side)

When you need to expose new native functionality to the frontend:

1. Write your function in `src-tauri/src/pty/commands.rs` or create a new module under `src-tauri/src/fs/`
2. Register it in `src-tauri/src/lib.rs` inside the `invoke_handler` macro
3. Call it from React:
   ```js
   import { invoke } from '@tauri-apps/api/core';
   const result = await invoke('my_command', { path: '/some/path' });
   ```

### Customize the layout

The main layout is composed in `src/App.jsx`. It's built from swappable pieces:

- **Sidebar** — file browser on the left (flat list or tree view)
- **Terminal** — the main xterm.js pane
- **TextareaPanel** — multi-line prompt input below the terminal
- **StatusBar** — bottom bar with branch name, settings, CLI selector

You can remove, rearrange, or replace any of these components.

### Add or modify themes

Themes live in `src/themes/`. Each theme is a JS object defining terminal colors and UI colors. Add a new file, export your theme, and it will be available in the theme picker.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+S | Toggle sidebar |
| Ctrl+K | Launch CLI |
| Ctrl+T | Focus prompt textarea |
| Ctrl+Enter | Send textarea content to terminal |
| Ctrl+Shift+Z | Restore last prompt |
| Ctrl+F | Focus file search (in tree view) |
| Ctrl+G | Toggle git-only filter |
| Ctrl+W | Toggle file watchers |
| Ctrl+H | Show keyboard shortcuts |

## Project Structure

```
src-tauri/src/
├── lib.rs            # App setup and command registration
├── state.rs          # Shared state (PTY session map)
├── git_cache.rs      # Git status caching
├── pty/
│   ├── manager.rs    # PTY spawn, I/O, optional sandboxing
│   └── commands.rs   # Tauri commands: terminal, hidden PTY, git
└── fs/
    ├── directory.rs   # Read files and directories
    ├── cwd.rs         # Detect terminal working directory
    ├── git.rs         # Git status, diff, branch, file watchers
    └── commands.rs    # check_command_exists

src/
├── App.jsx            # Main layout and orchestration
├── hooks/
│   ├── useTerminal.js       # xterm.js PTY lifecycle
│   ├── useHiddenPty.js      # Headless CLI invocation
│   ├── useCliLauncher.js    # CLI detection and launch
│   ├── useCwdMonitor.js     # Working directory polling
│   └── ...
├── components/
│   ├── Terminal.jsx
│   ├── LeftSidebar.jsx
│   ├── textarea-panel/
│   ├── file-tree/
│   └── ui/            # Radix UI primitives
├── contexts/          # Theme, Toast, FileSelection
└── themes/            # 21 color themes
```

## Development

```bash
npm run dev           # Tauri + Vite dev server with hot reload
npm run build         # Build the frontend
npm run tauri:build   # Build the full native app
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://rustup.rs/)
- [Tauri 2 prerequisites](https://v2.tauri.app/start/prerequisites/) for your platform

## License

MIT
