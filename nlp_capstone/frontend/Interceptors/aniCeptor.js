import { Action } from "../State/action.js";

export class Animation {
    constructor(
	length, // time-length of animation
	applyFunction, // function taking (store, animationAdvancement)
	onEndOfAnimation // function taking (store) fired on end of animation
    ) {
	this.animationAdvancement = 0;
	this.length = length;
	this.applyFunction = applyFunction;
	this.onEndOfAnimation = onEndOfAnimation;
    }

    advance(store, delta) {
	this.animationAdvancement += delta;
	this.percentage = this.animationAdvancement / this.length;

	this.applyFunction(store, this.percentage);

	if (this.animationAdvancement > this.length) {
	    this.onEndOfAnimation(store);
	    return false;
	}

	return true;
    }
}


export const makeAniCeptor = () => {
    return (action, store) => {
	if (action.name == 'render') {	
	    const delta = action.payload;
	    store.state.activeAnimations = store.state.activeAnimations.filter(animation => animation.advance(store, delta));
	    return action;
	}
	else if (action.name == 'start-focus-point-of-interest-animation') {
	    const startViewingCameraLocation = store.state.viewingCamera.location;
	    const startZoom = store.state.viewingCamera.zoom;
	    const endZoom = 0.2;
	    const endViewingCameraLocation = store.state.pointsOfInterest[action.payload];
	    store.state.activeAnimations.push(new Animation(
		0.5,
		(store, advancement) => {
		    const f = (x) => x > 0 ? Math.exp(-(1/x)) : 0;
		    advancement = f(advancement) / (f(advancement) + f(1-advancement));
		    store.state.viewingCamera.zoom = endZoom * advancement + (1-advancement)*startZoom;
		    store.state.viewingCamera.location = [
			endViewingCameraLocation[0] * advancement + (1-advancement) * startViewingCameraLocation[0],
			endViewingCameraLocation[1] * advancement + (1-advancement) * startViewingCameraLocation[1],
			endViewingCameraLocation[2] * advancement + (1-advancement) * startViewingCameraLocation[2],
		    ];
		},
		store => store.dispatch(new Action('open-game-modal', action.payload))
	    ));
	    return null;
	}
	return action;
    };
};
