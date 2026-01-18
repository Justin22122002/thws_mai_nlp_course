import { globalStyleSheet } from "./globalCSS.js";

const choiceModalStylesheet = new CSSStyleSheet();
choiceModalStylesheet.replaceSync(`
#dark-background {
position: absolute;
top: 0;
right: 0;
background: rgb(0 0 0 / 0);

width: 100%;
height: 100%;
user-select: none;
}

.game-modal {
position: absolute;
top: 50%;
left: 50%;
transform: translate(-50%, -50%) scale(1.0);
}

.game-modal-upper {
background: var(--bg-color-shade-1);
border: 1px solid var(--standard-border-color);
border-radius: 0.5em;
padding: 0.5em;
box-shadow: 0 0 10px 0px #000;
}

.game-modal-lower {
margin-top: 0.5em;
background: var(--bg-color-shade-2);
border: 1px solid var(--standard-border-color);
border-radius: 0.5em;
padding: 0.5em;
box-shadow: 0 0 10px 0px #000;
}

h1, h2, h3, p {
font-family: sans-serif;
padding: 0;
margin: 0;
color: var(--fg);
}

h3 {
text-align: center;
}

#lyrics-container {
max-height: 50vmin;
min-width: 50vmin;
overflow-y: scroll;
text-align: center;
font-size: 1.25em;
}

#button-container {
display: flex;
gap: 0.5em;
}

.heading-box {
display: flex;
justify-content: space-between;
}

.wrapper {
position: absolute;
top: 0;
right: 0;
width: 100%;
height: 100%;
}

.modal-scale-inactive {
transform: translate(-50%, -50%) scale(0.0);
transition: transform 2.5s;

}

.modal-scale-active {
transform: translate(-50%, -50%) scale(1.0);
transition: transform 0.25s;
}

.inactive {
opacity: 0;
transition: 0.5s;
backdrop-filter: blur(0rem);
}

.active {
opacity: 1;
transition: 0.5s;
backdrop-filter: blur(0.5rem);
}
`);

export class ChoiceModalOverlay extends HTMLElement {
    static observedAttributes = ['window-active', 'category-choices', 'song-name', 'song-artist', 'song-lyrics', 'song-done', 'song-points', 'correct-choice'];

    constructor() {
	super();
	const shadow = this.attachShadow({ mode: 'open' });
	shadow.adoptedStyleSheets = [globalStyleSheet, choiceModalStylesheet];

	this.wrapper = document.createElement('div');
	this.wrapper.classList.add('wrapper');
	
	this.darkBackground = document.createElement('div');
	this.darkBackground.setAttribute('id', 'dark-background');

	this.gameModal = document.createElement('div');
	this.gameModal.setAttribute('id', 'game-modal');
	this.gameModal.classList.add('game-modal');
	this.gameModal.classList.add('modal-scale-inactive');

	this.gameModalUpper = document.createElement('div');
	this.gameModalUpper.classList.add('game-modal-upper');

	window.onSpotifyIframeApiReady = (IFrameAPI) => {
	    this.requestSpotifyHTMLIntoElement = (uri, element) => {
		const options = {
		    height: '80',
		    uri: uri
		};
		const callback = (EmbedController) => {
		};
		IFrameAPI.createController(element, options, callback);
	    };
	};

	this.gameModalLower = document.createElement('div');
	this.gameModalLower.classList.add('game-modal-lower');

	this.gameModal.append(this.gameModalUpper);
	this.gameModal.append(this.gameModalLower);

	this.darkBackground.append(this.gameModal);

	shadow.append(this.wrapper);
	
    }

