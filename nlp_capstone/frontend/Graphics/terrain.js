"use strict";

import {
    terrainShaderVertex,
    terrainShaderFragment,
    terrainWaterShaderFragment,
    terrainShadowShaderVertex,
    terrainShadowShaderFragment
} from "./terrainShader.js"
import { loadShader } from "./shader.js"
import { Texture3D } from "./texture3D.js";
import { buildSliceMesh, ObjectPose } from "./voxel-object.js";

export class Terrain {
    constructor (gl, width, height, length, waterLevel, heightScale, flatPositions, smooth) {
	this.gl = gl;
	this.terrainStack = new Texture3D(gl, smooth).createTerrainTexture(width, length, height, flatPositions);
	
	this.terrainProgram = loadShader(gl, terrainShaderVertex, terrainShaderFragment);
	this.waterProgram = loadShader(gl, terrainShaderVertex, terrainWaterShaderFragment);
	this.terrainShadowProgram = loadShader(gl, terrainShadowShaderVertex, terrainShadowShaderFragment);

	this.width = width;
	this.height = height;
	this.length = length;
	
	// terrain 'mesh', just a screen covering quad
	// we achieve 3D effect with shader tricks
	this.terrainMesh = buildSliceMesh(gl, this.terrainStack.getLevelCount());
	
	// initialize constant uniforms
	this.terrainProgram.use();
	this.terrainProgram.setSampler('terrainSlice', 0);

	this.waterProgram.use();
	this.waterProgram.setSampler('waterDepthMap', 0);

	this.waterColor = [91/256, 206/256, 250/256];
	this.waterTime = 0;
	this.waterLevel = waterLevel;

	this.heightScale = heightScale;
    }
    getTowerPositions(flatPositions, towerScale) {
	const viableLocations = [];
	for(const position of flatPositions) {
	    let x = Math.round(position[0] * this.terrainStack.dimensions[0]);
	    let y = Math.round(position[1] * this.terrainStack.dimensions[1]);
	    let topmostVoxel = null;
	    for (let z = this.terrainStack.levels.length - 1; z >= 0; z--) {
		let i = z;
		if (this.terrainStack.alphaAtIndex(x, y, i) > 132) {
		    topmostVoxel = i;
		    break;
		}
	    }
	    if (!topmostVoxel)
		topmostVoxel = this.waterLevel * this.levels.length;
	    
	    viableLocations.push([x/this.width, y/this.length, topmostVoxel/this.height * this.heightScale]);
	}
	
	const poses = [];
	for(const location of viableLocations) {
	    let randScale = Math.random();
	    randScale = randScale * 1.1 + (1 - randScale) * 0.9;
	    poses.push(new ObjectPose(
		location,
		Math.random() * 6.28,
		[towerScale[0]*randScale,towerScale[1]*randScale,towerScale[2]*randScale]
	    ));
	}
	
	return poses;
    }
    getRandomTreePositions(treeCount, treeScale, treeLineStart = 0.15, treeLineEnd = 0.35) {
	treeLineStart *= this.terrainStack.levels.length;
	treeLineEnd *= this.terrainStack.levels.length;

	// returns a list of ObjectPoses
	const viableLocations = [];
	for (let x = 0; x < this.terrainStack.dimensions[0]; x++) {
	    for (let y = 0; y < this.terrainStack.dimensions[1]; y++) {
		let topmostVoxel = null;
		for (let z = treeLineStart; z < treeLineEnd; z++) {
		    let i = Math.round(z);
		    if (this.terrainStack.alphaAtIndex(x, y, i) > 128) {
			topmostVoxel = i;
		    }
		}
		if (topmostVoxel && this.terrainStack.alphaAtIndex(x, y, Math.ceil(treeLineEnd)) < 128)
		    viableLocations.push([x/this.width, y/this.length, topmostVoxel/this.height * this.heightScale]);
	    }
	}

	const poses = [];
	for(let i = 0; i < treeCount; i++) {
	    let randScale = Math.random();
	    randScale = randScale * 1.1 + (1 - randScale) * 0.9;
	    poses.push(new ObjectPose(
		viableLocations[Math.floor(Math.random() * viableLocations.length)],
		Math.random() * 6.28,
		[treeScale[0]*randScale,treeScale[1]*randScale,treeScale[2]*randScale]
	    ));
	}
	
	return poses;
    }

