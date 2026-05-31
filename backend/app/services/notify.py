from sqlalchemy.orm import Session
from app.models.models import Notification, User, RoleEnum


def _create(db: Session, user_id: int, title: str, body: str, notif_type: str):
    db.add(Notification(user_id=user_id, title=title, body=body, type=notif_type, is_read="false"))


def notify_user(db: Session, user_id: int, title: str, body: str = "", notif_type: str = "info"):
    """Send a notification to a specific user."""
    _create(db, user_id, title, body, notif_type)
    db.commit()


def notify_branch_staff(db: Session, branch_id: int, roles: list, title: str, body: str = "", notif_type: str = "info"):
    """Send a notification to all users in a branch with specified roles."""
    staff = db.query(User).filter(
        User.branch_id == branch_id,
        User.role.in_(roles)
    ).all()
    for u in staff:
        _create(db, u.id, title, body, notif_type)
    db.commit()


def notify_all_role(db: Session, role: RoleEnum, title: str, body: str = "", notif_type: str = "info"):
    """Send a notification to all users with a given role across all branches."""
    users = db.query(User).filter(User.role == role).all()
    for u in users:
        _create(db, u.id, title, body, notif_type)
    db.commit()
