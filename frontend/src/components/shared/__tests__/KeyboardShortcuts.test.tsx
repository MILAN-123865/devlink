import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { isEditableElement } from "@/context/KeyboardShortcutContext";
import { KeyboardShortcutsModal } from "@/components/shared/KeyboardShortcutsModal";
import { KEYBOARD_SHORTCUTS } from "@/config/keyboardShortcuts";

describe("Keyboard Shortcuts System", () => {
  it("correctly identifies editable form elements", () => {
    const input = document.createElement("input");
    const textarea = document.createElement("textarea");
    const select = document.createElement("select");
    const contentEditable = document.createElement("div");
    contentEditable.setAttribute("contenteditable", "true");
    const button = document.createElement("button");

    expect(isEditableElement(input)).toBe(true);
    expect(isEditableElement(textarea)).toBe(true);
    expect(isEditableElement(select)).toBe(true);
    expect(isEditableElement(contentEditable)).toBe(true);
    expect(isEditableElement(button)).toBe(false);
    expect(isEditableElement(null)).toBe(false);
  });

  it("renders keyboard shortcuts modal with correct keys and categories", () => {
    render(<KeyboardShortcutsModal open={true} onOpenChange={vi.fn()} />);

    expect(screen.getAllByText("Keyboard Shortcuts").length).toBeGreaterThan(0);
    expect(screen.getByText("Focus Search")).toBeInTheDocument();
    expect(screen.getByText("Command Palette")).toBeInTheDocument();
    expect(screen.getByText("New Project")).toBeInTheDocument();
    expect(screen.getByText("Go to Home")).toBeInTheDocument();
    expect(screen.getByText("Go to Projects")).toBeInTheDocument();
  });

  it("contains all required shortcuts in configuration registry", () => {
    const ids = KEYBOARD_SHORTCUTS.map((s) => s.id);
    expect(ids).toContain("search");
    expect(ids).toContain("command_palette");
    expect(ids).toContain("new_project");
    expect(ids).toContain("go_home");
    expect(ids).toContain("go_projects");
    expect(ids).toContain("close_modal");
  });
});
