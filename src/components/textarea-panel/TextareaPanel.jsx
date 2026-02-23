import React, { useMemo, useCallback } from "react";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { ActionButtons } from "./ActionButtons";
import { Button } from "../ui/button";
import { Send } from "lucide-react";

export function TextareaPanel({
  value,
  onChange,
  onSend,
  onClose,
  textareaRef,
  disabled = false,
  selectedFiles,
  currentPath,
  keepFilesAfterSend = false,
  onToggleKeepFiles,
  fileStates,
  onSetFileState,
  onToggleFile,
}) {
  const fileArray = useMemo(() => Array.from(selectedFiles || new Set()), [selectedFiles]);

  const handleKeyDown = useCallback((e) => {
    // Ctrl+Enter handled by useTextareaShortcuts
  }, []);

  const isSendDisabled = disabled || !value?.trim();

  return (
    <div className="flex flex-col border-t border-t-sketch bg-background p-2 gap-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 bg-secondary/20 rounded px-2 py-1">
          {onToggleKeepFiles && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="keep-files"
                checked={keepFilesAfterSend}
                onCheckedChange={onToggleKeepFiles}
                disabled={disabled}
              />
              <label htmlFor="keep-files" className="text-muted-foreground cursor-pointer select-none text-xs">
                keep files
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="min-h-[120px] max-h-[300px] relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? "Waiting for terminal session..." : "Type your command here... (Ctrl+Enter to send)"}
          aria-label="Multi-line command input"
          className="w-full h-full resize-none"
        />
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground font-mono text-xs">
          Ctrl+Enter: send
        </span>
        <Button
          onClick={onSend}
          disabled={isSendDisabled}
          size="sm"
          className="gap-1.5"
        >
          <Send className="w-3 h-3" />
          Send
        </Button>
      </div>
    </div>
  );
}
