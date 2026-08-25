# Global Keyboard Shortcuts System (#636)

The **Global Keyboard Shortcuts System** provides configurable, accessible, and input-safe keyboard shortcuts throughout DevLink.

---

## Configured Shortcuts

| Shortcut | Description | Category |
|---|---|---|
| `/` | Focus search / Open global search modal | Actions |
| `Ctrl / ⌘ + K` | Toggle Command Palette | Actions |
| `N` | Open New Project dialog | Actions |
| `G H` | Go to Home dashboard (Key chord) | Navigation |
| `G P` | Go to Projects explorer (Key chord) | Navigation |
| `Esc` | Close active modal, dialog, or overlay | General |
| `?` (`Shift + /`) | Open Keyboard Shortcuts help documentation modal | General |

---

## Safety & Accessibility Features

- **Input Guard**: Single-key shortcuts (`/`, `N`, `G H`, `G P`, `?`) are automatically disabled while cursor focus is inside form input elements (`<input>`, `<textarea>`, `<select>`, `[contenteditable]`).
- **Sequential Key Chords**: Multi-key sequences (`G` followed by `H` or `P` within 1000ms) allow fast, intuitive navigation without modifier key conflicts.
- **Accessibility Documentation**: Pressing `?` opens an accessible dialog displaying shortcut cheat-sheets formatted with `<kbd>` badges.
