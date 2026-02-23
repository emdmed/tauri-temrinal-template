import { useState, useEffect, useRef, useCallback } from "react";
import { Terminal } from "./components/Terminal";
import { Layout } from "./components/Layout";
import { StatusBar } from "./components/StatusBar";
import { TitleBar } from "./components/TitleBar";
import { LeftSidebar } from "./components/LeftSidebar";
import { CliSelectionModal } from "./components/CliSelectionModal";
import { KeyboardShortcutsDialog } from "./components/KeyboardShortcutsDialog";
import { useTheme } from "./contexts/ThemeContext";
import { invoke } from "@tauri-apps/api/core";
import { useCwdMonitor } from "./hooks/useCwdMonitor";
import { useBranchName } from "./hooks/useBranchName";
import { useFlatViewNavigation } from "./hooks/useFlatViewNavigation";
import { useViewModeShortcuts } from "./hooks/useViewModeShortcuts";
import { useTextareaShortcuts, saveLastPrompt } from "./hooks/useTextareaShortcuts";
import { useHelpShortcut } from "./hooks/useHelpShortcut";
import { useCliLauncher } from "./hooks/useCliLauncher";
import { escapeShellPath, getRelativePath } from "./utils/pathUtils";
import { ToastContainer } from "./components/ToastContainer";
import { TextareaPanel } from "./components/textarea-panel/TextareaPanel";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useDialogs } from "./hooks/useDialogs";
import { useTerminalSettings } from "./hooks/useTerminalSettings";
import { useFileSelection } from "./contexts/FileSelectionContext";
import { useSidebarSearch } from "./hooks/useSidebarSearch";
import { useTreeView } from "./hooks/useTreeView";
import { useSidebar } from "./hooks/useSidebar";

