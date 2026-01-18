from pathlib import Path

import numpy as np
import pandas as pd
from matplotlib import pyplot as plt
from pandas import DataFrame
from sklearn.manifold import TSNE

from backend.app.schemas.song import SongDTO
from backend.app.services.core.LyricsModelService import LyricsModelService


class LyricsDatasetService:
    """loads the songs form the csv and generated the songDTOs with embeddings"""

    def __init__(self, csv_file_path: Path, model_service: LyricsModelService):
        self.csv_file_path: Path = csv_file_path
        self.model_service: LyricsModelService = model_service
        self.songs: list[SongDTO] = []
        self._load()

    def load_csv_files(self) -> DataFrame:
        csv_files: list[Path] = list(self.csv_file_path.glob("*.csv"))

        if not csv_files:
            raise RuntimeError(f"No CSV files found in {self.csv_file_path}")

        dfs: list[DataFrame] = [
            pd.read_csv(csv_file)
            for csv_file in csv_files
        ]

        df: DataFrame = pd.concat(dfs, ignore_index=True)
        return df

    def _load(self) -> None:
        if not self.csv_file_path.exists():
            raise FileNotFoundError(self.csv_file_path)

        df: DataFrame = self.load_csv_files()
        df = df[df["lyrics_available"] == True].reset_index(drop=True)

        embeddings: list[np.ndarray] = []
        temp_songs: list[SongDTO] = []

        for _, row in df.iterrows():
            lyrics = str(row["lyrics"]).strip()
            if not lyrics:
                continue

            # maybe a faster fix is to predict all texts at once
            pred_label, embedding = self.model_service.predict(lyrics)

            song = SongDTO(
                name=row.get("Song Name"),
                author=row.get("Author"),
                classname=pred_label,
                lyrics_available=True,
                lyrics_length=len(lyrics),
                lyrics=lyrics,
                tsne_vector=np.zeros(2), # will be set later
            )

            embeddings.append(embedding)
            temp_songs.append(song)

        if not embeddings:
            return

        tsne = TSNE(
            n_components=2,
            perplexity=min(30, len(embeddings) - 1),
            random_state=42,
            init="pca",
            learning_rate="auto",
        )

        tsne_vectors = tsne.fit_transform(np.vstack(embeddings))

        for song, vec in zip(temp_songs, tsne_vectors):
            song.tsne_vector = vec.tolist()
            self.songs.append(song)

    def get_all_songs(self) -> list[SongDTO]:
        return self.songs

    def plot_tsne(self) -> None:
        """Plot t-SNE vectors of all songs, colored by class."""
        if not self.songs:
            print("No songs to plot!")
            return

        plt.figure(figsize=(10, 8))

        classes: list[str] = sorted(set(song.classname for song in self.songs))
        class_to_color: dict[str, int] = {cls: i for i, cls in enumerate(classes)}

        for cls in classes:
            xs: list[float] = [
                song.tsne_vector[0]
                for song in self.songs
                if song.classname == cls
            ]
            ys: list[float] = [
                song.tsne_vector[1]
                for song in self.songs
                if song.classname == cls
            ]

            plt.scatter(
                xs,
                ys,
                label=cls,
                alpha=0.7
            )

        plt.title("t-SNE Visualization of Songs by Class")
        plt.legend(title="Class")
        plt.xlabel("t-SNE 1")
        plt.ylabel("t-SNE 2")
        plt.tight_layout()
        plt.show()