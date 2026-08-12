# Automatic Activity Feed Generation (#234)

Automatically generates structured `Activity` feed entries whenever users perform important platform actions.

---

## Supported Activity Event Triggers

| Action | Activity Type | Target Type | Icon | Color | Trigger Service & Method |
|---|---|---|---|---|---|
| **Project Creation** | `PROJECT_CREATED` | `project` | `folder-plus` | `primary` | `ProjectService.create_project` |
| **Project Join** | `PROJECT_JOINED` | `project` | `user-check` | `success` | `ApplicationService.accept_application` |
| **Follow Builder** | `FOLLOWED_USER` | `user` | `user-plus` | `info` | `FollowerService.follow_user` |
| **Profile Update** | `PROFILE_UPDATED` | `user` | `user` | `primary` | `UserService.update_user` |
| **Organization Creation** | `ORGANIZATION_CREATED` | `organization` | `building` | `primary` | `OrganizationService.create_organization` |

---

## Service Implementation Highlights

1. **Project Creation** (`backend/app/services/project_service.py`):
   Records activity when a user creates a project with `target_id = project.id` and title `"Created project"`.

2. **Project Join** (`backend/app/services/application_service.py`):
   Records activity when a builder application is accepted with `actor_id = applicant_id`, `target_id = project.id`, and title `"Joined project"`.

3. **Follow User** (`backend/app/services/follower_service.py`):
   Records activity when a user follows another user with `actor_id = follower_id`, `target_id = target_user_id`, and title `"Followed a builder"`.

4. **Profile Update** (`backend/app/services/user_service.py`):
   Records activity when user updates profile details with `actor_id = user.id`, `target_id = user.id`, and title `"Updated profile"`.

5. **Organization Creation** (`backend/app/services/organization_service.py`):
   Records activity when an organization is created with `actor_id = owner.id`, `target_id = org.id`, and title `"Created organization"`.

---

## Verification & Unit Testing

Comprehensive tests are located in `backend/tests/test_automatic_activity_generation.py`:

```bash
cd backend && ./venv/bin/python -m pytest tests/test_automatic_activity_generation.py tests/test_activities.py -v
```

All 8 tests pass cleanly.
