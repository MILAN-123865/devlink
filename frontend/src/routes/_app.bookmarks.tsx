import { useState, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, EmptyState } from "@/components/shared/primitives";
import { projects, flares, builders } from "@/mocks/seed";
import { repositories } from "@/mocks/repositories";

import { FolderOpen, Trash2, Users, FolderKanban, GitBranch, FileText, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CollectionSidebar } from "@/components/bookmarks/CollectionSidebar";
import { CollectionDialog } from "@/components/bookmarks/CollectionDialog";
import { AddToCollectionMenu } from "@/components/bookmarks/AddToCollectionMenu";
import { BookmarkListItem, BookmarkRowContent } from "@/components/bookmarks/BookmarkListItem";

import { BookmarkToggleButton } from "@/components/shared/BookmarkToggleButton";
import {
  useCreateCollection,
  useRenameCollection,
  useDeleteCollection,
  useAddBookmarkToCollection,
} from "@/hooks/useBookmarkCollections";
import type { BookmarkCollection } from "@/api";
import { ProjectDifficultyBadge } from "@/components/project/ProjectDifficultyBadge";
import { TypoCaption, TypoHeading } from "@/components/shared/Typography";
import type { RepositoryItem } from "@/mocks/repositories";

export const Route = createFileRoute("/_app/bookmarks")({
  head: () => ({
    meta: [
      { title: "Bookmarks — DevLink" },
      {
        name: "description",
        content: "Projects, developers, repositories and posts you've saved for later.",
      },
    ],
  }),
  component: BookmarksPage,
});

type Developer = {
  id: string;
  avatar_url?: string;
  name?: string;
  role?: string;
  location?: string;
  skills?: string[];
};

function SectionHeader({ icon: Icon, label }: { icon: typeof Users; label: string }) {
  return (
    <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
      <Icon size={14} /> {label}
    </p>
  );
}

