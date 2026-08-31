"""Base model for every API schema.

camelCase on the wire (matches `frontend/lib/types.ts` — an eventual
`openapi-typescript` regen is then a no-op diff), snake_case in Python, and
requests accept either spelling.
"""

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )
