from flask import Flask, send_from_directory, request
from backend.app.api.routes import api_bp

from pathlib import Path
from dotenv import load_dotenv

import spotipy
from spotipy.oauth2 import SpotifyClientCredentials

ENV_PATH: Path = Path('.env')

def main() -> None:
    
    ENV_PATH: Path = Path(".env")

    load_dotenv(ENV_PATH)

    auth_manager = SpotifyClientCredentials()
    sp = spotipy.Spotify(auth_manager=auth_manager)

    app = Flask(__name__)

    app.register_blueprint(api_bp, url_prefix="/api")

    @app.route('/spsearch')
    def spotify_search(): #proxy for spotify web api search that returns URI of top result
        artist = request.args.get('artist')
        track = request.args.get('track')
        query = f"track:{track} artist:{artist}"
        content = sp.search(query, limit=1, offset=0, type='track', market='de')['tracks']['items']
        if len(content) == 0:
            return {}
        return {"uri": content[0]['uri']}
        
    @app.route('/<path:path>')
    def serve_frontend(path):
        # Using request args for path will expose you to directory traversal attacks
        return send_from_directory('frontend', path)

    print("Starting Flask server...")

    app.run(debug=True)

if __name__ == "__main__":
    main()
