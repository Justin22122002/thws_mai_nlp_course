export class Action {
    /**
     * Action that impacts the global state.
     * @param name action identifier
     * @param payload action data
     */
    constructor(name, payload) {
	this.name = name
	this.payload = payload
    }
}
