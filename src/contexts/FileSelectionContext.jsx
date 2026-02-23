import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { getRelativePath, basename } from '../utils/pathUtils';

const FileSelectionContext = createContext(undefined);

export function FileSelectionProvider({ children }) {
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [fileStates, setFileStates] = useState(new Map());
  const [currentPath, setCurrentPath] = useState('');

  const registerCurrentPath = useCallback((path) => {
    setCurrentPath(path);
  }, []);

  const toggleFileSelection = useCallback((filePath) => {
    setSelectedFiles(prev => {
      const next = new Set(prev);
      if (next.has(filePath)) {
        next.delete(filePath);
        setFileStates(prevStates => {
          const nextStates = new Map(prevStates);
          nextStates.delete(filePath);
          return nextStates;
        });
      } else {
        next.add(filePath);
        setFileStates(prevStates => {
          const nextStates = new Map(prevStates);
          nextStates.set(filePath, 'modify');
          return nextStates;
        });
      }
      return next;
    });
  }, []);

  const removeFileFromSelection = useCallback((filePath) => {
    setSelectedFiles(prev => {
      const next = new Set(prev);
      next.delete(filePath);
      return next;
    });
    setFileStates(prev => {
      const next = new Map(prev);
      next.delete(filePath);
      return next;
    });
  }, []);

  const clearFileSelection = useCallback(() => {
    setSelectedFiles(new Set());
    setFileStates(new Map());
  }, []);

  const setFileState = useCallback((filePath, state) => {
    setFileStates(prev => {
      const next = new Map(prev);
      next.set(filePath, state);
      return next;
    });
  }, []);

  const filesWithRelativePaths = useMemo(() => {
    return Array.from(selectedFiles).map(absPath => ({
      absolute: absPath,
      relative: getRelativePath(absPath, currentPath),
      name: basename(absPath)
    }));
  }, [selectedFiles, currentPath]);

  const value = useMemo(() => ({
    selectedFiles,
    fileStates,
    toggleFileSelection,
    removeFileFromSelection,
    clearFileSelection,
    setFileState,
    filesWithRelativePaths,
    registerCurrentPath,
  }), [
    selectedFiles, fileStates, toggleFileSelection, removeFileFromSelection,
    clearFileSelection, setFileState, filesWithRelativePaths, registerCurrentPath,
  ]);

  return (
    <FileSelectionContext.Provider value={value}>
      {children}
    </FileSelectionContext.Provider>
  );
}

export function useFileSelection() {
  const context = useContext(FileSelectionContext);
  if (context === undefined) {
    throw new Error('useFileSelection must be used within a FileSelectionProvider');
  }
  return context;
}
