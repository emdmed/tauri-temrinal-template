import { useEffect, useRef } from 'react';

const LAST_PROMPT_KEY = 'terminal-template:last-prompt';

export const saveLastPrompt = (prompt) => {
  if (!prompt?.trim()) return;
  try {
    localStorage.setItem(LAST_PROMPT_KEY, prompt);
  } catch (error) {
    console.warn('Failed to save last prompt:', error);
  }
};

export const getLastPrompt = () => {
  try {
    return localStorage.getItem(LAST_PROMPT_KEY);
  } catch (error) {
    console.warn('Failed to get last prompt:', error);
    return null;
  }
};

export function useTextareaShortcuts({
  textareaVisible,
  setTextareaVisible,
  textareaRef,
  onSendContent,
  onRestoreLastPrompt,
  secondaryTerminalFocused,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (secondaryTerminalFocused) return;

      // Ctrl+T: Focus textarea
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        e.stopPropagation();
        textareaRef.current?.focus();
        return;
      }

      // Ctrl+Enter: Send content to terminal (only when textarea focused)
      if (e.ctrlKey && e.key === 'Enter') {
        if (document.activeElement === textareaRef.current) {
          e.preventDefault();
          e.stopPropagation();
          onSendContent();
        }
        return;
      }

      // Ctrl+Shift+Z: Restore last prompt (only when textarea is focused and empty)
      if (e.ctrlKey && e.shiftKey && e.key === 'Z') {
        if (document.activeElement === textareaRef.current) {
          const textarea = textareaRef.current;
          if (!textarea.value?.trim()) {
            const lastPrompt = getLastPrompt();
            if (lastPrompt) {
              e.preventDefault();
              e.stopPropagation();
              onRestoreLastPrompt?.(lastPrompt);
            }
          }
        }
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [textareaVisible, setTextareaVisible, textareaRef, onSendContent, onRestoreLastPrompt, secondaryTerminalFocused]);
}
