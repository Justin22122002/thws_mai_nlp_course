# nlp-capstone

## Just Hosting the Frontend with our Song collection 
This describes how to set up the frontend to play the game using our own playlist.

First, create a fresh venv and install the requirements.txt file.

You will need a spotify premium account for the next steps. 

1. Create an application on the spotify dashboard (or use an existing app) https://developer.spotify.com/dashboard
2. IMPORTANT: activate the 'Web API' Option, it allows us to render a spotify player in the browser
3. Copy client ID and secret into a ```.env``` file

```
SPOTIPY_CLIENT_ID=your id
SPOTIPY_CLIENT_SECRET=your secret
```

Next, start up the backend server:
```
python run_backend.py
```
(This may take some time, as it loads BERT into memory).
When the console indicates that loading is done, you may play the game at ```http://127.0.0.1:5000/index.html```. 

Controls:
1. Left Click mouse drag to move the map
2. Right Click mouse drag to rotate the map about the screen center
3. Zoom Slider on the left controls map scale
4. Click on the circles at the towers, play the song, and decide for the vibe!

## Data Prep & Training

python version: 3.13

1. create a new account (if you dont have an existing spotify account) or log in
2. then log in on https://developers.spotify.com/ and go to the dashboard https://developer.spotify.com/dashboard
3. create an app and add your new ID and SECRET (ID and SECRET can be found on an app setting) to your environment, note: also add an redirect ulr, otherwise user authentication does not work, here i used http://127.0.0.1:8888/callback
4. sign into https://genius.com/api-clients, add your app and generate an access token
5. save the variables in an .env file

your env file should look like this now 
```
SPOTIPY_CLIENT_ID=
SPOTIPY_CLIENT_SECRET=
SPOTIPY_CLIENT_APP_REDIRECT_URI=
GENIUS_CLIENT_ID=
GENIUS_CLIENT_SECRET=
GENIUS_CLIENT_ACCESS_TOKEN=
```

## song text classes
1. selfdetermination
2. heartbroken
3. aggressive
4. loneliness
5. lovemaking
6. perseverance (Ausdauer) -> even go on
7. party
emptiness --> loneliness

## xlm-roberta-base

Epoch 01 | Train Loss: 2.0126 | Train Acc: 0.1042 | Val Loss: 1.9676 | Val Acc: 0.1111

Epoch 02 | Train Loss: 2.0027 | Train Acc: 0.1181 | Val Loss: 1.9114 | Val Acc: 0.2222

Epoch 03 | Train Loss: 1.9539 | Train Acc: 0.1493 | Val Loss: 1.9019 | Val Acc: 0.2520

Epoch 04 | Train Loss: 1.8112 | Train Acc: 0.2778 | Val Loss: 1.7160 | Val Acc: 0.3790

Epoch 05 | Train Loss: 1.5796 | Train Acc: 0.4201 | Val Loss: 1.5460 | Val Acc: 0.4365

Epoch 06 | Train Loss: 1.2987 | Train Acc: 0.5243 | Val Loss: 1.6232 | Val Acc: 0.4623

Epoch 07 | Train Loss: 1.0434 | Train Acc: 0.6111 | Val Loss: 1.7615 | Val Acc: 0.4385

Epoch 08 | Train Loss: 0.6774 | Train Acc: 0.7708 | Val Loss: 1.8008 | Val Acc: 0.3929

Epoch 09 | Train Loss: 0.4520 | Train Acc: 0.9028 | Val Loss: 1.7796 | Val Acc: 0.4067

Epoch 10 | Train Loss: 0.2796 | Train Acc: 0.9444 | Val Loss: 1.8679 | Val Acc: 0.4643

Epoch 11 | Train Loss: 0.1858 | Train Acc: 0.9618 | Val Loss: 2.2269 | Val Acc: 0.3929

Epoch 12 | Train Loss: 0.1135 | Train Acc: 0.9826 | Val Loss: 2.1688 | Val Acc: 0.4226

Epoch 13 | Train Loss: 0.0495 | Train Acc: 1.0000 | Val Loss: 2.3412 | Val Acc: 0.4206

Epoch 14 | Train Loss: 0.0385 | Train Acc: 0.9965 | Val Loss: 2.3884 | Val Acc: 0.4206

Epoch 15 | Train Loss: 0.0304 | Train Acc: 1.0000 | Val Loss: 2.4911 | Val Acc: 0.4623

Validation Loss: 2.4196

Validation Accuracy: 0.4648

