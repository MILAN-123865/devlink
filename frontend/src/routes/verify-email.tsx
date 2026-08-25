import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { APP_LOGO } from "@/lib/logo";
import { authApi } from "@/api/modules/auth";
import { TypoCaption, TypoHeading } from "@/components/shared/Typography";
import { toast } from "sonner";

export const Route = createFileRoute("/verify-email")({
  head: () => ({
    meta: [
      { title: "Verify Email — DevLink" },
      { name: "description", content: "Verify your email address to active your DevLink account." },
    ],
  }),
  component: VerifyEmail,
});

function VerifyEmail() {
  const search = Route.useSearch() as { token?: string };
  const token = search.token || "";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const calledRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Verification token is missing.");
      return;
    }

    if (calledRef.current) return;
    calledRef.current = true;

    setStatus("loading");
    authApi
      .verifyEmail(token)
      .then((res) => {
        if (res.success) {
          setStatus("success");
          toast.success("Email verified successfully!");
        } else {
          setStatus("error");
          setErrorMessage(res.message || "Email verification failed.");
        }
      })
      .catch((err: any) => {
        setStatus("error");
        setErrorMessage(
          err.response?.data?.error?.message ||
            err.message ||
            "An error occurred during email verification.",
        );
      });
  }, [token]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background px-4">
      <Link to="/" className="mb-6 flex items-center gap-2">
        <img src={APP_LOGO} alt="DevLink" className="h-12 w-12 rounded-full" />
        <span className="text-[36px] font-bold tracking-tight text-foreground">DevLink</span>
      </Link>

      <div className="w-full max-w-[460px] rounded-xl border border-border bg-surface p-8 text-center shadow-lg transition-all duration-300 hover:shadow-xl">
        {status === "loading" && (
          <div className="flex flex-col items-center py-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <TypoHeading as="h2" className="mt-4 text-xl">
              Verifying your email...
            </TypoHeading>
            <TypoCaption as="p" className="mt-2 text-sm">
              Please wait while we validate your verification token.
            </TypoCaption>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center py-6">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 animate-bounce" />
            <TypoHeading as="h2" className="mt-4 text-2xl font-bold text-foreground">
              Email Verified!
            </TypoHeading>
            <TypoCaption as="p" className="mt-2 text-sm max-w-sm">
              Your email address has been successfully verified. Your account is now active and ready.
            </TypoCaption>
            <Link
              to="/auth"
              className="mt-6 w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all duration-200"
            >
              Sign In to Your Account
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center py-6">
            <XCircle className="h-16 w-16 text-destructive" />
            <TypoHeading as="h2" className="mt-4 text-2xl font-bold text-foreground">
              Verification Failed
            </TypoHeading>
            <TypoCaption as="p" className="mt-2 text-sm text-muted-foreground max-w-sm">
              {errorMessage}
            </TypoCaption>
            <div className="mt-6 flex w-full flex-col gap-2">
              <Link
                to="/auth"
                className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all duration-200"
              >
                Go to Sign In
              </Link>
              <Link
                to="/"
                className="w-full rounded-md border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-all duration-200"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
