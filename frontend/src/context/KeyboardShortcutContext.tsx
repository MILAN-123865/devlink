import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { GlobalSearchModal } from "@/components/search/GlobalSearchModal";
import { CommandPalette, type CommandPaletteItemBase } from "@/components/command-palette/CommandPalette";
import { useCommandSearch } from "@/hooks/useCommandSearch";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { KeyboardShortcutsModal } from "@/components/shared/KeyboardShortcutsModal";

interface KeyboardShortcutContextType {
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isCreateProjectOpen: boolean;
  setIsCreateProjectOpen: (open: boolean) => void;
  isHelpOpen: boolean;
  setIsHelpOpen: (open: boolean) => void;
}

const KeyboardShortcutContext = createContext<KeyboardShortcutContextType | undefined>(undefined);

export function isEditableElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  if (tagName === "input" || tagName === "textarea" || tagName === "select") return true;
  if (target.getAttribute("contenteditable") === "true") return true;
  return false;
}

function CommandPaletteWrapper({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const searchResults = useCommandSearch("");

  const formattedResults = useMemo(() => {
    return [
      { group: "pages" as const, items: searchResults.pages },
      { group: "projects" as const, items: searchResults.projects },
      { group: "developers" as const, items: searchResults.developers },
    ];
  }, [searchResults]);

  const handleSelect = useCallback(
    (item: CommandPaletteItemBase) => {
      onOpenChange(false);
      if (item.id === "home") navigate({ to: "/" });
      else if (item.id === "projects") navigate({ to: "/projects" });
      else if (item.id === "builders") navigate({ to: "/builders" });
      else if (item.id === "dashboard") navigate({ to: "/dashboard" });
    },
    [navigate, onOpenChange],
  );

  return (
    <CommandPalette
      open={open}
      onOpenChange={onOpenChange}
      results={formattedResults}
      onSelect={handleSelect}
    />
  );
}

export function KeyboardShortcutProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const chordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chordPrefixRef = useRef<string | null>(null);

  const clearChord = useCallback(() => {
    chordPrefixRef.current = null;
    if (chordTimerRef.current) {
      clearTimeout(chordTimerRef.current);
      chordTimerRef.current = null;
    }
  }, []);

  const closeAllModals = useCallback(() => {
    setIsSearchOpen(false);
    setIsCommandPaletteOpen(false);
    setIsCreateProjectOpen(false);
    setIsHelpOpen(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key;
      const lowerKey = key.toLowerCase();
      const isCmdOrCtrl = event.metaKey || event.ctrlKey;
      const inInput = isEditableElement(event.target);

      // 1. Esc: Close active modal
      if (key === "Escape") {
        if (isSearchOpen || isCommandPaletteOpen || isCreateProjectOpen || isHelpOpen) {
          event.preventDefault();
          closeAllModals();
          return;
        }
      }

      // 2. Ctrl/Cmd + K: Command Palette
      if (isCmdOrCtrl && lowerKey === "k") {
        event.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Stop single-key shortcuts if inside an editable input
      if (inInput) {
        clearChord();
        return;
      }

      // 3. Sequential Chords (G H, G P)
      if (chordPrefixRef.current === "g") {
        clearChord();
        if (lowerKey === "h") {
          event.preventDefault();
          navigate({ to: "/" });
          return;
        }
        if (lowerKey === "p") {
          event.preventDefault();
          navigate({ to: "/projects" });
          return;
        }
      }

      if (lowerKey === "g" && !isCmdOrCtrl) {
        chordPrefixRef.current = "g";
        if (chordTimerRef.current) clearTimeout(chordTimerRef.current);
        chordTimerRef.current = setTimeout(() => {
          clearChord();
        }, 1000);
        return;
      }

      // 4. Single-key actions outside inputs
      if (!isCmdOrCtrl && !event.altKey) {
        if (key === "/") {
          event.preventDefault();
          setIsSearchOpen(true);
          return;
        }
        if (lowerKey === "n") {
          event.preventDefault();
          setIsCreateProjectOpen(true);
          return;
        }
        if (key === "?") {
          event.preventDefault();
          setIsHelpOpen(true);
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearChord();
    };
  }, [
    isSearchOpen,
    isCommandPaletteOpen,
    isCreateProjectOpen,
    isHelpOpen,
    navigate,
    closeAllModals,
    clearChord,
  ]);

  return (
    <KeyboardShortcutContext.Provider
      value={{
        isSearchOpen,
        setIsSearchOpen,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        isCreateProjectOpen,
        setIsCreateProjectOpen,
        isHelpOpen,
        setIsHelpOpen,
      }}
    >
      {children}

      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <CommandPaletteWrapper
        open={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
      />

      <CreateProjectDialog
        open={isCreateProjectOpen}
        onOpenChange={setIsCreateProjectOpen}
      />

      <KeyboardShortcutsModal open={isHelpOpen} onOpenChange={setIsHelpOpen} />
    </KeyboardShortcutContext.Provider>
  );
}

export function useKeyboardShortcuts() {
  const context = useContext(KeyboardShortcutContext);
  if (!context) {
    throw new Error("useKeyboardShortcuts must be used within a KeyboardShortcutProvider");
  }
  return context;
}
