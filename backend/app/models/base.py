from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column

class AuditMixin:
    """Standard audit metadata required on every entity record."""
    source: Mapped[str] = mapped_column(String, default="ASDMA_SYNTHETIC_FIXTURE")
    observed_at: Mapped[str] = mapped_column(String, nullable=True)
    received_at: Mapped[str] = mapped_column(String, nullable=True)
    verification_status: Mapped[str] = mapped_column(String, default="VERIFIED")
    submitted_by: Mapped[str] = mapped_column(String, default="SYSTEM_IMPORTER")
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=True)
