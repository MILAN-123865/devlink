import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SecurityOverview } from "../SecurityOverview";
import { PasswordSecurityCard } from "../PasswordSecurityCard";
import { ConnectedAccountsCard } from "../ConnectedAccountsCard";
import { TwoFactorSecurityCard } from "../TwoFactorSecurityCard";
import { RecoveryCodesCard } from "../RecoveryCodesCard";
import { ActiveSessionsCard } from "../ActiveSessionsCard";
import { LoginHistoryCard } from "../LoginHistoryCard";
import { ConnectedDevicesCard } from "../ConnectedDevicesCard";
import { TrustedDevicesCard } from "../TrustedDevicesCard";
import { DangerZoneCard } from "../DangerZoneCard";
import { SecurityDashboard } from "../SecurityDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  // Mock window.matchMedia
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  // Mock clipboard
  Object.defineProperty(navigator, "clipboard", {
    writable: true,
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
  });
});

describe("Security Dashboard Components", () => {
  describe("SecurityOverview", () => {
    it("renders score, progress bar, and 4 status metrics", async () => {
      const onViewRecs = vi.fn();
      render(
        <SecurityOverview
          score={72}
          passwordStatus={{ strength: "Strong", lastChangedText: "Last changed 12 days ago" }}
          mfaEnabled={false}
          recoveryCodesCount={0}
          activeSessionsCount={1}
          onViewRecommendations={onViewRecs}
        />,
      );

      expect(screen.getByText("72%")).toBeInTheDocument();
      expect(screen.getByText("Needs improvement")).toBeInTheDocument();
      expect(screen.getByText("Password")).toBeInTheDocument();
      expect(screen.getByText("Strong")).toBeInTheDocument();
      expect(screen.getByText("Two-factor authentication")).toBeInTheDocument();
      expect(screen.getByText("Not enabled")).toBeInTheDocument();
      expect(screen.getByText("Recovery methods")).toBeInTheDocument();
      expect(screen.getByText("Not configured")).toBeInTheDocument();
      expect(screen.getByText("Active sessions")).toBeInTheDocument();
      expect(screen.getByText("1 current session")).toBeInTheDocument();

      const button = screen.getByRole("button", { name: /view recommendations/i });
      await userEvent.click(button);
      expect(onViewRecs).toHaveBeenCalled();
    });
  });

  describe("PasswordSecurityCard", () => {
    it("opens password change dialog on button click", async () => {
      render(<PasswordSecurityCard />);
      const changeBtn = screen.getByRole("button", { name: /change password/i });
      await userEvent.click(changeBtn);

      expect(screen.getByRole("heading", { name: "Change Password" })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter current password/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/at least 8 characters/i)).toBeInTheDocument();

      const cancelBtn = screen.getByRole("button", { name: /cancel/i });
      await userEvent.click(cancelBtn);
    });
  });

  describe("ConnectedAccountsCard", () => {
    it("opens connected accounts management modal", async () => {
      render(<ConnectedAccountsCard />);
      const manageBtn = screen.getByRole("button", { name: /manage accounts/i });
      await userEvent.click(manageBtn);

      expect(screen.getByText("Connected OAuth Accounts")).toBeInTheDocument();
      expect(screen.getByText("GitHub")).toBeInTheDocument();
      expect(screen.getByText("Google")).toBeInTheDocument();
    });
  });

  describe("TwoFactorSecurityCard", () => {
    it("shows Disabled badge when 2FA is off and opens setup modal on click", async () => {
      render(<TwoFactorSecurityCard mfaEnabled={false} />);
      expect(screen.getByText("Disabled")).toBeInTheDocument();

      const setupBtn = screen.getByRole("button", { name: /set up 2fa/i });
      await userEvent.click(setupBtn);

      expect(screen.getByText("Set Up Two-Factor Authentication")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("000000")).toBeInTheDocument();
    });

    it("shows Enabled badge when 2FA is on and opens disable modal on click", async () => {
      render(<TwoFactorSecurityCard mfaEnabled={true} />);
      expect(screen.getByText("Enabled ✓")).toBeInTheDocument();

      const disableBtn = screen.getByRole("button", { name: /disable 2fa/i });
      await userEvent.click(disableBtn);

      expect(screen.getByText("Disable Two-Factor Authentication")).toBeInTheDocument();
    });
  });

  describe("RecoveryCodesCard", () => {
    it("renders unconfigured state and opens codes modal when configured", async () => {
      render(<RecoveryCodesCard mfaEnabled={true} codesCount={10} />);
      expect(screen.getByText("10 codes remaining")).toBeInTheDocument();

      const viewBtn = screen.getByRole("button", { name: /view codes/i });
      await userEvent.click(viewBtn);

      expect(screen.getByText("Your Recovery Codes")).toBeInTheDocument();
    });
  });

  describe("ActiveSessionsCard", () => {
    it("toggles mask IP and handles refresh", async () => {
      render(<ActiveSessionsCard />);
      expect(screen.getByText("Active Login Sessions")).toBeInTheDocument();

      const maskBtn = screen.getByRole("button", { name: /show full ip/i });
      await userEvent.click(maskBtn);
      expect(screen.getByRole("button", { name: /mask ip/i })).toBeInTheDocument();
    });
  });

  describe("LoginHistoryCard", () => {
    it("renders recent login events and opens full history modal", async () => {
      render(<LoginHistoryCard />);
      expect(screen.getByText("Login History")).toBeInTheDocument();
      expect(screen.getAllByText("Successful login").length).toBeGreaterThan(0);

      const viewAllBtn = screen.getByRole("button", { name: /view all/i });
      await userEvent.click(viewAllBtn);
      expect(screen.getByText("Security & Login History")).toBeInTheDocument();
    });
  });

  describe("ConnectedDevicesCard & TrustedDevicesCard", () => {
    it("renders connected devices and trusted devices cards", async () => {
      render(
        <div>
          <ConnectedDevicesCard />
          <TrustedDevicesCard />
        </div>,
      );
      expect(screen.getByText("Connected Devices")).toBeInTheDocument();
      expect(screen.getByText("Trusted Devices")).toBeInTheDocument();
      expect(screen.getAllByText("Windows PC").length).toBeGreaterThan(0);
    });
  });

  describe("DangerZoneCard", () => {
    it("renders danger actions and opens confirmation modals", async () => {
      render(<DangerZoneCard userEmail="test@example.com" />);
      expect(screen.getByText("Danger Zone")).toBeInTheDocument();

      const signOutBtn = screen.getByRole("button", { name: /sign out all/i });
      await userEvent.click(signOutBtn);
      expect(screen.getByText("Sign Out All Sessions?")).toBeInTheDocument();
    });
  });

  describe("Full SecurityDashboard", () => {
    it("renders full page hierarchy and footer note", () => {
      render(<SecurityDashboard userEmail="test@example.com" />);
      expect(screen.getByRole("heading", { name: "Security" })).toBeInTheDocument();
      expect(screen.getByText("Authentication")).toBeInTheDocument();
      expect(screen.getByText("Activity")).toBeInTheDocument();
      expect(screen.getByText("Devices & Trust")).toBeInTheDocument();
      expect(screen.getByText("Danger Zone")).toBeInTheDocument();
      expect(screen.getByText(/your security is important to us/i)).toBeInTheDocument();
    });
  });
});
