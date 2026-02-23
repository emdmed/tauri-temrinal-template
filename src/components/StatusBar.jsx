import { useState } from 'react';
import { ThemeSwitcher } from './ThemeSwitcher';
import {
  Keyboard, Eye, EyeOff, Bot, Terminal, MoreVertical,
  PanelTop, PanelTopClose, Shield, ShieldOff, ShieldAlert,
  AlertCircle,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from "./ui/badge.jsx";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuShortcut,
} from './ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from './ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

const CLI_DISPLAY = {
  'claude-code': { name: 'Claude Code', icon: Bot },
  'opencode': { name: 'opencode', icon: Terminal }
};

function CliIcon({ cli }) {
  const Icon = CLI_DISPLAY[cli]?.icon || Terminal;
  return <Icon className="w-3 h-3" />;
}

function SandboxButton({ enabled, failed, onToggle }) {
  const getIcon = () => {
    if (enabled && failed) return <ShieldAlert className="w-3 h-3" style={{ color: '#FF9E3B' }} />;
    if (enabled) return <Shield className="w-3 h-3" />;
    return <ShieldOff className="w-3 h-3" style={{ color: '#E82424' }} />;
  };

  const getTooltip = () => {
    if (enabled && failed) return 'Sandbox: FAILED';
    if (enabled) return 'Sandbox: ON';
    return 'Sandbox: OFF';
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="xs" onClick={onToggle} className="gap-1 px-1.5">
          {getIcon()}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{getTooltip()}</TooltipContent>
    </Tooltip>
  );
}

export const StatusBar = ({
  viewMode, currentPath, sessionId, theme, onToggleHelp,
  selectedCli, onOpenCliSettings, showTitleBar,
  onToggleTitleBar, sandboxEnabled, sandboxFailed,
  onToggleSandbox, branchName,
}) => {
  const [showSandboxConfirm, setShowSandboxConfirm] = useState(false);

  const cliName = CLI_DISPLAY[selectedCli]?.name || selectedCli;

  const handleSandboxToggle = () => {
    if (sessionId) {
      setShowSandboxConfirm(true);
    } else {
      onToggleSandbox();
    }
  };

  const confirmSandboxToggle = () => {
    setShowSandboxConfirm(false);
    onToggleSandbox();
  };

  return (
    <>
    <div
      className="flex items-center justify-between px-4 py-2 border-t border-t-sketch text-xs font-mono"
      style={{
        backgroundColor: theme.background || '#1F1F28',
        color: theme.foreground || '#DCD7BA',
        height: '32px',
      }}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="overflow-hidden whitespace-nowrap text-ellipsis">
          {currentPath ? currentPath.split('/').pop() || '~' : '~'}
        </span>
        {branchName && (
          <Badge variant="secondary">
            {branchName}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1">
        {/* Environment Zone */}
        <div className="flex items-center gap-0.5 bg-secondary/30 rounded px-1.5 py-0.5">
          {selectedCli && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="xs" onClick={onOpenCliSettings} className="gap-1.5 px-1.5 h-5">
                  <CliIcon cli={selectedCli} />
                  <span className="opacity-70">{cliName}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Change CLI tool (Ctrl+K)</TooltipContent>
            </Tooltip>
          )}
          <div className="w-px h-3 bg-border/30 mx-0.5" />
          <SandboxButton enabled={sandboxEnabled} failed={sandboxFailed} onToggle={handleSandboxToggle} />
        </div>

        <div className="w-px h-4 bg-border/50 mx-1" />

        {/* App Controls Zone */}
        <div className="flex items-center gap-0.5">
          <ThemeSwitcher />
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="xs" className="h-6 w-6 p-0" aria-label="Open settings menu">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-56 text-xs">
              <DropdownMenuItem onClick={onToggleHelp} className="cursor-pointer py-1">
                <Keyboard className="mr-2 w-3 h-3" />
                Keyboard Shortcuts
                <DropdownMenuShortcut>Ctrl+H</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleTitleBar} className="cursor-pointer py-1">
                {showTitleBar ? <PanelTop className="mr-2 w-3 h-3" /> : <PanelTopClose className="mr-2 w-3 h-3" />}
                Title Bar: {showTitleBar ? 'ON' : 'OFF'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>

    <Dialog open={showSandboxConfirm} onOpenChange={setShowSandboxConfirm}>
      <DialogContent className="sm:max-w-[440px] border-destructive/30 border-sketch bg-destructive/5">
        <DialogHeader className="gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/20">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle className="text-base font-semibold">
              Toggle Sandbox Mode?
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            This will <span className="font-medium text-destructive">reset and restart</span> your terminal session.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-end gap-2 sm:justify-end mt-4">
          <Button variant="outline" size="sm" onClick={() => setShowSandboxConfirm(false)} className="border-sketch">
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={confirmSandboxToggle}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};
