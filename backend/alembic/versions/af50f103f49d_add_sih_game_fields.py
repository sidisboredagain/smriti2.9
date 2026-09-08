"""add game_data, sequence_steps, and attempt metrics for the SIH games

Revision ID: af50f103f49d
Revises: b8791de5109d
Create Date: 2026-09-08 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'af50f103f49d'
down_revision: Union[str, Sequence[str], None] = '7fdda0c2a9b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Memory Match / Memory Sequence / Object-Visual Recall structured data.
    op.add_column(
        'generated_games',
        sa.Column('game_data', sa.Text(), nullable=True),
    )

    # Optional caregiver-entered ordered sequence of steps for a memory,
    # used by the Memory Sequence game.
    op.add_column(
        'memories',
        sa.Column('sequence_steps_json', sa.Text(), nullable=True),
    )

    # Progress signals (mistakes, time taken) for the richer game UIs.
    op.add_column(
        'game_attempts',
        sa.Column('mistakes', sa.Integer(), nullable=True),
    )
    op.add_column(
        'game_attempts',
        sa.Column('time_seconds', sa.Float(), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('game_attempts', 'time_seconds')
    op.drop_column('game_attempts', 'mistakes')
    op.drop_column('memories', 'sequence_steps_json')
    op.drop_column('generated_games', 'game_data')
