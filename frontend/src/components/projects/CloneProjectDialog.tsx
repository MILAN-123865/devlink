import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Loader2 } from "lucide-react";

import { projectsApi, type ExtendedProject } from "@/api/modules/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface CloneProjectDialogProps {
  project: ExtendedProject;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CloneProjectDialog({ project, open, onOpenChange }: CloneProjectDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const projectTitle = project.title || project.name || "Project";
  const [title, setTitle] = useState(`${projectTitle} (Copy)`);
  const [tagline, setTagline] = useState(project.tagline || "");
  const [description, setDescription] = useState(project.description || "");
  const [includeMilestones, setIncludeMilestones] = useState(false);
  const [includeTags, setIncludeTags] = useState(true);

  const cloneMutation = useMutation({
    mutationFn: async () => {
      return await projectsApi.clone(project.id, {
        title: title.trim() || `${projectTitle} (Copy)`,
        tagline: tagline.trim() || undefined,
        description: description.trim() || undefined,
        include_milestones: includeMilestones,
        include_tags: includeTags,
      });
    },
    onSuccess: (clonedProject) => {
      toast.success("Project cloned successfully!");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onOpenChange(false);
      if (clonedProject?.id) {
        navigate({ to: "/projects/$projectId", params: { projectId: clonedProject.id } });
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Failed to clone project");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    cloneMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-primary" />
            Clone Project
          </DialogTitle>
          <DialogDescription>
            Duplicate &quot;{projectTitle}&quot; as a new project starting template.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="clone-title">New Project Title</Label>
            <Input
              id="clone-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. My Cloned App"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="clone-tagline">Tagline</Label>
            <Input
              id="clone-tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Short catchy tagline"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="clone-description">Description</Label>
            <Textarea
              id="clone-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Detailed project summary..."
            />
          </div>

          <div className="space-y-2 pt-2 border-t text-sm">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
              <input
                type="checkbox"
                checked={includeTags}
                onChange={(e) => setIncludeTags(e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary h-4 w-4"
              />
              Include original tech stack & tags
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
              <input
                type="checkbox"
                checked={includeMilestones}
                onChange={(e) => setIncludeMilestones(e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary h-4 w-4"
              />
              Duplicate project milestones
            </label>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={cloneMutation.isPending}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={cloneMutation.isPending || !title.trim()}>
              {cloneMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cloning...
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Clone Project
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
