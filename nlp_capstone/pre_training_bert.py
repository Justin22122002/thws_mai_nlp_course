import ast
import os
import re
from pathlib import Path

import kagglehub
import lyricsgenius
import pandas as pd
from dotenv import load_dotenv
from lyricsgenius.types import Song

SEED_TO_LABEL: dict[str, str] = {
    "acerbic": "heartbroken",
    "aggressive": "aggressive",
    "agreeable": "selfdetermination",
    "airy": "selfdetermination",
    "ambitious": "selfdetermination",
    "amiable": "selfdetermination",
    "angry": "aggressive",
    "angst-ridden": "heartbroken",
    "animated": "party",
    "anxious": "heartbroken",
    "apocalyptic": "aggressive",
    "athletic": "perseverance",
    "atmospheric": "selfdetermination",
    "austere": "loneliness",
    "autumnal": "selfdetermination",
    "belligerent": "aggressive",
    "benevolent": "selfdetermination",
    "bitter": "heartbroken",
    "bittersweet": "heartbroken",
    "bleak": "heartbroken",
    "boisterous": "party",
    "bombastic": "party",
    "brash": "aggressive",
    "brassy": "party",
    "bravado": "selfdetermination",
    "bright": "party",
    "brittle": "heartbroken",
    "brooding": "loneliness",
    "calm": "selfdetermination",
    "campy": "party",
    "capricious": "selfdetermination",
    "carefree": "party",
    "cathartic": "selfdetermination",
    "celebratory": "party",
    "cerebral": "selfdetermination",
    "cheerful": "party",
    "child-like": "selfdetermination",
    "circular": "selfdetermination",
    "clinical": "selfdetermination",
    "cold": "heartbroken",
    "comic": "party",
    "complex": "selfdetermination",
    "confident": "selfdetermination",
    "confrontational": "aggressive",
    "consoling": "selfdetermination",
    "crunchy": "party",
    "cynical": "heartbroken",
    "dark": "heartbroken",
    "defiant": "selfdetermination",
    "delicate": "lovemaking",
    "demonic": "aggressive",
    "desperate": "heartbroken",
    "detached": "loneliness",
    "devotional": "perseverance",
    "difficult": "perseverance",
    "dignified": "selfdetermination",
    "distraught": "heartbroken",
    "dramatic": "selfdetermination",
    "dreamy": "lovemaking",
    "driving": "perseverance",
    "druggy": "party",
    "earnest": "perseverance",
    "earthy": "selfdetermination",
    "ebullient": "party",
    "eccentric": "selfdetermination",
    "ecstatic": "party",
    "eerie": "heartbroken",
    "effervescent": "party",
    "elaborate": "selfdetermination",
    "elegant": "lovemaking",
    "elegiac": "heartbroken",
    "energetic": "party",
    "enigmatic": "selfdetermination",
    "epic": "perseverance",
    "erotic": "lovemaking",
    "ethereal": "selfdetermination",
    "euphoric": "party",
    "exciting": "party",
    "exotic": "selfdetermination",
    "explosive": "aggressive",
    "exuberant": "party",
    "feral": "aggressive",
    "feverish": "aggressive",
    "fierce": "aggressive",
    "fiery": "aggressive",
    "flashy": "party",
    "flowing": "selfdetermination",
    "fractured": "heartbroken",
    "freewheeling": "party",
    "fun": "party",
    "funereal": "heartbroken",
    "gentle": "lovemaking",
    "giddy": "party",
    "gleeful": "party",
    "gloomy": "heartbroken",
    "good-natured": "selfdetermination",
    "graceful": "lovemaking",
    "greasy": "party",
    "grim": "heartbroken",
    "gritty": "aggressive",
    "gutsy": "selfdetermination",
    "halloween": "party",
    "happy": "party",
    "harsh": "aggressive",
    "hedonistic": "party",
    "hostile": "aggressive",
    "humorous": "party",
    "hungry": "selfdetermination",
    "hymn-like": "perseverance",
    "hyper": "party",
    "hypnotic": "party",
    "indulgent": "party",
    "innocent": "selfdetermination",
    "insular": "loneliness",
    "intense": "perseverance",
    "intimate": "lovemaking",
    "introspective": "loneliness",
    "ironic": "heartbroken",
    "irreverent": "selfdetermination",
    "jittery": "party",
    "jovial": "party",
    "joyous": "party",
    "kinetic": "party",
    "knotty": "selfdetermination",
    "laid-back": "selfdetermination",
    "languid": "loneliness",
    "lazy": "loneliness",
    "light": "selfdetermination",
    "literate": "selfdetermination",
    "lively": "party",
    "lonely": "loneliness",
    "lush": "lovemaking",
    "lyrical": "lovemaking",
    "macabre": "heartbroken",
    "malevolent": "aggressive",
    "manic": "party",
    "marching": "perseverance",
    "martial": "perseverance",
    "meandering": "selfdetermination",
    "mechanical": "perseverance",
    "meditative": "selfdetermination",
    "melancholy": "heartbroken",
    "mellow": "selfdetermination",
    "menacing": "aggressive",
    "messy": "party",
    "mighty": "perseverance",
    "monastic": "selfdetermination",
    "monumental": "perseverance",
    "motoric": "perseverance",
    "mysterious": "selfdetermination",
    "mystical": "selfdetermination",
    "naive": "selfdetermination",
    "narcotic": "party",
    "narrative": "selfdetermination",
    "negative": "heartbroken",
    "nervous": "heartbroken",
    "nihilistic": "heartbroken",
    "noble": "selfdetermination",
    "nocturnal": "loneliness",
    "nostalgic": "heartbroken",
    "ominous": "heartbroken",
    "optimistic": "selfdetermination",
    "opulent": "selfdetermination",
    "organic": "selfdetermination",
    "ornate": "selfdetermination",
    "outraged": "aggressive",
    "outrageous": "aggressive",
    "paranoid": "aggressive",
    "passionate": "lovemaking",
    "pastoral": "selfdetermination",
    "peaceful": "selfdetermination",
    "perky": "party",
    "philosophical": "selfdetermination",
    "plaintive": "heartbroken",
    "playful": "party",
    "poignant": "heartbroken",
    "positive": "selfdetermination",
    "powerful": "perseverance",
    "precious": "lovemaking",
    "provocative": "party",
    "pure": "lovemaking",
    "quiet": "loneliness",
    "quirky": "selfdetermination",
    "rambunctious": "party",
    "ramshackle": "party",
    "raucous": "party",
    "reassuring": "selfdetermination",
    "rebellious": "selfdetermination",
    "reckless": "party",
    "refined": "lovemaking",
    "reflective": "selfdetermination",
    "regretful": "heartbroken",
    "relaxed": "selfdetermination",
    "reserved": "loneliness",
    "resolute": "perseverance",
    "restrained": "selfdetermination",
    "reverent": "selfdetermination",
    "rollicking": "party",
    "romantic": "lovemaking",
    "rousing": "party",
    "rowdy": "party",
    "rustic": "selfdetermination",
    "sacred": "selfdetermination",
    "sad": "heartbroken",
    "sarcastic": "heartbroken",
    "sardonic": "heartbroken",
    "satirical": "heartbroken",
    "savage": "aggressive",
    "scary": "aggressive",
    "scary music": "party",
    "searching": "selfdetermination",
    "self-conscious": "selfdetermination",
    "sensual": "lovemaking",
    "sentimental": "heartbroken",
    "serious": "selfdetermination",
    "sexual": "lovemaking",
    "sexy": "lovemaking",
    "shimmering": "party",
    "silly": "party",
    "sleazy": "party",
    "slick": "party",
    "smooth": "lovemaking",
    "snide": "heartbroken",
    "soft": "lovemaking",
    "somber": "heartbroken",
    "soothing": "lovemaking",
    "sophisticated": "selfdetermination",
    "spacey": "party",
    "sparkling": "party",
    "sparse": "selfdetermination",
    "spicy": "lovemaking",
    "spiritual": "selfdetermination",
    "spooky": "heartbroken",
    "sprawling": "party",
    "sprightly": "party",
    "springlike": "selfdetermination",
    "stately": "selfdetermination",
    "street-smart": "selfdetermination",
    "strong": "perseverance",
    "stylish": "party",
    "suffocating": "heartbroken",
    "sugary": "party",
    "summery": "party",
    "suspenseful": "selfdetermination",
    "swaggering": "party",
    "sweet": "lovemaking",
    "technical": "selfdetermination",
    "tender": "lovemaking",
    "tense": "heartbroken",
    "theatrical": "selfdetermination",
    "thoughtful": "selfdetermination",
    "threatening": "aggressive",
    "thrilling": "party",
    "thuggish": "aggressive",
    "tragic": "heartbroken",
    "translucent": "selfdetermination",
    "transparent": "selfdetermination",
    "trashy": "party",
    "trippy": "party",
    "triumphant": "perseverance",
    "uncompromising": "selfdetermination",
    "understated": "selfdetermination",
    "unsettling": "heartbroken",
    "uplifting": "perseverance",
    "urgent": "perseverance",
    "virile": "selfdetermination",
    "visceral": "aggressive",
    "volatile": "aggressive",
    "warm": "lovemaking",
    "weary": "heartbroken",
    "whimsical": "party",
    "wintry": "selfdetermination",
    "wistful": "loneliness",
    "witty": "selfdetermination",
    "wry": "selfdetermination",
    "yearning": "loneliness"
}