    rerenderModal() {
	if(!this.windowActive || !this.categoryChoices || !this.songName || !this.songArtist || !this.songLyrics || !this.songDone || !this.songPoints || !this.correctChoice)
	    return; // not all information available yet for modal


	this.closeButton = document.createElement('styled-button');
	this.closeButton.setAttribute('text', 'Close');

	this.closeButton.addEventListener('icon-button-select', event => {
	    this.dispatchEvent(new CustomEvent("close-game-modal", {
		bubbles: true
	    }))
	});

	this.songHeadingText = document.createElement('h1');
	this.songHeadingText.innerText = this.songName;

	this.songHeading = document.createElement('div');
	this.songHeading.append(this.songHeadingText, this.closeButton);
	this.songHeading.classList.add('heading-box');

	this.artistHeading = document.createElement('h2');
	this.artistHeading.innerText = this.songArtist;

	this.headerBreak = document.createElement('hr');

	this.spotifySlot = document.createElement('div');
	this.spotifySlot.setAttribute('id', 'spotify-container');

	this.lyricsContainer = document.createElement('div');
	this.lyricsContainer.setAttribute('id', 'lyrics-container');

	this.lyrics = document.createElement('p');
	this.lyrics.innerText = this.songLyrics;

	this.lyricsContainer.append(this.lyrics);

	this.lyricsBreak = document.createElement('hr');

	this.buttons = this.categoryChoices.map((categoryText, i) => {
	    const button = document.createElement('styled-button');
	    button.setAttribute('text', categoryText);
	    if (this.songDone == -1) {
		button.setAttribute('is-important', true);
	    } else {
		if (i == this.correctChoice)
		    button.setAttribute('is-important', true);
		button.setAttribute('disabled', '');
	    }
	    button.addEventListener('icon-button-select', event => {
		this.dispatchEvent(new CustomEvent("choose-category", {
		    bubbles: true,
		    detail: { chosenCategoryIndex: i }
		}))
	    });
	    return button;
	});

	this.buttonContainer = document.createElement('div');
	this.buttonContainer.setAttribute('id', 'button-container');
	this.buttonContainer.append(...this.buttons);

	this.gameModalUpper.innerHTML = '';
	this.gameModalUpper.append(this.songHeading, this.artistHeading, this.spotifySlot, this.headerBreak, this.lyricsContainer, this.lyricsBreak, this.buttonContainer);

	this.infoText = document.createElement('h3');
	if (this.songDone == -1)
	    this.infoText.innerText = "What is the Song's Vibe?";
	else
	    this.infoText.innerText = `By choosing ${this.categoryChoices[this.songDone]}, you gained +${this.songPoints} points!`;

	this.gameModalLower.innerHTML = '';
	this.gameModalLower.append(this.infoText);
	
	this.wrapper.append(this.darkBackground);

	const params = new URLSearchParams();
	params.append("artist", this.songArtist);
	params.append("track", this.songName);

	// not ideal to have fetch in components (should be in some interceptor, bc this is app logic), but im so tired ...
	fetch(`/spsearch?${params}`) // fetch URI of song
	    .then(response => response.json())
	    .then(body => {
		if (!body.uri) {
		    console.log('WARN: request of song uri ' + params + ' came up empty');
		    return;
		}
		if(!this.requestSpotifyHTMLIntoElement) {
		    console.log('WARN: Spotify IFrame API not loaded yet ...');
		    return;
		}
		this.requestSpotifyHTMLIntoElement(body.uri, this.spotifySlot); // render spotify player 
	    });

    }

    attributeChangedCallback(name, oldValue, newValue) {
	switch(name) {
	case 'window-active':
	    newValue = newValue == 'true';
	    oldValue = oldValue == 'true';
	    this.windowActive = newValue;
	    this.rerenderModal();
	    
	    if (!newValue) {
		this.wrapper.classList.add('inactive');
		this.wrapper.classList.remove('active');
		setTimeout(_ => this.gameModal.classList.remove('modal-scale-active'), 0);
	    } else {
		this.wrapper.classList.add('active');
		this.wrapper.classList.remove('inactive');
		setTimeout(_ => this.gameModal.classList.add('modal-scale-active'), 0);
	    }
	    break;
	case 'category-choices':
	    if (newValue === 'undefined') {
		this.categoryChoices = null;
		return;
	    }
	    this.categoryChoices = JSON.parse(newValue);
	    this.rerenderModal();
	    break;
	case 'song-name':
	    if (newValue === 'undefined') {
		this.songName = null;
		return;
	    }
	    this.songName = newValue;
	    this.rerenderModal();
	    break;
	case 'song-artist':
	    if (newValue === 'undefined') {
		this.songArtist = null;
		return;
	    }	    
	    this.songArtist = newValue;
	    this.rerenderModal();
	    break;
	case 'song-lyrics':
	    if (newValue === 'undefined') {
		this.songLyrics = null;
		return;
	    }	    	    
	    this.songLyrics = newValue;
	    this.rerenderModal();
	    break;
	case 'song-done':
	    if (newValue === 'undefined') {
		this.songDone = null;
		return;
	    }	    
	    this.songDone = newValue;
	    this.rerenderModal();
	    break;
	case 'song-points':
	    if (newValue === 'undefined') {
		this.songPoints = null;
		return;
	    }	    	    
	    this.songPoints = newValue;
	    this.rerenderModal();
	    break;
	case 'correct-choice':
	    if (newValue === 'undefined') {
		this.correctChoice = null;
		return;
	    }	    	    
	    this.correctChoice = newValue;
	    this.rerenderModal();
	    break;
	}
    }
};

customElements.define('choice-modal-overlay', ChoiceModalOverlay);
