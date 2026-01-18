"use strict";

import { Action } from "../State/action.js";
import { backendCategoryCodes, frontendCategoryDisplayNames } from "../constants.js";

// backend values into normalized song coordinates & frontend song array
function processResponseBody(body) {
    const songArray = body.map(backendSong => {return {
	done: -1,
	points: backendCategoryCodes.map(v => v == backendSong.classname ? 1 : 0), // 1 point for correct answer
	choices: frontendCategoryDisplayNames,
	songName: backendSong.name,
	artist: backendSong.author,
	lyrics: backendSong.lyrics
    }});

    const unnormalizedPositions = body.map(backendSong => backendSong.tsne_vector);
    const unnormalizedPositionsX = unnormalizedPositions.map(position => position[0]);
    const unnormalizedPositionsY = unnormalizedPositions.map(position => position[1]);
    const maxX = Math.max(...unnormalizedPositionsX);
    const maxY = Math.max(...unnormalizedPositionsY);
    const minX = Math.min(...unnormalizedPositionsX);
    const minY = Math.min(...unnormalizedPositionsY);

    const leaveBorder = 0.1;
    const factor = 1 - 2 * leaveBorder;

    const normalizedPositions = unnormalizedPositions.map(position => {
	const normX = (position[0] - minX) / (maxX - minX);
	const normY = (position[1] - minY) / (maxY - minY);
	return [normX * factor + leaveBorder, normY * factor + leaveBorder];
    })
    return [songArray, normalizedPositions];
}

export const makeFetchSongsCeptor = () => {
    return (action, store) => {
	if (action.name == 'load-songs') {
	    fetch('/api/songs')
		.then(response => response.json())
		.then(body => {
		    const [songs, flatPositions] = processResponseBody(body);
		    store.dispatch(new Action('load-songs-finished', [songs, flatPositions]));
		});
	    return null;
	} else if (action.name == 'load-songs-finished') {
	    store.state.flatPositions = action.payload[1];
	    store.state.songs = action.payload[0];
	    store.dispatch(new Action('rebuild-world'));
	    return null;
	}
	
	return action;
    }
}
