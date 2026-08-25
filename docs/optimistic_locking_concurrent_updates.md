# Optimistic Locking for Concurrent Updates Documentation (#253)

Optimistic locking mechanism to prevent accidental overwrites when multiple users or clients update the same project or user profile simultaneously.

---

## Technical Overview

### 1. Database Model Version Fields
Added integer `version` field defaulted to `1` on:
- `Project` (`backend/app/models/project.py`)
- `User` (`backend/app/models/user.py`)

### 2. Schema Integration
- **`ProjectUpdate` & `UserUpdate`**: Accept an optional `version: Optional[int] = None`.
- **`ProjectResponse` & `UserResponse`**: Return current `version: int`.

### 3. Service Layer Conflict Detection
- **`ProjectService.update_project`**: Checks provided `version`. If `provided_version != db_project.version`, raises `HTTPException(status_code=409, detail="Version conflict: The project has been updated by another user. Please refresh and try again.")`. Increments `db_project.version += 1` on success.
- **`UserService.update_user`**: Checks provided `version`. If `provided_version != db_user.version`, raises `HTTPException(status_code=409, detail="Version conflict: The profile has been updated by another request. Please refresh and try again.")`. Increments `db_user.version += 1` on success.

---

## Unit Testing

Test suite located at `backend/tests/test_optimistic_locking.py`:
- `test_project_optimistic_locking_success`: Validates version increment from 1 -> 2 -> 3 on project update.
- `test_project_optimistic_locking_conflict`: Validates 409 Conflict when updating project with stale version.
- `test_user_profile_optimistic_locking_success`: Validates version increment from 1 -> 2 on profile update.
- `test_user_profile_optimistic_locking_conflict`: Validates 409 Conflict when updating profile with stale version.

Run tests:
```bash
cd backend && ./venv/bin/python -m pytest tests/test_optimistic_locking.py -v
```
