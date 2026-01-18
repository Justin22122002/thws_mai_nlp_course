import { globalStyleSheet } from "./globalCSS.js";
import { terrainScale } from "../constants.js";

const svgMapOverlayStylesheet  = new CSSStyleSheet();
svgMapOverlayStylesheet.replaceSync(`
svg {
width: 100%;
height: 100%;
stroke: var(--standard-border-color);
fill: var(--bg-color-shade-3);
}
circle {
stroke-width: 0.005px;
transition: 0.1s;
}
circle:hover {
fill: var(--accent-color);
transition: 0.1s;
}
text {
height: 0.05px;
width: 0.05px;
font: bold 0.05px sans-serif;
fill: white;
stroke-width: 0.001px;
stroke: black;
}
`);

export class SVGMapOverlay extends HTMLElement {
    static observedAttributes = ['points-of-interest', 'viewing-camera', 'canvas-size'];

    constructor() {
	super();
	const shadow = this.attachShadow({mode: 'open'});
	shadow.adoptedStyleSheets = [globalStyleSheet, svgMapOverlayStylesheet];

	this.svgRoot = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	this.svgRoot.setAttribute('viewBox', '-1 -1 2 2');

	shadow.append(this.svgRoot);
	
    }

    worldToScreen(
	world, // 3 entry array
	heightToWidthRatio,
	zoom,
	shallowness,
	angle,
	focusPoint // 3 entry array
    ) {
	const rotX = world[0] - focusPoint[0];
	const rotY = world[1] - focusPoint[1];

	const cosAngle = Math.cos(-angle);
	const sinAngle = Math.sin(-angle);

	let centeredX = (rotX * cosAngle - rotY * sinAngle) / zoom;
	let centeredY = (rotY * cosAngle + rotX * sinAngle) / zoom;
	centeredY += (world[2] - focusPoint[2]) / (zoom * shallowness);

	if (heightToWidthRatio < 1){
	    centeredX /= heightToWidthRatio;
	    centeredY /= heightToWidthRatio;
	}   
	return [
	    centeredX * 2,
	    centeredY * -2
	];
    }

    rerenderSVG() {
	if(!this.pointsOfInterest || !this.viewingCamera || !this.canvasSize)
	    return; // not all data available yet for draw
	const heightToWidthRatio = window.innerHeight / window.innerWidth;
	const positions = this.pointsOfInterest.map(
	    worldPoint => this.worldToScreen(
		worldPoint,
		heightToWidthRatio,
		this.viewingCamera.zoom,
		this.viewingCamera.shallowness,
		this.viewingCamera.rotation,
		this.viewingCamera.location
	    )
	)
	this.svgRoot.innerHTML = '';

	const textElements = positions.map((position, i) => {
	    const textElement = document.createElementNS("http://www.w3.org/2000/svg",'text');
	    textElement.setAttribute('x', position[0] + 0.04);
	    textElement.setAttribute('y', position[1] + 0.015);
	    textElement.textContent = this.pointsOfInterest[i][3];
	    return textElement;
	});

	const circleElements = positions.map((position, i) => {
	    const circleElement = document.createElementNS("http://www.w3.org/2000/svg",'circle');
	    circleElement.setAttribute('cx', position[0]);
	    circleElement.setAttribute('cy', position[1]);
	    circleElement.setAttribute('r', 0.035);
	    circleElement.addEventListener("pointerdown", event => {
		event.stopPropagation();
	    });
	    circleElement.addEventListener("click", event => {
		this.dispatchEvent(new CustomEvent("choose-song", {
		    bubbles: true,
		    detail: { chosenSongIndex: i },
		}))
	    });
	    return circleElement;
	});

	this.svgRoot.append(...textElements);
	this.svgRoot.append(...circleElements);
    }

    attributeChangedCallback(name, oldValue, newValue) {
	switch(name) {
	case 'points-of-interest':
	    this.pointsOfInterest = JSON.parse(newValue);
	    break;
	case 'viewing-camera':
	    this.viewingCamera = JSON.parse(newValue);
	    break;
	case 'canvas-size':
	    this.canvasSize = JSON.parse(newValue);
	    break;
	}
	this.rerenderSVG();
    }
}

customElements.define('svg-map-overlay', SVGMapOverlay)
