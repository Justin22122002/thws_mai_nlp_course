import { globalStyleSheet } from "./globalCSS.js";

const zoomSliderStylesheet = new CSSStyleSheet();
zoomSliderStylesheet.replaceSync(`
/*generated with Input range slider CSS style generator (version 20211225)
https://toughengineer.github.io/demo/slider-styler*/

.sidebar {
  float: left;
  position: relative;
  height: 100%;
}

.wrap {
  position: absolute;
  top: 50%; left: 50%;
  height: 25.75em;
  width: 2em;
  margin: 0.5em;
  background-color: var(--bg-color-shade-3);
  border-radius: 0.5em;
  border: 1px solid var(--standard-border-color);
  transform: translate(0, -50%);
}

input[type=range].styled-slider {
  height: 2.2em;
  width: 30em;
  background: transparent;
  -webkit-appearance: none;
  position: absolute;
  top: 50%; left: 50%;
  margin: 0;
  padding: 0;
  transform: translate(-50%, -50%) rotate(-90deg);
}

/*progress support*/
input[type=range].styled-slider.slider-progress {
  --range: calc(var(--max) - var(--min));
  --ratio: calc((var(--value) - var(--min)) / var(--range));
  --sx: calc(0.5 * 2em + var(--ratio) * (100% - 2em));
}

input[type=range].styled-slider:focus {
  outline: none;
}

/*webkit*/
input[type=range].styled-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 2em;
  height: 2em;
  border-radius: 1em;
  background: var(--accent-color-dark);
  border: none;
  box-shadow: 0 0 2px black;
  margin-top: calc(max((1em - 1px - 1px) * 0.5,0px) - 2em * 0.5);
}

input[type=range].styled-slider::-webkit-slider-runnable-track {
  height: 1em;
  border: 1px solid var(--bg-color-shade-2);
  border-radius: 0.5em;
  background: var(--bg-color-shade-0);
  box-shadow: none;
}

input[type=range].styled-slider::-webkit-slider-thumb:hover {
  background: var(--accent-color);
}

input[type=range].styled-slider:hover::-webkit-slider-runnable-track {
  background: var(--bg-color-shade-1);
  border-color: var(--accent-color-dark);
}

input[type=range].styled-slider::-webkit-slider-thumb:active {
  background: var(--accent-color);
}

input[type=range].styled-slider:active::-webkit-slider-runnable-track {
  background: var(--bg-color-shade-1);
  border-color: var(--accent-color);
}

input[type=range].styled-slider.slider-progress::-webkit-slider-runnable-track {
  background: linear-gradient(var(--accent-color-dark),var(--accent-color-dark)) 0/var(--sx) 100% no-repeat, var(--bg-color-shade-0);
}

input[type=range].styled-slider.slider-progress:hover::-webkit-slider-runnable-track {
  background: linear-gradient(var(--accent-color),var(--accent-color)) 0/var(--sx) 100% no-repeat, var(--bg-color-shade-1);
}

input[type=range].styled-slider.slider-progress:active::-webkit-slider-runnable-track {
  background: linear-gradient(var(--accent-color), var(--accent-color)) 0/var(--sx) 100% no-repeat, var(--bg-color-shade-1);
}

/*mozilla*/
input[type=range].styled-slider::-moz-range-thumb {
  width: 2em;
  height: 2em;
  border-radius: 1em;
  background: var(--accent-color-dark);
  border: none;
  box-shadow: 0 0 2px black;
}

input[type=range].styled-slider::-moz-range-track {
  height: max(calc(1em - 1px - 1px),0px);
  border: 1px solid var(--bg-color-shade-2);
  border-radius: 0.5em;
  background: var(--bg-color-shade-0);
  box-shadow: none;
}

input[type=range].styled-slider::-moz-range-thumb:hover {
  background: var(--accent-color);
}

input[type=range].styled-slider:hover::-moz-range-track {
  background: var(--bg-color-shade-1);
  border-color: var(--accent-color-dark);
}

input[type=range].styled-slider::-moz-range-thumb:active {
  background: var(--accent-color);
}

input[type=range].styled-slider:active::-moz-range-track {
  background: var(--bg-color-shade-1);
  border-color: var(--accent-color);
}

input[type=range].styled-slider.slider-progress::-moz-range-track {
  background: linear-gradient(var(--accent-color-dark),var(--accent-color-dark)) 0/var(--sx) 100% no-repeat, var(--bg-color-shade-0);
}

input[type=range].styled-slider.slider-progress:hover::-moz-range-track {
  background: linear-gradient(var(--accent-color),var(--accent-color)) 0/var(--sx) 100% no-repeat, var(--bg-color-shade-1);
}

input[type=range].styled-slider.slider-progress:active::-moz-range-track {
  background: linear-gradient(var(--accent-color),var(--accent-color)) 0/var(--sx) 100% no-repeat, var(--bg-color-shade-1);
}

`);

export class ZoomSlider extends HTMLElement {
    static observedAttributes = ['value'];

    constructor() {
	super();
	const shadow = this.attachShadow({ mode: 'open' });
	shadow.adoptedStyleSheets = [globalStyleSheet, zoomSliderStylesheet];

	this.sidebar = document.createElement('div');
	this.sidebar.classList.add('sidebar');
	
	this.wrapper = document.createElement('div');
	this.wrapper.classList.add('wrap');
	
	this.input = document.createElement('input');
	this.input.type = 'range';
	this.input.min = 0.1;
	this.input.max = 2;
	this.input.step = 0.001;
	this.input.classList.add('styled-slider');
	this.input.classList.add('slider-progress');
	this.input.style.setProperty('--value', this.input.value);
	this.input.style.setProperty('--min', this.input.min == '' ? '0' : this.input.min);
	this.input.style.setProperty('--max', this.input.max == '' ? '100' : this.input.max);

	this.wrapper.append(this.input);
	this.sidebar.append(this.wrapper);
	
	shadow.append(this.sidebar);
    }

    attributeChangedCallback(name, oldValue, newValue) {
	if(name == 'value') {
	    this.input.value = newValue;
	    this.input.style.setProperty('--value', this.input.value);
	    this.input.style.setProperty('--min', this.input.min == '' ? '0' : this.input.min);
	    this.input.style.setProperty('--max', this.input.max == '' ? '100' : this.input.max);
	}
    }
}


customElements.define('zoom-slider', ZoomSlider);