function App() {
  const { theme } = useTheme();

  // Core terminal state
  const [terminalSessionId, setTerminalSessionId] = useState(null);
  const [terminalKey, setTerminalKey] = useState(0);
  const terminalRef = useRef(null);
  const searchInputRef = useRef(null);

  // Textarea state
  const [textareaVisible, setTextareaVisible] = useState(true);
  const [textareaContent, setTextareaContent] = useState('');
  const textareaRef = useRef(null);
  const [viewMode, setViewMode] = useState('flat');

  // Domain hooks
  const settings = useTerminalSettings();
  const dialogs = useDialogs();

  const { folders, currentPath, setCurrentPath, loadFolders, navigateToParent } = useFlatViewNavigation(terminalSessionId);

  const sidebar = useSidebar({});

  const fileSelection = useFileSelection();

  useEffect(() => {
    fileSelection.registerCurrentPath(currentPath);
  }, [currentPath]);

  const sidebarSearch = useSidebarSearch();

  const treeView = useTreeView({
    terminalSessionId,
    setCurrentPath,
    initializeSearch: sidebarSearch.initializeSearch,
    searchResults: sidebarSearch.searchResults,
  });

  useEffect(() => {
    if (sidebarSearch.searchResults && sidebarSearch.searchResults.length > 0) {
      treeView.expandSearchResults(sidebarSearch.searchResults);
    }
  }, [sidebarSearch.searchResults]);

  // Claude launcher
  const { launchClaude, cliAvailability } = useCliLauncher(terminalSessionId, terminalRef, settings.selectedCli);

  const switchToClaudeMode = useCallback(() => {
    setViewMode('tree');
    sidebar.setSidebarOpen(true);
  }, [sidebar]);

  // Git changes handler
  const handleGitChanges = useCallback((changes) => {
    if (changes.newUntracked.length > 0 && !changes.newDeleted.length && !changes.noLongerUntracked.length) {
      treeView.handleIncrementalUpdate(changes, currentPath);
    } else if (changes.hasChanges) {
      treeView.loadTreeData();
    }
  }, [treeView.handleIncrementalUpdate, treeView.loadTreeData, currentPath]);

  // View git diff
  const viewFileDiff = useCallback((filePath) => {
    dialogs.setDiffFilePath(filePath);
    dialogs.setDiffDialogOpen(true);
  }, [dialogs]);

  // Send file path to terminal
  const sendFileToTerminal = useCallback(async (absolutePath) => {
    if (!terminalSessionId) return;
    try {
      const relativePath = getRelativePath(absolutePath, currentPath);
      const escapedPath = escapeShellPath(relativePath);
      await invoke('write_to_terminal', { sessionId: terminalSessionId, data: `${escapedPath} ` });
      terminalRef.current?.focus?.();
    } catch (error) {
      console.error('Failed to send file to terminal:', absolutePath, error);
    }
  }, [terminalSessionId, currentPath]);

  // Send textarea to terminal
  const sendTextareaToTerminal = useCallback(async () => {
    if (!terminalSessionId || !textareaContent.trim()) return;
    try {
      saveLastPrompt(textareaContent);

      // Build prompt with selected files context
      let prompt = '';
      if (fileSelection.selectedFiles.size > 0) {
        const fileLines = Array.from(fileSelection.selectedFiles).map(f => {
          const rel = getRelativePath(f, currentPath);
          const state = fileSelection.fileStates.get(f) || 'modify';
          return `- ${rel} (${state})`;
        });
        prompt += `Files:\n${fileLines.join('\n')}\n\n`;
      }
      prompt += textareaContent;

      // Send via stdin to avoid arg length limits
      await invoke('write_to_terminal', {
        sessionId: terminalSessionId,
        data: prompt + '\n',
      });

      setTextareaContent('');
      if (!settings.keepFilesAfterSend) {
        fileSelection.clearFileSelection();
      }
      terminalRef.current?.focus?.();
    } catch (error) {
      console.error('Failed to send textarea content:', error);
    }
  }, [terminalSessionId, textareaContent, fileSelection.selectedFiles, fileSelection.fileStates, currentPath, settings.keepFilesAfterSend]);

  // Search focus handler
  const handleSearchFocus = useCallback(() => {
    if (viewMode === 'tree' && sidebar.sidebarOpen) {
      searchInputRef.current?.focus();
    }
  }, [viewMode, sidebar.sidebarOpen]);

  // Keyboard shortcut hooks
  useViewModeShortcuts({
    sidebarOpen: sidebar.sidebarOpen, setSidebarOpen: sidebar.setSidebarOpen,
    viewMode, setViewMode,
    onLoadFlatView: loadFolders, onLoadTreeView: treeView.loadTreeData,
    onLaunchClaude: launchClaude, terminalSessionId,
  });

  useTextareaShortcuts({
    textareaVisible, setTextareaVisible, textareaRef,
    onSendContent: sendTextareaToTerminal,
    onRestoreLastPrompt: setTextareaContent,
  });

  useHelpShortcut({
    showHelp: dialogs.showHelp, setShowHelp: dialogs.setShowHelp,
  });

  // Monitor terminal CWD
  const detectedCwd = useCwdMonitor(terminalSessionId, sidebar.sidebarOpen);

  // Get current git branch
  const branchName = useBranchName(detectedCwd);

  // Clear folder expansion when sidebar closes
  useEffect(() => {
    if (!sidebar.sidebarOpen) {
      treeView.setExpandedFolders(new Set());
    }
  }, [sidebar.sidebarOpen]);

  // Fetch data when sidebar opens
  useEffect(() => {
    if (sidebar.sidebarOpen) {
      if (viewMode === 'flat') loadFolders();
      else if (viewMode === 'tree') treeView.loadTreeData();
    }
  }, [sidebar.sidebarOpen, viewMode]);

  // Auto-refresh sidebar when terminal session becomes available
  useEffect(() => {
    if (terminalSessionId && sidebar.sidebarOpen && folders.length === 0) loadFolders();
  }, [terminalSessionId]);

  // Reload sidebar when CWD changes
  useEffect(() => {
    if (detectedCwd && sidebar.sidebarOpen) {
      if (viewMode === 'flat') loadFolders();
      else if (viewMode === 'tree') {
        treeView.loadTreeData();
        sidebarSearch.setSearchQuery('');
        sidebarSearch.setSearchResults(null);
      }
    }
  }, [detectedCwd, viewMode]);

  // Global keyboard shortcuts
  const viewModeRef = useRef(viewMode);
  const sidebarOpenRef = useRef(sidebar.sidebarOpen);

  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);
  useEffect(() => { sidebarOpenRef.current = sidebar.sidebarOpen; }, [sidebar.sidebarOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && viewModeRef.current === 'tree' && sidebarOpenRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  return (
    <SidebarProvider open={sidebar.sidebarOpen} onOpenChange={sidebar.setSidebarOpen} className={sidebar.isResizing ? 'select-none' : ''} style={{ height: '100%' }}>
      <Layout
        sidebar={
          sidebar.sidebarOpen && (
            <LeftSidebar
              sidebar={sidebar}
              search={sidebarSearch}
              searchInputRef={searchInputRef}
              onSearchChange={useCallback((query) => { sidebarSearch.handleSearchChange(query); }, [sidebarSearch.handleSearchChange])}
              treeView={treeView}
              viewMode={viewMode}
              currentPath={currentPath}
              folders={folders}
              fileWatchingEnabled={true}
              isTextareaPanelOpen={textareaVisible}
              onNavigateParent={navigateToParent}
              onFolderClick={loadFolders}
              hasTerminalSession={!!terminalSessionId}
              sandboxEnabled={settings.sandboxEnabled}
              onSendToTerminal={sendFileToTerminal}
              onViewDiff={viewFileDiff}
              onGitChanges={handleGitChanges}
            />
          )
        }
        textarea={
          textareaVisible && (
            <TextareaPanel
              value={textareaContent}
              onChange={setTextareaContent}
              onSend={sendTextareaToTerminal}
              onClose={() => setTextareaVisible(false)}
              textareaRef={textareaRef}
              disabled={!terminalSessionId}
              selectedFiles={fileSelection.selectedFiles}
              currentPath={currentPath}
              keepFilesAfterSend={settings.keepFilesAfterSend}
              onToggleKeepFiles={settings.setKeepFilesAfterSend}
              fileStates={fileSelection.fileStates}
              onSetFileState={fileSelection.setFileState}
              onToggleFile={fileSelection.toggleFileSelection}
            />
          )
        }
        titleBar={settings.showTitleBar && <TitleBar theme={theme.terminal} />}
        statusBar={
          <StatusBar
            viewMode={viewMode}
            currentPath={currentPath}
            sessionId={terminalSessionId}
            theme={theme.terminal}
            onToggleHelp={useCallback(() => dialogs.setShowHelp(prev => !prev), [dialogs.setShowHelp])}
            selectedCli={settings.selectedCli}
            onOpenCliSettings={() => dialogs.setCliSelectionModalOpen(true)}
            showTitleBar={settings.showTitleBar}
            onToggleTitleBar={() => settings.setShowTitleBar(prev => !prev)}
            sandboxEnabled={settings.sandboxEnabled}
            sandboxFailed={settings.sandboxFailed}
            onToggleSandbox={useCallback(() => {
              settings.setSandboxEnabled(prev => !prev);
              settings.setSandboxFailed(false);
              if (terminalSessionId) {
                invoke('close_terminal', { sessionId: terminalSessionId }).catch(console.error);
              }
              setTerminalSessionId(null);
              setTerminalKey(k => k + 1);
            }, [settings.setSandboxEnabled, settings.setSandboxFailed, terminalSessionId])}
            branchName={branchName}
          />
        }
      >
        <Terminal
          key={terminalKey}
          ref={terminalRef}
          theme={theme.terminal}
          onSessionReady={(id) => setTerminalSessionId(id)}
          onSearchFocus={handleSearchFocus}
          onToggleGitFilter={treeView.handleToggleGitFilter}
          sandboxEnabled={settings.sandboxEnabled}
          networkIsolation={settings.networkIsolation}
          projectDir={currentPath}
          onSandboxFailed={() => settings.setSandboxFailed(true)}
        />
      </Layout>
      <CliSelectionModal
        open={dialogs.cliSelectionModalOpen}
        onOpenChange={dialogs.setCliSelectionModalOpen}
        selectedCli={settings.selectedCli}
        onCliChange={settings.setSelectedCli}
        cliAvailability={cliAvailability}
      />
      <KeyboardShortcutsDialog
        open={dialogs.showHelp}
        onOpenChange={dialogs.setShowHelp}
      />
      <ToastContainer />
    </SidebarProvider>
  );
}

export default App;