    prepare(camera, shadowCamera, dt) {
	const gl = this.gl;
	
	this.waterTime += dt * 2;
	this.terrainProgram.use();
	this.terrainProgram.setFloat('heightToWidthRatio', window.innerHeight / window.innerWidth);
	this.terrainProgram.setVec3('focusPoint', ...camera.lookAt);
	this.terrainProgram.setFloat('angle', camera.rotation);
	this.terrainProgram.setFloat('zoom', camera.scale);
	this.terrainProgram.setFloat('shallowness', camera.shallowness);
	this.terrainProgram.setVec3('shadowFocusPoint', ...shadowCamera.lookAt);
	this.terrainProgram.setFloat('shadowAngle', shadowCamera.rotation);
	this.terrainProgram.setFloat('shadowZoom', shadowCamera.scale);
	this.terrainProgram.setFloat('shadowShallowness', shadowCamera.shallowness);
	this.terrainProgram.setFloat('sliceSeparation', 1 / this.terrainStack.getLevelCount());
	this.terrainProgram.setFloat('heightScale', this.heightScale);

	this.waterProgram.use();
	this.waterProgram.setFloat('time', this.waterTime);
	this.waterProgram.setFloat('heightToWidthRatio', window.innerHeight / window.innerWidth);
	this.waterProgram.setVec3('focusPoint', ...camera.lookAt);
	this.waterProgram.setFloat('angle', camera.rotation);
	this.waterProgram.setFloat('zoom', camera.scale);
	this.waterProgram.setFloat('shallowness', camera.shallowness);
	this.waterProgram.setVec3('shadowFocusPoint', ...shadowCamera.lookAt);
	this.waterProgram.setFloat('shadowAngle', shadowCamera.rotation);
	this.waterProgram.setFloat('shadowZoom', shadowCamera.scale);
	this.waterProgram.setFloat('shadowShallowness', shadowCamera.shallowness);
	this.waterProgram.setFloat('sliceSeparation', 1 / this.terrainStack.getLevelCount());
	this.waterProgram.setVec3('color', ...this.waterColor);
	this.waterProgram.setFloat('threshold', 0);
	this.waterProgram.setFloat('heightScale', this.heightScale);

	this.terrainShadowProgram.use();
	this.terrainShadowProgram.setFloat('heightToWidthRatio', 1.0);
	this.terrainShadowProgram.setVec3('focusPoint', ...shadowCamera.lookAt);
	this.terrainShadowProgram.setFloat('angle', shadowCamera.rotation);
	this.terrainShadowProgram.setFloat('zoom', shadowCamera.scale);
	this.terrainShadowProgram.setFloat('shallowness', shadowCamera.shallowness);
	this.terrainShadowProgram.setFloat('sliceSeparation', 1 / this.terrainStack.getLevelCount());
	this.terrainShadowProgram.setFloat('heightScale', this.heightScale);
    }
    
    render() {
	const gl = this.gl;
	
	this.terrainProgram.use();
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.terrainStack.getTexture());
	this.terrainMesh.bind();
	gl.drawArrays(gl.TRIANGLES, 0, 6 * this.terrainStack.getLevelCount());

	// draw water
	this.waterProgram.use();
	const planeIndex = Math.round((1 - this.waterLevel) * this.terrainStack.getLevelCount()) * 6;
	gl.drawArrays(gl.TRIANGLES, planeIndex, 6);
    }
    
    renderShadow() {
	const gl = this.gl;
	
	this.terrainShadowProgram.use();
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.terrainStack.getTexture());
	this.terrainMesh.bind();
	gl.drawArrays(gl.TRIANGLES, 0, 6 * this.terrainStack.getLevelCount());
    }

}
