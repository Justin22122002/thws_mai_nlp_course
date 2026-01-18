"use strict";

import { Terrain } from "../Graphics/terrain.js";
import { ObjectPose, InstancedVoxelModel } from "../Graphics/voxel-object.js";
import { terrainScale, totalWorldLevels, worldHorizontalResolution } from "../constants.js";

import { backendCategoryCodes } from "../constants.js";

function towerSprites (classIndex) {
    return [
	'resources/tower/sprite_tower00.png',
	'resources/tower/sprite_tower01.png',
	'resources/tower/sprite_tower02.png',
	'resources/tower/sprite_tower03.png',
	'resources/tower/sprite_tower04.png',
	'resources/tower/sprite_tower05.png',
	'resources/tower/sprite_tower06.png',
	'resources/tower/sprite_tower07.png',
	'resources/tower/sprite_tower08.png',
	'resources/tower/sprite_tower09.png',
	'resources/tower/sprite_tower10.png',
	'resources/tower/sprite_tower11.png',
	'resources/tower/sprite_tower12.png',
	'resources/tower/sprite_tower13.png',
	'resources/tower/sprite_tower14.png',
	'resources/tower/sprite_tower15.png',
	'resources/tower/sprite_tower16.png',
	'resources/tower/sprite_tower17.png',
	'resources/tower/sprite_tower18.png',
	`resources/flag${classIndex}/flag_0.png`,
	`resources/flag${classIndex}/flag_1.png`,
	`resources/flag${classIndex}/flag_2.png`,
    ]
}

function argMax(arr) {
    return arr.indexOf(Math.max(...arr));
}

export const makeWorldBuilderCeptor = (gl) => {

    let towerPositions = [];
    
    return (action, store) => {
	if (action.name == 'rebuild-world') {

	    const terrain = new Terrain(gl, worldHorizontalResolution, totalWorldLevels, worldHorizontalResolution, 0.12, terrainScale, store.state.flatPositions, true);
	    
	    store.state.graphics.terrain = terrain;

	    const treePositions = terrain.getRandomTreePositions(50 * 5, [0.07 * terrainScale, 0.07 * terrainScale, 0.7 * terrainScale]);
	    towerPositions = terrain.getTowerPositions(store.state.flatPositions, [0.05 * terrainScale, 0.05 * terrainScale, 0.5 * terrainScale * 0.5]);

	    store.state.pointsOfInterest = towerPositions.map((towerPosition, i) => {
		const songName = store.state.songs[i].songName + ' - ' + store.state.songs[i].artist;
		return [...towerPosition.location, songName];
	    });

	    const treeVoxelModel = new InstancedVoxelModel(gl, true) 
    		  .tree(16, 32)
		  .build(treePositions);

	    const towerVoxelModels = [];
	    for(let i = 0; i < backendCategoryCodes.length + 1; i++) {
		towerVoxelModels.push(
		    new InstancedVoxelModel(gl, false) 
			.object(towerSprites(i), 4)
			.build([])
		);
	    }

	    towerVoxelModels[0].changePoses(towerPositions);

	    store.state.graphics.trees = treeVoxelModel;
	    store.state.graphics.towers = towerVoxelModels;

	    return null;
	}
	if (action.name == 'update-tower-flag') {
	    if (!towerPositions) {
		console.log('WARN: tower terrain height not calculated before first game decision');
	    }

	    function towerCategory(song) {
		if (song.done == -1)
		    return 0;
		return argMax(song.points) + 1;
	    }

	    store.state.graphics.towers.forEach((towerVoxelModel, i) => {
		const positions = towerPositions.filter((_, index) => towerCategory(store.state.songs[index]) == i);
		towerVoxelModel.changePoses(positions);
	    });
	}
	return action;
    }
};
