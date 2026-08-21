# Project Clone Feature Documentation (#569)

The **Project Clone Feature** allows developers on DevLink to duplicate an existing project as a new starting template.

---

## Technical Specifications

### 1. API Endpoint

- **Endpoint**: `POST /api/projects/{project_id}/clone`
- **Authentication**: Required (`Bearer` Token)
- **Rate Limit**: 10 requests per minute per user

#### Request Body (`ProjectCloneRequest`)

```json
{
  "title": "Cloned App Name",
  "tagline": "Custom tagline for cloned project",
  "description": "Custom description for cloned project",
  "visibility": "public",
  "include_milestones": false,
  "include_tags": true
}
```

#### Response (`ProjectResponse`)

- **Status Code**: `201 Created`
- Returns cloned `Project` object with unique slug (`-copy`, `-1`, `-2` suffix handling), `owner_id` set to current user, and engagement metrics reset (`stars: 0`, `views: 0`).

---

## Frontend Integration

- **Component**: `CloneProjectDialog.tsx`
- **Trigger**: "Clone" action button on project detail header (`/_app/projects/$projectId`).
- **Mutation**: `projectsApi.clone()` / `projectsService.clone()`
