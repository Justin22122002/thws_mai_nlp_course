export class Camera {
    constructor(lookAt, rotation, scale, shallowness) {
	/**
	 * lookAt (3-entry array): 3D world point to place at screen center
	 * rotation (float): rotation about lookAt point in radians
	 * scale: drawing scale / camera zoom
	 * shallowness: viewing angle (sprite stack separation
	 */
	this.lookAt = lookAt;
	this.rotation = rotation;
	this.scale = scale;
	this.shallowness = shallowness;
    }
}
