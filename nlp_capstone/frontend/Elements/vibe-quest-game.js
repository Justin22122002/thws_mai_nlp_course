import { globalStyleSheet } from "./globalCSS.js";
import { Action } from "../State/action.js"
import { Selector } from "../State/selector.js"
import { Store } from "../State/store.js"

import { initialMockState } from "../mock.js";

import { makeRenderCeptor } from "../Interceptors/renderCeptor.js"
import { makeInputCeptor } from "../Interceptors/inputCeptor.js";
import { makeAniCeptor } from "../Interceptors/aniCeptor.js";
import { makeGameCeptor } from "../Interceptors/gameCeptor.js";
import { makeWorldBuilderCeptor } from "../Interceptors/worldBuilderCeptor.js";
import { makeFetchSongsCeptor } from "../Interceptors/fetchSongsCeptor.js";

import { ZoomSlider } from './zoom-slider.js';
import { SVGMapOverlay } from './svg-map-overlay.js';
import { StyledButton } from './button.js';
import { ChoiceModalOverlay } from './choice-modal-overlay.js';
import { ScoreDisplay } from './score-display.js';

const vibeQuestGameStylesheet = new CSSStyleSheet();
vibeQuestGameStylesheet.replaceSync(`
 #root {
    --accent-color-dark: #ff993c;
    --accent-color: #e97527;
    --bg-color-shade-0: #b4b4b4;
    --bg-color-shade-1: #d7d7d7;
    --bg-color-shade-2: #c8c8c8;
    --bg-color-shade-3: #d7d7d7;
    --fg-contrast: #fff;
    --fg: #202020;
    --icon-filter: invert(0%) sepia(89%) saturate(7456%) hue-rotate(205deg) brightness(93%) contrast(109%);
    --standard-border-color: #80838c;
    --standard-font: Inter, sans-serif;
    --standard-shadow-hover: 0 0 16px rgba(0, 0, 0, 0.2);
    --standard-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
    --red-dark: #fb375e;
    --red: #fc5d7c;
    --green-dark: #88c653;
    --green: #9ed072;
}

@media (prefers-color-scheme: dark) {
    #root {
        --accent-color-dark: #0063cc;
        --accent-color: #007aff;
        --bg-color-shade-0: #2c2e34;
        --bg-color-shade-1: #33353f;
        --bg-color-shade-2: #3b3e48;
        --bg-color-shade-3: #414550;
        --blue-dark: #0063cc;
        --blue: #007aff;
        --fg-contrast: #2c2e34;
        --fg: #e2e2e3;
        --icon-filter: invert(95%) sepia(1%) saturate(1%) hue-rotate(198deg) brightness(97%) contrast(93%);
        --standard-border-color: #494c54;
    }
}
#root {
  width: 100%;
  height: 100%;
  background: var(--bg-color-shade-0)
}
.fillscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
#map-canvas {
  z-index: 0;
}
#overlay-container {
  user-select: none;
  z-index: 1;
  background: transparent;
}
h1 {
  color: var(--fg);
}
.choice-modal-overlay-active {
  z-index: 2;
}
.inactive {
  z-index: -1;
}
score-display {
position: absolute;
top: 0;
right: 0;
}
`);

export class VibeQuestGame extends HTMLElement {
    static observedAttributes = [];

    initializeStore() {
	const reducer = (action, state) => {
	    if (action.name == 'change-window-size')
		state.windowDimensions = action.payload;
	    return state;
	};
	let store = new Store(
	    initialMockState,
//	    initialState,
	    [
		makeAniCeptor(),
		makeWorldBuilderCeptor(this.gl),
		makeRenderCeptor(this.gl),
		makeInputCeptor(),
		makeGameCeptor(),
		makeFetchSongsCeptor()
	    ],
	    reducer
	);	
	this.store = store;

	// for mocking
	this.store.dispatch(new Action('load-songs'));
	
	;(function renderPing() { // re-rendering event
	    const delta = 16;
	    store.dispatch(new Action('render', delta / 1000.0));
	    requestAnimationFrame(renderPing)
	})()
    }

    initializeGL()  {
	this.gl = this.canvas.getContext('webgl2', {
	    alpha: false
	})
	// we need float color buffers for shadow mapping
	this.gl.getExtension("EXT_color_buffer_float");
	this.canvas.width = window.innerWidth;
	this.canvas.height = window.innerHeight;
	window.addEventListener('resize', () => {
	    this.canvas.width = window.innerWidth;
	    this.canvas.height = window.innerHeight;
	})
    }

