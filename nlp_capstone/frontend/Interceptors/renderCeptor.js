"use strict";

import { Camera } from "../Graphics/camera.js";
import { ShadowBuffer } from "../Graphics/shadowBuffer.js";
import { DeferredBuffer } from "../Graphics/deferredBuffer.js";
import { Terrain } from "../Graphics/terrain.js";
import { ObjectPose, InstancedVoxelModel, VoxelRenderer } from "../Graphics/voxel-object.js";
import { lightingPass } from "../Graphics/lightingPass.js";
import { terrainScale, shadowMapWidth, deferredBufferResolution, totalWorldLevels } from "../constants.js";

export const makeRenderCeptor = (gl) => {

    const shadowMap = new ShadowBuffer(gl, shadowMapWidth, shadowMapWidth);

    const deferredBuffer = new DeferredBuffer(gl, deferredBufferResolution[0], deferredBufferResolution[1]);

    const lightingRenderer = lightingPass(gl);

    const voxelGFX = new VoxelRenderer(gl);
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    
    return (action, store)  => {
	if (action.name != 'render'){ 
	    return action;
	}

	if (!store.state.graphics.terrain || !store.state.graphics.trees || !store.state.graphics.towers)
	    return null;

	const state = store.state;
	
	const viewingCamera = new Camera(
	    state.viewingCamera.location,
	    state.viewingCamera.rotation,
	    state.viewingCamera.zoom,
	    state.viewingCamera.shallowness
	);

	const shadowCamera = new Camera(
	    [state.viewingCamera.location[0], state.viewingCamera.location[1], 0.125],
	    3.141 / 3,
	    state.viewingCamera.zoom * 2,
	    3
	);
	const delta = action.payload

	gl.enable(gl.DEPTH_TEST);

	voxelGFX.prepare(viewingCamera, shadowCamera, totalWorldLevels);
	store.state.graphics.terrain.prepare(viewingCamera, shadowCamera, delta);
	
	/**
	 * Render Scene To Shadow Map
	 */
	shadowMap.bind();
	
	gl.viewport(0, 0, shadowMapWidth, shadowMapWidth);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	store.state.graphics.terrain.renderShadow();
	voxelGFX.renderShadow(store.state.graphics.trees);
	store.state.graphics.towers.forEach(tower => voxelGFX.renderShadow(tower));

	/**
	 * render scene albedo
	 */
	deferredBuffer.bind();	
	gl.viewport(0, 0, deferredBufferResolution[0], deferredBufferResolution[1]);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	store.state.graphics.terrain.render();
	voxelGFX.render(store.state.graphics.trees);
	store.state.graphics.towers.forEach(tower => voxelGFX.render(tower));

	deferredBuffer.unbind();

	/**
	 * lighting pass + render to screen
	 */
	gl.viewport(0, 0, window.innerWidth, window.innerHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	gl.disable(gl.DEPTH_TEST);

	lightingRenderer.render(
	    deferredBuffer.getAlbedoTexture(),
	    shadowMap.getShadowTexture(),
	    deferredBuffer.getShadowParameterTexture()
	);
	
	return null;
    }
}
