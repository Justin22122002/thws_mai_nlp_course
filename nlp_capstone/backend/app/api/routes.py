import os

import pandas as pd
from flask import Blueprint, jsonify, Response
from backend.app.schemas.song import SongDTO
from pathlib import Path
import torch
import numpy as np
import random

from backend.app.services.core.LyricsDatasetService import LyricsDatasetService
from backend.app.services.core.LyricsModelService import LyricsModelService
from utils.bert_for_lyrics import BertForLyricsConfig

DEVICE: torch.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MODEL_PATH: Path = Path("models/xlm-roberta-base_1") # "models/xlm-roberta-base_1, models/xlm-roberta-base_new/xlm-roberta-base
CSV_FILE_PATH: Path = Path("song_labels/processed/")

print(CSV_FILE_PATH.exists())

bert_config: BertForLyricsConfig = BertForLyricsConfig(
        model_name="xlm-roberta-base",
        num_labels=7,
        chunk_size=510,
        stride=256
    )

LABELS: list[str] = [
    "selfdetermination",
    "heartbroken",
    "aggressive",
    "loneliness",
    "lovemaking",
    "perseverance",
    "party",
]

id2label: dict[int, str] = {i: l for i, l in enumerate(LABELS)}

# services
model_service: LyricsModelService | None = None
dataset_service: LyricsDatasetService | None = None

api_bp = Blueprint("api", __name__)

def get_dataset_service() -> LyricsDatasetService:
    global model_service, dataset_service

    if model_service is None:
        model_service = LyricsModelService(
            model_path=MODEL_PATH,
            config=bert_config,
            device=DEVICE,
            id2label=id2label,
        )

    if dataset_service is None:
        dataset_service = LyricsDatasetService(
            csv_file_path=CSV_FILE_PATH,
            model_service=model_service,
        )

    return dataset_service

@api_bp.get("/songs_from_model")
def get_songs() -> Response:
    dataset_service = get_dataset_service()

    songs: list[SongDTO] = dataset_service.get_all_songs()
    songs_json = []

    for song in songs:
        song_dict = song.model_dump()
        if isinstance(song_dict["tsne_vector"], np.ndarray):
            song_dict["tsne_vector"] = song_dict["tsne_vector"].tolist()
        songs_json.append(song_dict)

    random.shuffle(songs_json)
    songs_json = songs_json[:60]

    dataset_service.plot_tsne()

    return jsonify(songs_json)

@api_bp.get("/songs")
def get_songs_json() -> Response:
    json_song_path: Path = Path("backend/data/songs_2.json").resolve()
    song_dataframe: pd.DataFrame = pd.read_json(json_song_path)

    songs: list[SongDTO] = [
        SongDTO(**row) for row in song_dataframe.to_dict(orient="records")
    ]

    songs_json = []
    for song in songs:
        song_dict = song.model_dump()
        if isinstance(song_dict.get("tsne_vector"), np.ndarray):
            song_dict["tsne_vector"] = song_dict["tsne_vector"].tolist()
        songs_json.append(song_dict)

    random.shuffle(songs_json)
    songs_json = songs_json[:60]

    return jsonify(songs_json)
