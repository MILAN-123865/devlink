import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/admin/jobs")({
  component: () => <div className="p-6">Admin Jobs Page</div>,
});
