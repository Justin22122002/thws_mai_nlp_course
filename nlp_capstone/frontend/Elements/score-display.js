const scoreDisplayStylesheet = new CSSStyleSheet();
scoreDisplayStylesheet.replaceSync(`
div {
border-style: solid;
border-color: var(--standard-border-color);
border-radius: 0.25em;
border-width: 1px;
padding: 0.2em;
margin: 0.25em;
box-shadow: var(--standard-shadow);
cursor: pointer;
background: var(--bg-color-shade-2);
}

span {
font-family: sans-serif;
padding: 0;
margin: 0.25em;
color: var(--fg);
font-size: 1.25em;
}
`);

export class ScoreDisplay extends HTMLElement {
    static observedAttributes = ['value'];

    constructor() {
	super();
	const shadow = this.attachShadow({ mode: 'open' });
	shadow.adoptedStyleSheets = [scoreDisplayStylesheet];

	this.background = document.createElement('div');

	this.scoreText = document.createElement('span');
	this.scoreText.innerText = 'Hello, World!';

	this.background.append(this.scoreText);

	shadow.append(this.background);
    }

    attributeChangedCallback(name, oldValue, newValue) {
	this.scoreText.innerText = `Score: ${newValue} Points`;
    }
}

customElements.define('score-display', ScoreDisplay);
