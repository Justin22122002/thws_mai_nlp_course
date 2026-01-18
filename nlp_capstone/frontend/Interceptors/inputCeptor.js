
export function makeInputCeptor () {

    let inDrag = false;
    let inRotationDrag = false;

    return (action, store) => {
	switch (action.name) {
	case 'change-viewing-camera-zoom':
	    store.state.viewingCamera.zoom = action.payload;
	    break;
	case 'start-mouse-drag':
	    if (action.payload.buttons & 1) {
		inDrag = [action.payload.clientX, action.payload.clientY];
	    }
	    if (action.payload.buttons & 2) {
		inRotationDrag = [action.payload.clientX, action.payload.clientY];
	    }
	    break;
	case 'stop-mouse-drag':
	    if (!(action.payload.buttons & 1)) {
		inDrag = null;
	    }
	    if (!(action.payload.buttons & 2)) {
		inRotationDrag = null;
	    }
	    break;
	case 'move-mouse-drag':
	    if (inDrag) {
		const scale = store.state.viewingCamera.zoom;
		const heightToWidthRatio = window.innerWidth / window.innerHeight;
		const moveX = -((action.payload.clientX - inDrag[0]) / window.innerWidth)  * scale;
		const moveY = ((action.payload.clientY - inDrag[1]) / window.innerHeight) * scale / heightToWidthRatio;

		const angle = store.state.viewingCamera.rotation;
		const xDirX = 1;
		const yDirX = 0;

		const xDirXRotated = xDirX * Math.cos(angle) - yDirX * Math.sin(angle);
		const yDirXRotated = yDirX * Math.cos(angle) + xDirX * Math.sin(angle);
		const xDirYRotated = xDirX * Math.cos(angle + 3.14159/2) - yDirX * Math.sin(angle + 3.14159/2);
		const yDirYRotated = yDirX * Math.cos(angle + 3.14159/2) + xDirX * Math.sin(angle + 3.14159/2);
		store.state.viewingCamera.location[0] += moveX * xDirXRotated;
		store.state.viewingCamera.location[1] += moveY * yDirYRotated;
		store.state.viewingCamera.location[0] += moveY * xDirYRotated;
		store.state.viewingCamera.location[1] += moveX * yDirXRotated;
		
		inDrag = [action.payload.clientX, action.payload.clientY];
	    } else if (inRotationDrag) {
		const moveX = (action.payload.clientX - inRotationDrag[0]) / window.innerWidth;

		store.state.viewingCamera.rotation += moveX;

		inRotationDrag = [action.payload.clientX, action.payload.clientY];
	    }
	    break;
	default:
	    return action;
	}
	return null;
    }
}
