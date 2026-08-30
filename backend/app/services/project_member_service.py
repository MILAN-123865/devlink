from __future__ import annotations

import uuid
from typing import List, Dict, Any
from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.project import Project
from app.models.project_member import ProjectMember, MemberRole
from app.models.user import User
from app.models.notification import NotificationType
from app.schemas.notification import NotificationCreate
from app.services.notification_service import NotificationService
from app.services.audit_log_service import AuditLogService
from app.models.audit_log import AuditAction
from app.core.rbac import (
    has_project_permission,
    PROJECT_MANAGE_ROLES,
    PROJECT_REMOVE_MEMBERS,
    PROJECT_VIEW,
)


class ProjectMemberService:
    @classmethod
    def get_membership(
        cls,
        db: Session,
        project_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> ProjectMember | None:
        """Return the project membership row, or ``None`` if it does not exist."""
        return db.scalar(
            select(ProjectMember).where(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == user_id,
            )
        )

    @classmethod
    def require_membership(
        cls,
        db: Session,
        project_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> ProjectMember:
        """Return the membership row, or 404 if it does not exist (#1310)."""
        membership = cls.get_membership(db, project_id, user_id)
        if membership is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project membership not found",
            )
        return membership

    @classmethod
    def require_project_member_access(
        cls,
        db: Session,
        project: Project,
        actor_user: User,
        permission: str = PROJECT_VIEW,
        *,
        forbidden_detail: str = "You do not have access to this project's members",
    ) -> None:
        """403 unless the actor belongs to the project or holds ``permission``."""
        if actor_user.is_superuser or actor_user.id == project.owner_id:
            return

        if not has_project_permission(db, actor_user.id, project.id, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=forbidden_detail,
            )

    @classmethod
    def get_project_members(
        cls, db: Session, project_id: uuid.UUID, actor_user: User
    ) -> List[Dict[str, Any]]:
        project = db.get(Project, project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        cls.require_project_member_access(db, project, actor_user)

        stmt = (
            select(ProjectMember, User)
            .join(User, ProjectMember.user_id == User.id)
            .where(
                ProjectMember.project_id == project_id,
                ProjectMember.is_active.is_(True),
            )
            .order_by(ProjectMember.joined_at.asc())
        )

        results = list(db.execute(stmt).all())
        members_list = []
        user_ids_seen = set()

        # Check if owner is already in members
        for pm, user in results:
            user_ids_seen.add(user.id)
            role_val = MemberRole.OWNER if user.id == project.owner_id else pm.role
            members_list.append(
                {
                    "id": str(pm.id),
                    "project_id": str(pm.project_id),
                    "user_id": str(pm.user_id),
                    "role": role_val,
                    "is_active": pm.is_active,
                    "joined_at": pm.joined_at,
                    "username": user.username,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "avatar_url": getattr(user, "avatar_url", None),
                }
            )

        # If project owner is not in project_members table, add owner entry
        if project.owner_id not in user_ids_seen:
            owner_user = db.get(User, project.owner_id)
            if owner_user:
                members_list.insert(
                    0,
                    {
                        "id": str(uuid.uuid4()),
                        "project_id": str(project.id),
                        "user_id": str(owner_user.id),
                        "role": MemberRole.OWNER,
                        "is_active": True,
                        "joined_at": project.created_at,
                        "username": owner_user.username,
                        "first_name": owner_user.first_name,
                        "last_name": owner_user.last_name,
                        "avatar_url": getattr(owner_user, "avatar_url", None),
                    },
                )

        return members_list

    @classmethod
    def update_member_role(
        cls,
        db: Session,
        project_id: uuid.UUID,
        target_user_id: uuid.UUID,
        new_role: MemberRole,
        actor_user: User,
    ) -> ProjectMember:
        project = db.get(Project, project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        cls.require_project_member_access(
            db,
            project,
            actor_user,
            PROJECT_MANAGE_ROLES,
            forbidden_detail="Insufficient permissions to manage project roles",
        )

        # Cannot alter project owner role via normal update
        if target_user_id == project.owner_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot change project owner role. Use transfer ownership instead.",
            )

        pm = cls.require_membership(db, project_id, target_user_id)
        pm.role = new_role
        pm.is_active = True

        db.commit()
        db.refresh(pm)

        # Notify target user
        try:
            notification = NotificationCreate(
                recipient_id=target_user_id,
                type=NotificationType.ROLE_CHANGE,
                title="Project Role Updated",
                message=f"Your role in project '{project.title}' was updated to {new_role.value.capitalize()}.",
                action_url=f"/projects/{project_id}",
                project_id=project_id,
            )
            NotificationService.create_notification(
                db=db,
                recipient_id=target_user_id,
                sender_id=actor_user.id,
                notification=notification,
            )
        except Exception:
            pass

        # Audit log
        AuditLogService.create_log(
            db=db,
            actor_id=actor_user.id,
            action=AuditAction.PROJECT_MEMBER_ROLE_UPDATED,
            entity_type="project_member",
            entity_id=str(pm.id),
            project_id=project_id,
            target_user_id=target_user_id,
            description=f"Updated member {target_user_id} role to {new_role.value}",
            new_values={"role": new_role.value},
        )

        return pm

    @classmethod
    def transfer_ownership(
        cls,
        db: Session,
        project_id: uuid.UUID,
        new_owner_id: uuid.UUID,
        current_owner: User,
    ) -> Project:
        project = db.get(Project, project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        if project.owner_id != current_owner.id and not current_owner.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the project owner can transfer project ownership",
            )

        if new_owner_id == project.owner_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Target user is already the project owner",
            )

        new_owner = db.get(User, new_owner_id)
        if not new_owner:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="New owner user not found"
            )

        previous_owner_id = project.owner_id
        project.owner_id = new_owner_id

        # Update previous owner member record to MAINTAINER
        prev_pm = db.scalar(
            select(ProjectMember).where(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == previous_owner_id,
            )
        )
        if prev_pm:
            prev_pm.role = MemberRole.MAINTAINER
        else:
            db.add(
                ProjectMember(
                    project_id=project_id,
                    user_id=previous_owner_id,
                    role=MemberRole.MAINTAINER,
                    is_active=True,
                )
            )

        # Update new owner member record to OWNER
        new_pm = db.scalar(
            select(ProjectMember).where(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == new_owner_id,
            )
        )
        if new_pm:
            new_pm.role = MemberRole.OWNER
            new_pm.is_active = True
        else:
            db.add(
                ProjectMember(
                    project_id=project_id,
                    user_id=new_owner_id,
                    role=MemberRole.OWNER,
                    is_active=True,
                )
            )

        db.commit()
        db.refresh(project)

        # Notify new owner
        try:
            notification = NotificationCreate(
                recipient_id=new_owner_id,
                type=NotificationType.ROLE_CHANGE,
                title="Project Ownership Transferred",
                message=f"You are now the Project Owner of '{project.title}'.",
                action_url=f"/projects/{project_id}",
                project_id=project_id,
            )
            NotificationService.create_notification(
                db=db,
                recipient_id=new_owner_id,
                sender_id=current_owner.id,
                notification=notification,
            )
        except Exception:
            pass

        # Audit log
        AuditLogService.create_log(
            db=db,
            actor_id=current_owner.id,
            action=AuditAction.PROJECT_OWNERSHIP_TRANSFERRED,
            entity_type="project",
            entity_id=str(project_id),
            project_id=project_id,
            target_user_id=new_owner_id,
            description=f"Transferred project ownership to {new_owner.username}",
            old_values={"owner_id": str(previous_owner_id)},
            new_values={"owner_id": str(new_owner_id)},
        )

        return project

    @classmethod
    def remove_member(
        cls,
        db: Session,
        project_id: uuid.UUID,
        target_user_id: uuid.UUID,
        actor_user: User,
    ) -> None:
        project = db.get(Project, project_id)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        if target_user_id == project.owner_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove project owner from team",
            )

        # Allow self-removal, otherwise require manage permissions
        if actor_user.id != target_user_id:
            cls.require_project_member_access(
                db,
                project,
                actor_user,
                PROJECT_REMOVE_MEMBERS,
                forbidden_detail="Insufficient permissions to remove team members",
            )

        pm = cls.require_membership(db, project_id, target_user_id)
        db.delete(pm)
        db.commit()

        # Audit log
        AuditLogService.create_log(
            db=db,
            actor_id=actor_user.id,
            action=AuditAction.PROJECT_MEMBER_REMOVED,
            entity_type="project_member",
            entity_id=str(target_user_id),
            project_id=project_id,
            target_user_id=target_user_id,
            description=f"Removed member {target_user_id} from project",
        )
