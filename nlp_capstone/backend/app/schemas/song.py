from pydantic import BaseModel, field_validator, field_serializer
import numpy as np


class SongDTO(BaseModel):
    name: str
    author: str
    classname: str
    lyrics_available: bool
    lyrics_length: int
    lyrics: str
    tsne_vector: np.ndarray | None

    class Config:
        arbitrary_types_allowed = True

    @field_validator("tsne_vector", mode="before")
    def convert_list_to_array(cls, v):
        if v is None:
            return None
        if isinstance(v, list):
            return np.array(v)
        return v