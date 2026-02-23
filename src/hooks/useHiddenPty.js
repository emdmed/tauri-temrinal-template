import { useState, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export function useHiddenPty() {
  const [status, setStatus] = useState('idle');
  const [output, setOutput] = useState('');
  const sessionRef = useRef(null);
  const unlistenRefs = useRef([]);

  const run = useCallback(async ({ command, projectDir }) => {
    setStatus('running');
    setOutput('');

    const unlistenOutput = await listen('hidden-terminal-output', (event) => {
      if (event.payload.session_id === sessionRef.current) {
        setOutput(prev => prev + event.payload.data);
      }
    });

    const unlistenClose = await listen('hidden-terminal-closed', (event) => {
      if (event.payload.session_id === sessionRef.current) {
        setStatus(event.payload.error ? 'error' : 'done');
        unlistenOutput();
        unlistenClose();
      }
    });

    unlistenRefs.current = [unlistenOutput, unlistenClose];

    const sessionId = await invoke('spawn_hidden_terminal', { projectDir, command });
    sessionRef.current = sessionId;
    return sessionId;
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setOutput('');
    unlistenRefs.current.forEach(fn => fn());
    unlistenRefs.current = [];
  }, []);

  return { run, output, status, reset };
}
