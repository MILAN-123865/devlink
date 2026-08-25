import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { KEYBOARD_SHORTCUTS, type KeyboardShortcutConfig } from "@/config/keyboardShortcuts";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsModal({ open, onOpenChange }: KeyboardShortcutsModalProps) {
  const categories: Array<KeyboardShortcutConfig["category"]> = [
    "Actions",
    "Navigation",
    "General",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Keyboard className="h-5 w-5 text-primary" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use keyboard shortcuts to navigate and perform actions quickly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {categories.map((category) => {
            const items = KEYBOARD_SHORTCUTS.filter((s) => s.category === category);
            if (!items.length) return null;

            return (
              <div key={category} className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {category}
                </h4>
                <div className="space-y-1.5 rounded-lg border border-border bg-card p-2.5">
                  {items.map((shortcut) => (
                    <div
                      key={shortcut.id}
                      className="flex items-center justify-between py-1 text-sm text-card-foreground"
                    >
                      <span className="font-medium">{shortcut.label}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, i) => (
                          <kbd
                            key={i}
                            className="inline-flex h-6 min-w-[24px] items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-[11px] font-semibold text-muted-foreground shadow-xs"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
