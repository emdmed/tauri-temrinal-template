# Tauri Terminal Template

A reusable Tauri + React + xterm.js template for building GUI wrappers around CLI tools.

## Quick Start

```bash
# 1. Clone/copy this template
# 2. Initialize with your project name
./scripts/init-project.sh my-app com.user.my-app "My App"

# 3. Install and run
npm install
npm run dev
```

## Features

- **Interactive Terminal**: Full xterm.js terminal with PTY backend
- **Hidden PTY**: Headless CLI invocation for programmatic use
- **File Browser**: Sidebar with flat and tree views, git status badges
- **CWD Sync**: Sidebar stays in sync with terminal working directory
- **Prompt Textarea**: Send multi-line input to the terminal
- **CLI Launcher**: Configurable CLI detection and launch (Claude Code, OpenCode)
- **21 Themes**: Light, dark, and colorful themes
- **Linux Sandboxing**: Optional bubblewrap (bwrap) sandboxing

## Architecture

### Two PTY Modes

1. **Interactive Terminal** — xterm.js in the UI, user types directly
2. **Hidden PTY** — headless CLI: send a command, get output back via events

### Hidden PTY Usage

```js
import { useHiddenPty } from './hooks/useHiddenPty';

const { run, output, status, reset } = useHiddenPty();

// Run any CLI command headlessly
await run({
  command: "claude --print 'Explain this code'",
  projectDir: '/path/to/project',
});
// status: 'idle' | 'running' | 'done' | 'error'
// output: accumulated stdout string
```

### Adding a New CLI

Edit `src/hooks/useCliLauncher.js`:

```js
const CLI_CONFIG = {
  'claude-code': { command: 'claude', displayName: 'Claude Code', check: 'claude', fallback: 'npx @anthropic-ai/claude-code' },
  'opencode': { command: 'opencode', displayName: 'OpenCode', check: 'opencode', fallback: null },
  // Add your CLI here:
  'my-cli': { command: 'mycli', displayName: 'My CLI', check: 'mycli', fallback: null },
};
```

### Adding a New Tauri Command

1. Add function in `src-tauri/src/pty/commands.rs` or `src-tauri/src/fs/`
2. Register in `src-tauri/src/lib.rs` invoke_handler
3. Call from React via `invoke('command_name', { params })`

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+S | Toggle Navigation Mode |
| Ctrl+K | Launch CLI / Toggle Claude Mode |
| Ctrl+T | Focus Textarea Panel |
| Ctrl+Enter | Send Textarea Content |
| Ctrl+Shift+Z | Restore Last Prompt |
| Ctrl+F | Focus File Search |
| Ctrl+G | Toggle Git Filter |
| Ctrl+W | Toggle File Watchers |
| Ctrl+H | Keyboard Shortcuts Dialog |

## Development Commands

```bash
npm run dev         # Start dev server (Tauri + Vite)
npm run build       # Build frontend
npm run tauri:build # Build full application
```

## Project Structure

```
src-tauri/src/
├── lib.rs          # Tauri app setup and command registration
├── state.rs        # AppState with PTY session map
├── git_cache.rs    # Git stats caching
├── pty/
│   ├── manager.rs  # PTY spawn/IO with optional sandboxing
│   └── commands.rs # Terminal commands + hidden PTY + git
└── fs/
    ├── directory.rs # File/directory reading
    ├── cwd.rs       # Terminal CWD detection
    ├── git.rs       # Git stats, diff, branch, file watchers
    └── commands.rs  # check_command_exists

src/
├── App.jsx         # Main app orchestration
├── hooks/
│   ├── useTerminal.js       # xterm.js PTY lifecycle
│   ├── useHiddenPty.js      # Headless CLI invocation
│   ├── useCliLauncher.js    # CLI detection and launch
│   ├── useCwdMonitor.js     # CWD polling
│   └── ...                  # Sidebar, search, shortcuts
├── components/
│   ├── Terminal.jsx
│   ├── LeftSidebar.jsx
│   ├── textarea-panel/
│   ├── file-tree/
│   └── ui/                  # Radix primitives
├── contexts/                # Theme, Toast, FileSelection
└── themes/                  # 21 color themes
```
