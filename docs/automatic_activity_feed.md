# Automatic Activity Feed Generation (#234)

This document outlines the automatic generation of activity records when users perform key actions across the DevLink platform.

---

## Supported Activity Triggers

Activity feed records are automatically logged via `ActivityService.record_activity` when any of the following 5 user actions occur:

### 1. Project Creation
- **ActivityType**: `PROJECT_CREATED` (`"project_created"`)
- **Actor**: Project creator (`owner_id`)
- **Target**: Created project ID (`target_id=project.id`, `target_type="project"`)
- **Trigger**: `ProjectService.create_project`

### 2. Project Join
- **ActivityType**: `PROJECT_JOINED` (`"project_joined"`)
- **Actor**: User joining project (`applicant_id` / member `user_id`)
- **Target**: Joined project ID (`target_id=project.id`, `target_type="project"`)
- **Trigger**: `ApplicationService.accept_application` (when a project application is accepted and applicant becomes a member) or `ProjectMemberService`

### 3. User Follow
- **ActivityType**: `FOLLOWED_USER` (`"followed_user"`)
- **Actor**: Following user (`follower_id`)
- **Target**: Target user ID (`target_id=following_id`, `target_type="user"`)
- **Trigger**: `FollowerService.follow_user`

### 4. Profile Update
- **ActivityType**: `PROFILE_UPDATED` (`"profile_updated"`)
- **Actor**: User updating profile (`db_user.id`)
- **Target**: User ID (`target_id=db_user.id`, `target_type="user"`)
- **Trigger**: `UserService.update_user`

### 5. Organization Creation
- **ActivityType**: `ORGANIZATION_CREATED` (`"organization_created"`)
- **Actor**: Organization owner (`owner_id`)
- **Target**: Created organization ID (`target_id=organization.id`, `target_type="organization"`)
- **Trigger**: `OrganizationService.create_organization`

---

## API Endpoints

- **`GET /api/activities`**: Retrieve paginated list of user activities.
- **`GET /api/activities/me`**: Retrieve activity feed for current user and followed users.

---

## Verification & Testing

Unit tests for automatic activity generation are located in `backend/tests/test_automatic_activity_generation.py`:
```bash
cd backend && ./venv/bin/python -m pytest tests/test_automatic_activity_generation.py -v
```
