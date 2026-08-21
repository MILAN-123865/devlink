export interface KeyboardShortcutConfig {
  id: string;
  category: "Navigation" | "Actions" | "General";
  keys: string[];
  label: string;
  description: string;
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcutConfig[] = [
  {
    id: "search",
    category: "Actions",
    keys: ["/"],
    label: "Focus Search",
    description: "Open search modal and focus global search input",
  },
  {
    id: "command_palette",
    category: "Actions",
    keys: ["Ctrl / ⌘", "K"],
    label: "Command Palette",
    description: "Open command palette for quick commands and search",
  },
  {
    id: "new_project",
    category: "Actions",
    keys: ["N"],
    label: "New Project",
    description: "Open create new project dialog",
  },
  {
    id: "go_home",
    category: "Navigation",
    keys: ["G", "H"],
    label: "Go to Home",
    description: "Navigate to home dashboard page",
  },
  {
    id: "go_projects",
    category: "Navigation",
    keys: ["G", "P"],
    label: "Go to Projects",
    description: "Navigate to projects explorer page",
  },
  {
    id: "close_modal",
    category: "General",
    keys: ["Esc"],
    label: "Close Modal",
    description: "Close active modal, dialog, or overlay",
  },
  {
    id: "help",
    category: "General",
    keys: ["?"],
    label: "Keyboard Shortcuts",
    description: "Show keyboard shortcuts reference documentation",
  },
];
