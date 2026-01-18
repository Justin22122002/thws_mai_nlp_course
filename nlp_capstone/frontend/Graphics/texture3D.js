"use strict";

import { terrainConfig } from '../constants.js';
import { createNoise3D } from '../Lib/simplex-noise.js';

export class Texture3D {
    constructor(gl, smooth) {
	this.gl = gl;
	this.levels = [];
	this.dimensions = [];
	this.smooth = smooth;
    }

    alphaAtIndex(x, y, z) {
	return this.levels[z][(x + this.dimensions[0]*y) * 4 + 3]
    }

    createTexturesFromURIs(uriList) {
	this.levels = [new Uint8Array(4)];
	this.dimensions = [1, 1];
	this.build();
	
	const lengthToLoad = uriList.length;
	let loaded = 0;
	const waitAndBuild = () => {
	    loaded++;
	    if (loaded >= lengthToLoad){
		this.dimensions = [this.levels[0].naturalWidth, this.levels[0].naturalHeight];
		this.build();
	    }
	};
	
	this.levels = uriList.map((uri) => {
	    const img = new Image();
	    img.onload = waitAndBuild;
	    img.src = uri;
	    return img;
	});
	return this;
    }

    createTerrainTexture(width, length, levels, flatPositions, config) {
	// generate noise texture for each terrain height
	const noise3 = createNoise3D();

	if (!config)
	    config = terrainConfig;

	const toIndex = (x, y, c) => (y * width + x) * 4 + c;
	function getColor (threshold) {
	    if (threshold < 0.1)
		return  [0, 0, Math.max(10 * threshold, 0.25)];
	    if (threshold < 0.15){
		const mult = Math.min((threshold - 0.1) * 20 + 0.2, 1.0);
		return [1.0 * mult, 1.0* mult, 0.0];
	    }
	    if (threshold < 0.35) {
		const blend = (threshold - 0.15) / (0.35 - 0.15)
		return [0, blend * 1 + (1-blend) * 0.5, 0];
	    }
	    const blend = (threshold - 0.35) / (1.0 - 0.35)
	    const grey = blend * 0.8 + (1-blend) * 0.3;
	    return [grey, grey, grey];
	}

	const precomputedDistance = new Array(width * length);
	for (let x = 0; x < width; x++) {
	    for (let y = 0; y < length; y++) {
		// minimum inverse distance to PoE
		let distance = 10000;
		for (const flatPosition of flatPositions) {
		    let x_ = (x - flatPosition[0] * width) / width;
		    let y_ = (y - flatPosition[1] * length) / length;
		    distance = Math.min(distance, Math.sqrt(x_*x_ + y_*y_));
		}
		distance = Math.min(0.05 / distance, 2);

		let x_ = (x - 0.5 * width) / width;
		let y_ = (y - 0.5 * length) / length;
		const centerDistance = Math.max(1 - Math.sqrt(x_*x_ + y_*y_) * 2, 0);
		
		distance *= Math.pow(centerDistance, 0.25);
		precomputedDistance[x + y * width] = distance;
	    }
	}
	
	for (let z = 0; z < levels; z++) {
	    const noise = new Uint8Array(width * length * 4);
	    const heightPenalty = Math.pow((1 - z / levels) * 2, 1.5);
	    for (let x = 0; x < width; x++) {
		for (let y = 0; y < length; y++) {
		    const distance = precomputedDistance[x + y * width];

		    let alpha = 0;
		    config.resolution.forEach(
			_config => {
			    let _x = x * (_config[0] / width);
			    let _y = y * (_config[1] / length);
			    let _z = z * (_config[2] / levels);
			    alpha += (Math.max(0, (noise3(_x, _y, _z) + 1.0)/(2.0)) * heightPenalty * distance) * 256 * _config[3];
			}
		    );
		    let color = getColor(z / levels);
		    noise[toIndex(x, y, 0)] = color[0] * 255;
		    noise[toIndex(x, y, 1)] = color[1] * 255;
		    noise[toIndex(x, y, 2)] = color[2] * 255;
		    noise[toIndex(x, y, 3)] = alpha;

		}
	    }
	    this.levels.push(noise);

	}
	this.dimensions = [width, length];
	return this.build();
    }

