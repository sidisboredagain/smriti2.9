"""add patient personalization fields

Revision ID: 7fdda0c2a9b8
Revises: b8791de5109d
Create Date: 2026-09-07 23:15:30.208736

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "7fdda0c2a9b8"
down_revision: Union[str, Sequence[str], None] = "b8791de5109d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add patient personalization fields."""
    op.add_column(
        "patients",
        sa.Column("favorite_color", sa.String(), nullable=True),
    )
    op.add_column(
        "patients",
        sa.Column("favorite_animal", sa.String(), nullable=True),
    )
    op.add_column(
        "patients",
        sa.Column("favorite_activity", sa.String(), nullable=True),
    )
    op.add_column(
        "patients",
        sa.Column("favorite_food", sa.String(), nullable=True),
    )
    op.add_column(
        "patients",
        sa.Column("favorite_place", sa.String(), nullable=True),
    )
    op.add_column(
        "patients",
        sa.Column("comfort_memory", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    """Remove patient personalization fields."""
    op.drop_column("patients", "comfort_memory")
    op.drop_column("patients", "favorite_place")
    op.drop_column("patients", "favorite_food")
    op.drop_column("patients", "favorite_activity")
    op.drop_column("patients", "favorite_animal")
    op.drop_column("patients", "favorite_color")