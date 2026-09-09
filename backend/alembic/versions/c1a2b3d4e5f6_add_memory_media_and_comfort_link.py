"""add memory photo/audio urls and patient comfort_memory_id link

Revision ID: c1a2b3d4e5f6
Revises: af50f103f49d
Create Date: 2026-09-09 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c1a2b3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "af50f103f49d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Real photo/recording storage for the patient app's Memory viewer and
    # Comfort Mode (previously Memory only carried text).
    op.add_column(
        "memories",
        sa.Column("image_url", sa.String(), nullable=True),
    )
    op.add_column(
        "memories",
        sa.Column("audio_url", sa.String(), nullable=True),
    )

    # Lets a caregiver pick a specific Memory as the patient's comfort
    # memory, instead of only a free-text description.
    op.add_column(
        "patients",
        sa.Column("comfort_memory_id", sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("patients", "comfort_memory_id")
    op.drop_column("memories", "audio_url")
    op.drop_column("memories", "image_url")