    createSphereTexture(resolution) {
	this.dimensions = [resolution, resolution];
	const center = resolution / 2;
	for (let x = 0; x < resolution; x++) {
	    let level = new Uint8Array(resolution * resolution * 4);
	    for (let y = 0; y < resolution; y++) {
		for (let z = 0; z < resolution; z++) {

		    let x_ = x - center;
		    let y_ = y - center;
		    let z_ = z - center;
		    let value = Math.round((Math.sqrt(x_*x_ + y_*y_ + z_*z_) < (resolution * 0.5)) * 255);
		    level[(z + y * resolution) * 4 + 0] = 255;
		    level[(z + y * resolution) * 4 + 1] = 255;
		    level[(z + y * resolution) * 4 + 2] = 255;
		    level[(z + y * resolution) * 4 + 3] = value;
		}
	    }
	    this.levels.push(level);
	}
	
	return this.build();
    }
    
    createTreeTexture(resolutionHorizontal, resolutionVertical) {
	this.dimensions = [resolutionHorizontal, resolutionHorizontal];
	const center = resolutionHorizontal / 2;
	let resolutionVerticalHalf = resolutionVertical * 0.15;
	for (let x = 0; x < resolutionVertical; x++) {
	    let verticalFadeoutLinear = 1 - (x - resolutionVerticalHalf) / (resolutionVertical - resolutionVerticalHalf);
	    let verticalFadeoutReverseLinear = (1 - verticalFadeoutLinear) * 2.5;
	    let verticalFadeoutPolynomial = Math.pow(verticalFadeoutLinear, 1.5);
	    let verticalFadeoutSubPolynomial = Math.pow(verticalFadeoutLinear, 0.25);
	    let verticalFadeout = Math.min(verticalFadeoutLinear, verticalFadeoutReverseLinear, verticalFadeoutPolynomial, verticalFadeoutSubPolynomial, 0.6);
	    if (x < resolutionVerticalHalf)
		verticalFadeout = 0;
	    let level = new Uint8Array(resolutionHorizontal * resolutionHorizontal * 4);
	    for (let y = 0; y < resolutionHorizontal; y++) {
		for (let z = 0; z < resolutionHorizontal; z++) {

		    let randomNoise = Math.random();
		    randomNoise = 0.7 * randomNoise + 1.0*(1-randomNoise);
		    let y_ = y - center;
		    let z_ = z - center;
		    let radius = Math.sqrt(y_*y_ + z_*z_);
		    let value = Math.round((radius < (resolutionHorizontal * 0.5 * verticalFadeout * randomNoise)) * 255);
		    level[(z + y * resolutionHorizontal) * 4 + 0] = 40;
		    level[(z + y * resolutionHorizontal) * 4 + 1] = 92;
		    level[(z + y * resolutionHorizontal) * 4 + 2] = 0;
		    level[(z + y * resolutionHorizontal) * 4 + 3] = value;
		    if (x < resolutionVerticalHalf * 1.5) {
			level[(z + y * resolutionHorizontal) * 4 + 0] = 94;
			level[(z + y * resolutionHorizontal) * 4 + 1] = 57;
			level[(z + y * resolutionHorizontal) * 4 + 2] = 0;
			if (radius < resolutionHorizontal * 0.05) {
			    level[(z + y * resolutionHorizontal) * 4 + 3] = 255;
			}
		    }
		}
	    }
	    this.levels.push(level);
	}
	
	return this.build();
    }
    
    build() {
	const gl = this.gl;
	this.arrayTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.arrayTexture);
	gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, this.smooth ? gl.LINEAR : gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, this.smooth ? gl.LINEAR : gl.NEAREST);
	
	const width = this.dimensions[0];
	const height = this.dimensions[1];
	gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RGBA8, width, height, this.levels.length);
	
	this.levels.forEach((levelTexture, i) => {
	    gl.texSubImage3D(
		gl.TEXTURE_2D_ARRAY,
		0,
		0,
		0,
		i,
		width,
		height,
		1,
		gl.RGBA,
		gl.UNSIGNED_BYTE,
		levelTexture
	    );
	})
	return this;
    }

    getTexture() {
	return this.arrayTexture;
    }

    getLevelCount() {
	return this.levels.length;
    }
}
