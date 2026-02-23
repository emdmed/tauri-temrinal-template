#!/bin/bash
set -e

if [ "$#" -lt 3 ]; then
  echo "Usage: $0 <app-name> <identifier> <display-name>"
  echo "Example: $0 my-terminal com.user.my-terminal \"My Terminal\""
  exit 1
fi

APP_NAME="$1"
IDENTIFIER="$2"
DISPLAY_NAME="$3"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Initializing project: $DISPLAY_NAME ($APP_NAME)"

# Update Cargo.toml
sed -i "s/name = \"tauri-terminal-template\"/name = \"$APP_NAME\"/" "$PROJECT_DIR/src-tauri/Cargo.toml"
sed -i "s/name = \"tauri_terminal_template_lib\"/name = \"${APP_NAME//-/_}_lib\"/" "$PROJECT_DIR/src-tauri/Cargo.toml"
sed -i "s/description = \"A terminal template built with Tauri\"/description = \"$DISPLAY_NAME\"/" "$PROJECT_DIR/src-tauri/Cargo.toml"

# Update main.rs
sed -i "s/tauri_terminal_template_lib/${APP_NAME//-/_}_lib/" "$PROJECT_DIR/src-tauri/src/main.rs"

# Update tauri.conf.json
sed -i "s/\"tauri-terminal-template\"/\"$APP_NAME\"/" "$PROJECT_DIR/src-tauri/tauri.conf.json"
sed -i "s/\"com.tauri.terminal.template\"/\"$IDENTIFIER\"/" "$PROJECT_DIR/src-tauri/tauri.conf.json"
sed -i "s/\"Terminal Template\"/\"$DISPLAY_NAME\"/" "$PROJECT_DIR/src-tauri/tauri.conf.json"

# Update package.json
sed -i "s/\"name\": \"tauri-terminal-template\"/\"name\": \"$APP_NAME\"/" "$PROJECT_DIR/package.json"

echo "Done! Project initialized as '$DISPLAY_NAME'"
echo "Run 'npm install && npm run dev' to start developing."
