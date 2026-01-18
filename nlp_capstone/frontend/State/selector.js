export class Selector {
    /**
     * Selects a part of the state and calls callback on changes.
     * @param stateSelectorFunction takes in state and returns relevant part
     * @param callbackFunction if relevant part selected changes, is called
     */
    constructor(stateSelectorFunction, callbackFunction) {
	this.stateSelectorFunction = stateSelectorFunction
	this.callbackFunction = callbackFunction
	this.previousState = null
    }

    process(state) {
	const newState = this.stateSelectorFunction(state)
	if (newState != this.previousState) {
	    this.previousState = newState
	    this.callbackFunction(newState)
	}
    }
}
