import os
from pathlib import Path

import lyricsgenius
import spotipy
from dotenv import load_dotenv
from spotipy.oauth2 import SpotifyClientCredentials, SpotifyOAuth

ENV_PATH: Path = Path(".env")
def main() -> None:
    load_dotenv(dotenv_path=ENV_PATH)  # loads .env

    client_id = os.getenv("SPOTIPY_CLIENT_ID")
    client_secret = os.getenv("SPOTIPY_CLIENT_SECRET")
    app_redirect = os.getenv("SPOTIPY_CLIENT_APP_REDIRECT_URI")
    genius_token = os.environ["GENIUS_CLIENT_ACCESS_TOKEN"]

    if not client_id or not client_secret:
        raise RuntimeError("Spotify credentials not found in .env")

    sp = spotipy.Spotify(
        auth_manager=SpotifyClientCredentials(
            client_id=client_id,
            client_secret=client_secret,
        )
    )

    results = sp.search(q="weezer", limit=20, type="track")
    for idx, track in enumerate(results["tracks"]["items"]):
        print(idx, track["name"])


    sp = spotipy.Spotify(
        auth_manager=SpotifyOAuth(
            client_id=client_id,
            client_secret=client_secret,
            redirect_uri=app_redirect,
            scope="user-library-read",
        )
    )

    results = sp.current_user_saved_tracks(limit=10)  # z.B. 10 Songs zum Test

    for idx, item in enumerate(results['items']):
        track = item['track']
        title = track['name']
        artist = track['artists'][0]['name']

        lyrics = get_lyrics(artist, title, genius_token)

        print(f"\n{idx}: {artist} – {title}")
        if lyrics:
            print("Lyrics found:", True)
            print(lyrics[:300], "...")  # nur Preview
        else:
            print("Lyrics not found")

    results = sp.current_user_saved_tracks()
    for idx, item in enumerate(results['items']):
        track = item['track']
        print(idx, track['artists'][0]['name'], " – ", track['name'])

    results = sp.search(q="weezer", limit=5, type="track")

    for idx, track in enumerate(results["tracks"]["items"]):
        title = track["name"]
        artist = track["artists"][0]["name"]

        lyrics = get_lyrics(artist, title, genius_token)

        print(f"\n{idx}: {artist} – {title}")
        print("Lyrics found:", lyrics is not None)

        if lyrics:
            print(lyrics[:300], "...\n")

def get_lyrics(artist: str, title: str, genius_token: str) -> str | None:
    genius = lyricsgenius.Genius(
        genius_token,
        skip_non_songs=True,
        remove_section_headers=True,
        verbose=False
    )

    song = genius.search_song(title, artist)
    if song is None:
        return None

    return song.lyrics

if __name__ == "__main__":
    main()