function BookmarksPage() {
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<BookmarkCollection | null>(null);

  const [bookmarkedDevs, setBookmarkedDevs] = useState<Developer[]>(() =>
    builders.slice(0, 3).map((b) => ({
      id: b.id,
      avatar_url: b.avatar,
      name: b.name,
      role: b.role,
      location: b.country,
      skills: b.skills,
    })),
  );
  const toggleDevBookmark = useCallback((dev: Developer) => {
    setBookmarkedDevs((prev) => prev.filter((d) => d.id !== dev.id));
  }, []);

  const [bookmarkedRepos, setBookmarkedRepos] = useState<RepositoryItem[]>(() =>
    repositories.slice(0, 3),
  );
  const removeRepoBookmark = useCallback((repo: RepositoryItem) => {
    setBookmarkedRepos((prev) => prev.filter((r) => r.id !== repo.id));
  }, []);

  const createCollection = useCreateCollection();
  const renameCollection = useRenameCollection();
  const deleteCollection = useDeleteCollection();
  const addBookmarkToCollection = useAddBookmarkToCollection();

  const handleCreateCollection = useCallback(
    (name: string) => {
      createCollection.mutate(name, {
        onSuccess: () => setCreateDialogOpen(false),
      });
    },
    [createCollection],
  );

  const handleRenameCollection = useCallback(
    (name: string) => {
      if (!renameTarget) return;
      renameCollection.mutate(
        { id: renameTarget.id, name },
        {
          onSuccess: () => setRenameTarget(null),
        },
      );
    },
    [renameTarget, renameCollection],
  );

  const handleDeleteCollection = useCallback(
    (col: BookmarkCollection) => {
      deleteCollection.mutate(col.id, {
        onSuccess: () => {
          if (activeCollectionId === col.id) {
            setActiveCollectionId(null);
          }
        },
      });
    },
    [deleteCollection, activeCollectionId],
  );

  const handleAddToCollection = useCallback(
    (bookmarkId: string) => (collectionId: string) => {
      addBookmarkToCollection.mutate({
        collectionId,
        bookmarkId,
      });
    },
    [addBookmarkToCollection],
  );

  const bookmarkedProjects = projects.slice(0, 3);
  const bookmarkedPosts = flares.slice(0, 2);

  return (
    <div className="flex gap-6">
      <aside className="hidden w-56 shrink-0 md:block">
        <div className="sticky top-6">
          <CollectionSidebar
            activeCollectionId={activeCollectionId}
            onSelectCollection={setActiveCollectionId}
            onCreateCollection={() => setCreateDialogOpen(true)}
            onRenameCollection={setRenameTarget}
            onDeleteCollection={handleDeleteCollection}
          />
        </div>
      </aside>

      <div className="min-w-0 flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <TypoHeading as="h1">Bookmarks</TypoHeading>
            <TypoCaption as="p">
              {activeCollectionId
                ? "Filtered by collection"
                : "Projects, developers, and flares you've saved."}
            </TypoCaption>
                : "Developers, projects, repositories and posts you've saved."}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="md:hidden"
            onClick={() => setCreateDialogOpen(true)}
          >
            <FolderOpen size={14} className="mr-1.5" />
            New Collection
          </Button>
        </div>

        {/* SAVED DEVELOPERS */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <TypoCaption as="p">
              <Users size={14} /> Saved Developers
            </TypoCaption>
          </div>
          {bookmarkedDevs.length === 0 ? (
            <Card className="p-6 text-center border-dashed">
              <TypoCaption as="p">
          <SectionHeader icon={Users} label="Saved Developers" />
          {bookmarkedDevs.length === 0 ? (
            <Card className="border-dashed p-6 text-center">
              <p className="text-[13px] text-muted-foreground">
                No developers bookmarked yet. Save builders from their profiles to see them here!
              </TypoCaption>
            </Card>
          ) : (
            <Card className="px-2 py-1">
              {bookmarkedDevs.map((dev) => (
                <Card key={dev.id} className="p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          src={dev.avatar_url || ""}
                          alt={dev.name || "Developer"}
                          size={40}
                        />
                        <div>
                          <p className="text-[14px] font-semibold text-foreground">{dev.name}</p>
                          <TypoCaption as="p">{dev.role}</TypoCaption>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleBookmark(dev)}
                        title="Remove bookmark"
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="space-y-1 mb-3 text-[11px] text-muted-foreground">
                      {dev.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin size={12} />
                          <span>{dev.location}</span>
                        </div>
                      )}
                      {dev.experience && (
                        <div className="flex items-center gap-1.5">
                          <Briefcase size={12} />
                          <span>{dev.experience}</span>
                        </div>
                      )}
                    </div>

                    {dev.skills && dev.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {dev.skills.map((s) => (
                          <TagChip key={s}>{s}</TagChip>
                        ))}
                      </div>
                    )}
                  </div>

                  <Link
                    to="/builders/$builderId"
                    params={{ builderId: dev.id || "" }}
                    className="mt-2 block w-full text-center text-[12px] font-medium py-1.5 rounded-md border border-border hover:bg-muted text-foreground transition-colors"
                  >
                    View Profile
                <BookmarkListItem
                  key={dev.id}
                  actions={
                    <button
                      onClick={() => toggleDevBookmark(dev)}
                      title="Remove bookmark"
                      aria-label={`Remove ${dev.name} bookmark`}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </button>
                  }
                >
                  <Link to="/builders/$builderId" params={{ builderId: dev.id }} className="block">
                    <BookmarkRowContent
                      avatarSrc={dev.avatar_url}
                      title={dev.name ?? "Developer"}
                      subtitle={[dev.role, dev.location].filter(Boolean).join(" · ")}
                      tags={dev.skills}
                    />
                  </Link>
                </BookmarkListItem>
              ))}
            </Card>
          )}
        </section>

        {/* SAVED PROJECTS */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <TypoCaption as="p">
              Projects
            </TypoCaption>
          </div>
          <SectionHeader icon={FolderKanban} label="Saved Projects" />
          {bookmarkedProjects.length === 0 ? (
            <EmptyState
              title="No bookmarked projects"
              desc="Save projects you're interested in to see them here."
            />
          ) : (
            <Card className="px-2 py-1">
              {bookmarkedProjects.map((p) => (
                <div key={p.id} className="group relative">
                  <Link to="/projects/$projectId" params={{ projectId: p.id }}>
                    <Card interactive className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-muted text-xl">
                          {p.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-[14px] font-semibold text-foreground">
                              {p.name}
                            </p>
                            {p.difficulty && <ProjectDifficultyBadge difficulty={p.difficulty} />}
                          </div>
                          <TypoCaption as="p">
                            {p.description}
                          </TypoCaption>
                        </div>

                        <Bookmark size={14} className="text-primary fill-primary" />

                        <Bookmark size={14} className="text-primary fill-primary shrink-0" />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {p.stack.map((s) => (
                          <TagChip key={s}>{s}</TagChip>
                        ))}
                      </div>
                    </Card>
                <BookmarkListItem
                  key={p.id}
                  actions={
                    <>
                      <BookmarkToggleButton
                        projectId={p.id}
                        className="h-7 min-w-0 px-2 text-[11px]"
                      />
                      <AddToCollectionMenu
                        bookmarkId={p.id}
                        onAddToCollection={handleAddToCollection(p.id)}
                      />
                    </>
                  }
                >
                  <Link to="/projects/$projectId" params={{ projectId: p.id }} className="block">
                    <BookmarkRowContent
                      icon={p.icon}
                      title={p.name}
                      subtitle={p.description}
                      badge={p.difficulty && <ProjectDifficultyBadge difficulty={p.difficulty} />}
                      tags={p.stack}
                    />
                  </Link>
                </BookmarkListItem>
              ))}
            </Card>
          )}
        </section>

        {/* SAVED REPOSITORIES */}
        <section>
          <SectionHeader icon={GitBranch} label="Saved Repositories" />
          {bookmarkedRepos.length === 0 ? (
            <Card className="border-dashed p-6 text-center">
              <p className="text-[13px] text-muted-foreground">
                No repositories bookmarked yet. Save repositories from a project to see them here!
              </p>
            </Card>
          ) : (
            <Card className="px-2 py-1">
              {bookmarkedRepos.map((repo) => (
                <BookmarkListItem
                  key={repo.id}
                  actions={
                    <button
                      onClick={() => removeRepoBookmark(repo)}
                      title="Remove bookmark"
                      aria-label={`Remove ${repo.name} bookmark`}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </button>
                  }
                >
                  <Link
                    to="/projects/$projectId"
                    params={{ projectId: repo.projectId }}
                    className="block"
                  >
                    <BookmarkRowContent
                      icon={<GitBranch size={16} />}
                      title={repo.name}
                      subtitle={repo.description}
                      tags={[repo.language]}
                      meta={
                        <span className="flex items-center gap-1">
                          <Star size={12} />
                          {repo.stars}
                        </span>
                      }
                    />
                  </Link>
                </BookmarkListItem>
              ))}
            </Card>
          )}
        </section>

        {/* SAVED POSTS */}
        <section>
          <TypoCaption as="p">
            Flares
          </TypoCaption>
          <div className="space-y-2">
            {flares.slice(0, 2).map((f) => (
              <Card key={f.id} className="p-4">
                <p className="text-[13px] font-semibold text-foreground">{f.author.name}</p>
                <p className="mt-1 text-[13px] text-foreground">{f.content}</p>
              </Card>
            ))}
          </div>
          <SectionHeader icon={FileText} label="Saved Posts" />
          {bookmarkedPosts.length === 0 ? (
            <EmptyState
              title="No bookmarked posts"
              desc="Save posts from the feed to see them here."
            />
          ) : (
            <Card className="px-2 py-1">
              {bookmarkedPosts.map((f) => (
                <BookmarkListItem
                  key={f.id}
                  actions={
                    <>
                      <BookmarkToggleButton
                        targetType="flare"
                        targetId={f.id}
                        className="h-7 min-w-0 px-2 text-[11px]"
                      />
                      <AddToCollectionMenu
                        bookmarkId={f.id}
                        onAddToCollection={handleAddToCollection(f.id)}
                      />
                    </>
                  }
                >
                  <BookmarkRowContent
                    avatarSrc={f.author.avatar}
                    title={f.author.name}
                    subtitle={f.content}
                    meta={<span>{f.ago}</span>}
                  />
                </BookmarkListItem>
              ))}
            </Card>
          )}
        </section>
      </div>

      <CollectionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        title="New Collection"
        description="Create a collection to organize your bookmarks."
        onSubmit={handleCreateCollection}
      />

      <CollectionDialog
        open={!!renameTarget}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null);
        }}
        initialName={renameTarget?.name}
        title="Rename Collection"
        description="Give your collection a new name."
        onSubmit={handleRenameCollection}
      />
    </div>
  );
}
