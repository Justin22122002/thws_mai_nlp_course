import { Action } from './action.js'
import { Selector } from './selector.js'

export class Store {
    /**
     * Application state store;
     * @param initialState some object of initial states
     * @param interceptors list of function taking
     *   Action and returning a modified action or null 
     * @param reducer function that takes in state and action and returns state
     */
    constructor(initialState, interceptors, reducer) {
	this.state = initialState
	this.interceptors = interceptors
	this.reducer = reducer
	this.subscribers = []
    }

    dispatch(action) {
	for (const interceptor of this.interceptors) {
	    action = interceptor(action, this)
	    if (!action)
		break;
	}
	if (action)
	    this.state = this.reducer(action, this.state)
	for (const subscriber of this.subscribers) {
	    subscriber.process(this.state)
	}
    }

    subscribe(selector) {
	this.subscribers.push(selector)
	selector.process(this.state)
	return () => {
	    this.subscribers = this.subscribers.filter(s => s !== selector);
	}
    }

    mapToProps(element, map) {
	const subscribers = [];
	for (const [key, value] of Object.entries(map)) {
	    subscribers.push(
		this.subscribe(new Selector(
		    value,
		    newValue => element.setAttribute(key, newValue)
		))
	    );
	}
	return () => subscribers.forEach(unsubscribe => unsubscribe());
    }
}
