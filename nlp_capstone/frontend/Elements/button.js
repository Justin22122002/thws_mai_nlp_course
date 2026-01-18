function getBooleanAttribute(name) {
    if (this.hasAttribute(name)) {
        const attribute = this.getAttribute(name);
        return attribute === '' || attribute === 'true';
    }
    return false;
}

const iconButtonStyleSheet = new CSSStyleSheet();
iconButtonStyleSheet.replaceSync(`
        button {
            display: flex;
            align-items: center;
            border-style: solid;
            border-color: var(--standard-border-color);
            border-radius: 0.25em;
            border-width: 1px;
            padding: 0.2em;
            box-shadow: var(--standard-shadow);
            cursor: pointer;
            width: 100%;
            background: var(--bg-color-shade-2);
        }

        button:hover {
            background: var(--bg-color-shade-1);
            box-shadow: var(--standard-shadow-hover);
            transition: 0.1s;
        }
        button[disabled] {
            opacity: 0.2;
            box-shadow: none;
        }
        button[disabled]:hover {
            background: var(--bg-color-shade-2);
            box-shadow: none;
            cursor: default;
        }

        .important {
           background: var(--accent-color);
        }
        .important:hover {
           background: var(--accent-color-dark);
           transition: 0.1s;
        }

        button[disabled].important {
           background: var(--accent-color-dark);
        }
        button[disabled].important:hover {
           background: var(--accent-color-dark);
           transition: 0.1s;
        }

        span {
            font-family: var(--standard-font);
            margin-left: 0.2em;
            margin-right: 0.2em;
            color: var(--fg);
            user-select: none;
            white-space: nowrap;
        }
        .text-regular{
        	font-size: 1.25em;
        }
    `);

export class StyledButton extends HTMLElement {
    static get observedAttributes() {
        return ['text', 'is-important', 'disabled'];
    }

    constructor() {
        self = super();

        const shadow = this.attachShadow({ mode: 'open' });

        shadow.adoptedStyleSheets = [iconButtonStyleSheet];

        this.buttonText = document.createElement('span');
        this.buttonText.classList.add('text-regular');

        this.buttonWrapper = document.createElement('button');
        this.buttonWrapper.classList.add('text-regular');

        shadow.append(this.buttonWrapper);
        this.buttonWrapper.append(this.buttonText);
        this.buttonWrapper.addEventListener('click', this.onClick);
    }

    onClick(e) {
        this.dispatchEvent(
            new Event(
                'icon-button-select',
                {
                    bubbles: true,
                    cancelable: true,
                    composed: true, // A boolean value indicating whether the event will trigger listeners outside of a shadow root (see Event.composed for more details). The default is false.
                },
            ),
        );
    }

    get text() {
        return this.getAttribute('text');
    }
    set text(value) {
        this.setAttribute('text', value);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
        case 'text':
                this.buttonText.innerText = newValue;
            break;
	case 'is-important':
	    if (newValue) {
		this.buttonWrapper.classList.add('important');
	    } else {
		this.buttonWrapper.classList.remove('important');
	    }
	    break;
	case 'disabled':
            if (newValue === 'true' || newValue === '') {
                this.buttonWrapper.setAttribute('disabled', true);
            } else {
                this.buttonWrapper.removeAttribute('disabled');
            }
        default:
            break;
        }
    }
}

customElements.define ('styled-button', StyledButton);
