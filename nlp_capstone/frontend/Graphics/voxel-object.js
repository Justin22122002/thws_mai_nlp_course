"use strict";

import {
    voxelObjectShaderVertex,
    voxelObjectShaderFragment,
    voxelObjectShadowShaderVertex,
    voxelObjectShadowShaderFragment
} from "./voxelObjectShader.js";
import { loadShader } from "./shader.js";
import { Texture3D } from "./texture3D.js";

export class ObjectPose {
    constructor(location, rotation, scale) {
	/**
	 * location (3-entry array): 3D position of object
	 * rotation (float): rotation about vertical axie
	 * scale (3-entry array): object scale
	 */
	this.location = location;
	this.rotation = rotation;
	this.scale = scale;
    }
}

export class VoxelRenderer {
    constructor(gl) {
	this.gl = gl;
	this.voxelProgram = loadShader(gl, voxelObjectShaderVertex, voxelObjectShaderFragment);
	this.voxelShadowProgram = loadShader(gl, voxelObjectShadowShaderVertex, voxelObjectShadowShaderFragment);
	this.voxelProgram.use();
	this.voxelProgram.setSampler('objectSlice', 0);
	this.voxelShadowProgram.use();
	this.voxelShadowProgram.setSampler('objectSlice', 0);
    }

    prepare(camera, shadowCamera, totalWorldLevels) {
	this.voxelProgram.use();
	this.voxelProgram.setFloat('heightToWidthRatio', window.innerHeight / window.innerWidth);
	this.voxelProgram.setVec3('focusPoint', ...camera.lookAt);
	this.voxelProgram.setFloat('angle', camera.rotation);
	this.voxelProgram.setFloat('zoom', camera.scale);
	this.voxelProgram.setFloat('shallowness', camera.shallowness);
	this.voxelProgram.setVec3('shadowFocusPoint', ...shadowCamera.lookAt);
	this.voxelProgram.setFloat('shadowAngle', shadowCamera.rotation);
	this.voxelProgram.setFloat('shadowZoom', shadowCamera.scale);
	this.voxelProgram.setFloat('shadowShallowness', shadowCamera.shallowness);
	this.voxelProgram.setFloat('sliceSeparation', 1 / totalWorldLevels);

	this.voxelShadowProgram.use();
	this.voxelShadowProgram.setFloat('heightToWidthRatio', 1.0);
	this.voxelShadowProgram.setVec3('focusPoint', ...shadowCamera.lookAt);
	this.voxelShadowProgram.setFloat('angle', shadowCamera.rotation);
	this.voxelShadowProgram.setFloat('zoom', shadowCamera.scale);
	this.voxelShadowProgram.setFloat('shallowness', shadowCamera.shallowness);
	this.voxelShadowProgram.setFloat('sliceSeparation', 1 / totalWorldLevels);
    }

    render(instancedVoxelModel) {
	this.voxelProgram.use();
	instancedVoxelModel.sliceMesh.bind();

	this.gl.activeTexture(this.gl.TEXTURE0);
	this.gl.bindTexture(this.gl.TEXTURE_2D_ARRAY, instancedVoxelModel.texture.getTexture());
	this.gl.drawArraysInstanced(this.gl.TRIANGLES, 0, 6 * instancedVoxelModel.levels, instancedVoxelModel.instanceCount);
    }

    renderShadow (instancedVoxelModel) {
	this.voxelShadowProgram.use();
	instancedVoxelModel.sliceMesh.bind();
	this.gl.activeTexture(this.gl.TEXTURE0);
	this.gl.bindTexture(this.gl.TEXTURE_2D_ARRAY, instancedVoxelModel.texture.getTexture());
	this.gl.drawArraysInstanced(this.gl.TRIANGLES, 0, 6 * instancedVoxelModel.levels, instancedVoxelModel.instanceCount);
    }
}

export class InstancedVoxelModel {
    constructor(gl, smooth) {
	this.gl = gl;
	this.smooth = smooth;
    }

    object(uriList, duplicate) {
	
	const expandedUriList = uriList.reduce((acc, cur) => {
	    acc.push(cur);
	    for (let i = 0; i < duplicate; i++)
		acc.push(cur);

	    return acc;
	}, []);

	this.texture = new Texture3D(this.gl, this.smooth).createTexturesFromURIs(expandedUriList);
	return this;
    }

    sphere(resolution) {
	this.texture = new Texture3D(this.gl, this.smooth).createSphereTexture(resolution);
	return this;
    }

    tree(resolutionHorizontal, resolutionVertical) {
	this.texture = new Texture3D(this.gl, this.smooth).createTreeTexture(resolutionHorizontal, resolutionVertical);
	return this;
    }

    build(poses) {
	// poses: array of ObjectPose
	const gl = this.gl;
	this.levels = this.texture.getLevelCount();
	this.sliceMesh = buildSliceMesh(gl, this.levels);
	this.instanceCount = poses.length;
	
	configurePoses(gl, this.sliceMesh, poses);

	return this;
    }

    changePoses(poses) {
	configurePoses(this.gl, this.sliceMesh, poses);
	this.instanceCount = poses.length;
	return this;
    }
}

function configurePoses (gl, vao, poses) {

    const instanceAttributes = [];
    for (const pose of poses) {
	instanceAttributes.push(...pose.location);
	instanceAttributes.push(...pose.scale);
	instanceAttributes.push(pose.rotation);
    }

    vao.bind();
    
    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(instanceAttributes), gl.STATIC_DRAW);

    gl.vertexAttribPointer(2, 3, gl.FLOAT, gl.FALSE, 28, 0); // objLocation at location 2
    gl.enableVertexAttribArray(2);

    gl.vertexAttribPointer(3, 3, gl.FLOAT, gl.FALSE, 28, 12); // objScale at location 3
    gl.enableVertexAttribArray(3);

    gl.vertexAttribPointer(4, 1, gl.FLOAT, gl.FALSE, 28, 24); // objRotation at location 4
    gl.enableVertexAttribArray(4);

    gl.vertexAttribDivisor(2, 1);
    gl.vertexAttribDivisor(3, 1);
    gl.vertexAttribDivisor(4, 1);
}

export function buildSliceMesh (gl, levels) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    const vertices_prototypes = [// position, texcoords
	[-1.0, -1.0, 0.0, 0.0 ],
	[-1.0, 1.0, 0.0, 1.0  ],
	[1.0, -1.0, 1.0, 0.0  ],
	[1.0, -1.0, 1.0, 0.0  ],
	[-1.0, 1.0, 0.0, 1.0  ],
	[1.0, 1.0, 1.0, 1.0   ]
    ];
    
    const vertices = [];
    for (let i = levels - 1; i >= 0; i--) {
	vertices_prototypes.forEach(v => {
	    const row = [v[0], v[1], i, v[2], v[3], i];
	    vertices.push(...row);
	})
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    gl.vertexAttribPointer(0, 3, gl.FLOAT, gl.FALSE, 24, 0);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, gl.FALSE, 24, 12);
    gl.enableVertexAttribArray(1);
    
    return {
	bind: () => {
	    gl.bindVertexArray(vao);
	}
    };
}
