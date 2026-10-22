"""Add shared CAPA fields to preventive actions.

Revision ID: 0002_capa_fields
Revises: 0001_initial
"""
from alembic import op
import sqlalchemy as sa

revision = "0002_capa_fields"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    existing = {column["name"] for column in sa.inspect(bind).get_columns("preventive_actions")}
    columns = (
        sa.Column("source", sa.String(length=200), server_default="Incident investigation", nullable=False),
        sa.Column("priority", sa.String(length=20), server_default="Medium", nullable=False),
        sa.Column("detail", sa.Text(), server_default="", nullable=False),
    )
    for column in columns:
        if column.name not in existing:
            op.add_column("preventive_actions", column)


def downgrade():
    bind = op.get_bind()
    existing = {column["name"] for column in sa.inspect(bind).get_columns("preventive_actions")}
    for name in ("detail", "priority", "source"):
        if name in existing:
            op.drop_column("preventive_actions", name)
