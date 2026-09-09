import json

from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

from app.database.database import Base


class Memory(Base):
    __tablename__ = "memories"

    id = Column(Integer, primary_key=True, index=True)

    patient_id = Column(Integer, nullable=False, index=True)

    title = Column(String, nullable=False)

    content = Column(Text, nullable=False)

    category = Column(String, nullable=True)

    # Set by POST /memories/{id}/photo. Public URL path (e.g.
    # "/uploads/memories/<uuid>.jpg") served by the static mount in
    # app/main.py -- the patient app's Memory viewer and Comfort Mode both
    # want a real photo, not just text.
    image_url = Column(String, nullable=True)

    # Set automatically by POST /voice/transcribe-and-save/{patient_id}.
    # Public URL path to the original recording, so a real "Play Memory"
    # button can play the patient's own voice back, not only its
    # transcript.
    audio_url = Column(String, nullable=True)

    # Optional caregiver-entered ordered sequence of steps for this memory
    # (e.g. ["Invitation arrives", "Travel to Jaipur", "Wedding celebration"]).
    # Used by the Memory Sequence game. Stored as a JSON-encoded string so
    # the column stays a simple Text field across database backends.
    sequence_steps_json = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    @property
    def sequence_steps(self):
        """Decode the optional ordered sequence of steps for this memory."""
        if not self.sequence_steps_json:
            return None

        try:
            steps = json.loads(self.sequence_steps_json)
        except (TypeError, ValueError):
            return None

        if not isinstance(steps, list):
            return None

        return [str(step) for step in steps]

    @sequence_steps.setter
    def sequence_steps(self, value):
        if not value:
            self.sequence_steps_json = None
            return

        self.sequence_steps_json = json.dumps(
            [str(step).strip() for step in value if str(step).strip()]
        )