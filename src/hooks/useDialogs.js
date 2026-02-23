import { useState } from "react";

export function useDialogs() {
  const [diffDialogOpen, setDiffDialogOpen] = useState(false);
  const [diffFilePath, setDiffFilePath] = useState(null);
  const [cliSelectionModalOpen, setCliSelectionModalOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  return {
    diffDialogOpen, setDiffDialogOpen,
    diffFilePath, setDiffFilePath,
    cliSelectionModalOpen, setCliSelectionModalOpen,
    showHelp, setShowHelp,
  };
}
