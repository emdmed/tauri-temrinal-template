import { useCallback, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

const CLI_CONFIG = {
  'claude-code': {
    command: 'claude',
    displayName: 'Claude Code',
    check: 'claude',
    fallback: 'npx @anthropic-ai/claude-code',
  },
  'opencode': {
    command: 'opencode',
    displayName: 'OpenCode',
    check: 'opencode',
    fallback: null,
  },
};

export function useCliLauncher(terminalSessionId, terminalRef, selectedCli = 'claude-code') {
  const [cliAvailability, setCliAvailability] = useState({
    'claude-code': true,
    'opencode': false,
  });

  useEffect(() => {
    async function checkAvailability() {
      try {
        const opencodeExists = await invoke('check_command_exists', { command: 'opencode' });
        setCliAvailability({
          'claude-code': true,
          'opencode': opencodeExists,
        });
      } catch (error) {
        console.error('Failed to check CLI availability:', error);
      }
    }
    checkAvailability();
  }, [terminalSessionId]);

  const launchCli = useCallback(async () => {
    if (!terminalSessionId) {
      console.warn('Terminal session not ready, cannot launch CLI');
      return;
    }

    const config = CLI_CONFIG[selectedCli];
    if (!config) {
      console.error('Unknown CLI:', selectedCli);
      return;
    }

    try {
      const cliExists = await invoke('check_command_exists', { command: config.check });

      let command;
      if (cliExists) {
        command = config.command + '\r';
      } else if (config.fallback) {
        command = config.fallback + '\r';
      } else {
        console.error(`${selectedCli} is not available and has no fallback`);
        return;
      }

      await invoke('write_to_terminal', {
        sessionId: terminalSessionId,
        data: command,
      });

      terminalRef.current?.focus?.();
    } catch (error) {
      console.error('Failed to launch CLI:', error);
    }
  }, [terminalSessionId, terminalRef, selectedCli]);

  return { launchCli, launchClaude: launchCli, cliAvailability, CLI_CONFIG };
}