    constructor() {
	super();
	
	const shadow = this.attachShadow({ mode: 'open' });
	shadow.adoptedStyleSheets = [globalStyleSheet, vibeQuestGameStylesheet];

	this.canvas = document.createElement('canvas');
	this.canvas.id = 'map-canvas';
	this.canvas.classList.add('fillscreen'); 

	this.scaleInput = document.createElement('zoom-slider');
	this.scoreDisplay = document.createElement('score-display');
	this.svgMapOverlay = document.createElement('svg-map-overlay');

	this.choiceModalOverlay = document.createElement('choice-modal-overlay');
	this.choiceModalOverlay.classList.add('fillscreen');
	this.choiceModalOverlay.id = 'choice-modal-overlay';
	this.choiceModalOverlay.classList.add('choice-modal-overlay-active');
	
	this.overlay = document.createElement('div');
	this.overlay.classList.add('fillscreen'); 
	this.overlay.id = 'overlay-container';
	
	this.overlay.append(this.scaleInput);
	this.overlay.append(this.scoreDisplay);
	this.overlay.append(this.svgMapOverlay);

	this.initializeGL();
	this.initializeStore();

	this.unsubscribers = [];

	const stopPropagations = (element, events) => events.forEach(e => element.addEventListener(e, event => event.stopPropagation()));
	const passToStore = (actionName) => (event) => this.store.dispatch(new Action(actionName, event))
	this.scaleInput.addEventListener("input", (event) => {
	    this.store.dispatch(new Action('change-viewing-camera-zoom', this.scaleInput.input.value));
	});

	this.unsubscribers.push(this.store.subscribe(new Selector(
	    state => state.viewModal.active,
	    value => {
		if(value) {
		    this.choiceModalOverlay.classList.add('choice-modal-overlay-active');
		    this.choiceModalOverlay.classList.remove('inactive');
		} else {
		    setTimeout(() => {
			this.choiceModalOverlay.classList.remove('choice-modal-overlay-active');
			this.choiceModalOverlay.classList.add('inactive');
		    }, 500);
		}
	    }
	)));

	this.unsubscribers.push(
	    this.store.mapToProps(this.scoreDisplay, {
		'value': state => state.pointCount
	    })
	);

	this.unsubscribers.push(
	    this.store.mapToProps(this.choiceModalOverlay, {
		'window-active': state => state.viewModal.active,
		'category-choices': state => JSON.stringify(state.viewModal.choices),
		'song-name': state => state.viewModal.songName,
		'song-artist': state => state.viewModal.artist,
		'song-lyrics': state => state.viewModal.lyrics,
		'song-done': state => state.viewModal.done,
		'song-points': state => state.viewModal.points,
		'correct-choice': state => state.viewModal.correctChoice
	    })
	);

	this.unsubscribers.push(
	    this.store.mapToProps(this.svgMapOverlay, {
		'points-of-interest': state => JSON.stringify(state.pointsOfInterest),
		'viewing-camera': state => JSON.stringify(state.viewingCamera),
		'canvas-size': state => JSON.stringify(state.windowDimensions),
	    })
	);
	this.unsubscribers.push(
	    this.store.mapToProps(this.scaleInput, {
		value: state => state.viewingCamera.zoom
	    })
	);

	this.svgMapOverlay.addEventListener('choose-song', e => {
	    this.store.dispatch(new Action('start-focus-point-of-interest-animation', e.detail.chosenSongIndex));
	});

	this.choiceModalOverlay.addEventListener('close-game-modal', _ => {
	    this.store.dispatch(new Action('close-game-modal'));
	});

	this.choiceModalOverlay.addEventListener('choose-category', event => {
	    this.store.dispatch(new Action('choose-category', event.detail.chosenCategoryIndex));
	});

	window.addEventListener('resize', (event) => this.store.dispatch(new Action('change-window-size', [window.innerWidth, window.innerHeight])));
	
	stopPropagations(this.scaleInput, ['pointerdown', 'pointerup', 'pointermove']);

	this.overlay.addEventListener('pointerdown', event => {
	    this.overlay.setPointerCapture(event.pointerId);
	    passToStore('start-mouse-drag')(event);
	});
	this.overlay.addEventListener('pointerup', event => {
	    this.overlay.releasePointerCapture(event.pointerId);
	    passToStore('stop-mouse-drag')(event);
	});
	this.overlay.addEventListener('pointermove', passToStore('move-mouse-drag'));
	document.addEventListener('contextmenu', event => event.preventDefault());
	
	this.root = document.createElement('div');
	this.root.id = 'root';
	this.root.append(this.choiceModalOverlay);
	this.root.append(this.overlay);
	this.root.append(this.canvas);

	shadow.append(this.root)
    }

    connectedCallback() {

    }

    disconnectedCallback() {
	this.unsubscribers.forEach(unsubscribe => unsubscribe());
    }

    attributeChangedCallback(name, oldValue, newValue) {

    }
}

customElements.define("vibe-quest-game", VibeQuestGame);
