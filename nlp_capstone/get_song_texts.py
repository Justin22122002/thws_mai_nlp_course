import os
from typing import Hashable

import pandas as pd
from pathlib import Path
import lyricsgenius
from dotenv import load_dotenv
from lyricsgenius.types import Song
from pandas import DataFrame, Series

# Paths & ENV
NAME: str = "paul"
DATE_DIR: Path = Path("song_labels")
OUTPUT_DIR: Path = DATE_DIR / Path("processed")
ENV_PATH: Path = Path(".env")
SONGS_PATH: Path = Path(F"songs_{NAME}.csv")
SONGS_PATH_OUTPUT: Path = Path(f"songs_{NAME}_processed.csv")

def main():
    # Load ENV
    load_dotenv(ENV_PATH)

    genius_token: str | None = os.getenv("GENIUS_CLIENT_ACCESS_TOKEN")
    if not genius_token:
        raise RuntimeError("GENIUS_CLIENT_ACCESS_TOKEN missing")

    # Genius Client
    genius: lyricsgenius.Genius = lyricsgenius.Genius(
        genius_token,
        skip_non_songs=True,
        remove_section_headers=True,
        verbose=False,
        timeout=15,
        retries=3
    )

    # Load CSV
    df: DataFrame = pd.read_csv(DATE_DIR / SONGS_PATH)

    # Ensure Columns
    if "lyrics_available" not in df.columns:
        df["lyrics_available"] = False

    if "lyrics_length" not in df.columns:
        df["lyrics_length"] = 0

    if "lyrics" not in df.columns:
        df["lyrics"] = ""

    # Check Songs
    for idx, row in df.iterrows():
        idx: Hashable = idx
        row_series: Series = row
        artist: str = str(row_series["Author"])
        title: str = str(row_series["Song Name"])

        print(f"Checking: {artist} – {title}")

        song: Song | None
        try:
            song = genius.search_song(title, artist)
        except Exception as e:
            print("  Genius error:", e)
            continue

        if song and song.lyrics and song.lyrics.strip():
            lyrics_text: str  = song.lyrics.strip()

            df.at[idx, "lyrics_available"] = True
            df.at[idx, "lyrics_length"] = len(lyrics_text)
            df.at[idx, "lyrics"] = lyrics_text

            print("✔ Lyrics found")
        else:
            df.at[idx, "lyrics_available"] = False
            df.at[idx, "lyrics_length"] = 0
            df.at[idx, "lyrics"] = ""

            print("✘ No lyrics")

    # Save CSV
    df.to_csv(OUTPUT_DIR / SONGS_PATH_OUTPUT, index=False)
    print(f"\nDone. {OUTPUT_DIR / SONGS_PATH_OUTPUT} updated.")

if __name__ == "__main__":
    main()