CSV_OUTPUT_FILE = Path("muse_with_classname_and_lyrics.csv")
ENV_PATH = Path(".env")


def map_seeds_to_label(seed_entry: str) -> str:
    seed_list = ast.literal_eval(seed_entry)
    if not isinstance(seed_list, list):
        raise ValueError()

    for seed in seed_list:
        if seed in SEED_TO_LABEL:
            return SEED_TO_LABEL[seed]
        else:
            raise ValueError()

    raise ValueError()

def normalize_text(s: str) -> str:
    s = s.lower()
    s = re.sub(r"\(.*?\)", "", s)      # (feat. ..), (remastered)
    s = re.sub(r"\[.*?\]", "", s)
    s = re.sub(r"[-–—].*$", "", s)     # - live, - remastered
    s = s.replace("’", "'")
    s = re.sub(r"[^\w\s']", "", s)
    return s.strip()

def fetch_lyrics(df: pd.DataFrame, genius_token: str) -> pd.DataFrame:
    genius = lyricsgenius.Genius(
        genius_token,
        skip_non_songs=True,
        remove_section_headers=True,
        verbose=False,
        timeout=15,
        retries=3
    )

    # add new columns
    for col, default in [("lyrics_available", False), ("lyrics_length", 0), ("lyrics", "")]:
        if col not in df.columns:
            df[col] = default

    # extract all classes
    classes = df["Classname"].dropna().unique()
    class_counters = {cls: 0 for cls in classes}

    # collect songs per class
    class_groups = {cls: df[df["Classname"] == cls].index.tolist() for cls in classes}

    more_songs = True
    while more_songs:
        more_songs = False
        for cls in classes:
            # Indexliste der Songs dieser Klasse filtern, die noch keine Lyrics haben
            pending = [idx for idx in class_groups[cls] if not df.at[idx, "lyrics_available"]]
            if not pending:
                continue

            more_songs = True  # there are still songs left
            idx = pending[0]  # take next song for class
            row = df.loc[idx]
            artist = str(row.get("artist", row.get("Artist", "")))
            track = str(row.get("track", row.get("Track", row.get("Song Name", ""))))

            # most of the data has a bad quality, so the names of the artist and track need to be normalized with some techniques
            artist = normalize_text(artist)
            track  = normalize_text(track)

            if not artist or not track:
                continue

            print(f"Checking lyrics ({cls}): {artist} – {track}")

            try:
                song: Song | None = genius.search_song(track, artist)
            except Exception as e:
                err_msg = str(e)
                if "429" in err_msg or "error code: 1015" in err_msg:
                    try:
                        print(err_msg)
                        retry_after = int(err_msg.split("Retry-After': '")[1].split("'")[0])
                        minutes = retry_after // 60
                        seconds = retry_after % 60
                        print(f"Rate limit reached! Retry after {retry_after} seconds (~{minutes} min {seconds} sec).")
                    except Exception:
                        print("Rate limit reached! Retry-After konnte nicht ausgelesen werden.")
                    df.to_csv(CSV_OUTPUT_FILE, index=False)
                    raise SystemExit("Rate Limit reached, stopping execution.")
                else:
                    print("  Genius error:", e)
                    continue

            if song and song.lyrics and song.lyrics.strip():
                lyrics_text = song.lyrics.strip()
                df.at[idx, "lyrics_available"] = True
                df.at[idx, "lyrics_length"] = len(lyrics_text)
                df.at[idx, "lyrics"] = lyrics_text
                class_counters[cls] += 1
                print(f"✔ Lyrics found ({class_counters[cls]} for class {cls})")
            else:
                df.at[idx, "lyrics_available"] = False
                df.at[idx, "lyrics_length"] = 0
                df.at[idx, "lyrics"] = ""
                print(f"✘ No lyrics for {cls}")

    return df

# path = kagglehub.dataset_download("ziya07/ai-powered-music-recommendation-system")
def main() -> None:
    dataset_path  = Path(kagglehub.dataset_download("cakiki/muse-the-musical-sentiment-dataset"))
    print("Dataset path:", dataset_path )

    csv_file = next(dataset_path.glob("*.csv"))
    print(f"Using dataset file: {csv_file.name}")

    df = pd.read_csv(csv_file)

    if CSV_OUTPUT_FILE.exists():
        print(f"Resuming from existing CSV: {CSV_OUTPUT_FILE}")
        df_existing = pd.read_csv(CSV_OUTPUT_FILE)
        df = df_existing.combine_first(df)


    if "seeds" not in df.columns:
            raise ValueError(
                f"'seeds' column not found. Available columns: {list(df.columns)}"
            )

    all_seeds: set[str] = set()

    for entry in df["seeds"].dropna():
        if isinstance(entry, str):
            try:
                seed_list = ast.literal_eval(entry)
                if isinstance(seed_list, list):
                    all_seeds.update(seed_list)
            except Exception:
                continue

    seeds = sorted(all_seeds)

    print("\nFound seed categories:\n")
    for seed in seeds:
        print(seed)

    print(f"\nTotal number of seed categories: {len(seeds)}")

    df["Classname"] = df["seeds"].apply(map_seeds_to_label)

    load_dotenv(ENV_PATH)
    genius_token = os.getenv("GENIUS_CLIENT_ACCESS_TOKEN")
    if not genius_token:
        raise RuntimeError("GENIUS_CLIENT_ACCESS_TOKEN missing in .env")

    df = fetch_lyrics(df, genius_token)

    df.to_csv(CSV_OUTPUT_FILE, index=False)
    print(f"\nDone. CSV saved: {CSV_OUTPUT_FILE.resolve()}")

if __name__ == "__main__":
    main()
