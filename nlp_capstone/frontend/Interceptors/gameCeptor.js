import { Action } from "../State/action.js";

export const makeGameCeptor = () => (action, store) => {
    switch (action.name) {
    case 'close-game-modal':
	store.state.viewModal = {active: false};
	return null;
    case 'open-game-modal':
	const song = store.state.songs[action.payload];
	store.state.viewModal.active = true;
	store.state.viewModal.choices = song.choices;
	store.state.viewModal.songName = song.songName;
	store.state.viewModal.artist = song.artist;
	store.state.viewModal.lyrics = song.lyrics;
	store.state.viewModal.done = song.done;
	store.state.viewModal.points = song.done == -1 ? 0 : song.points[song.done];
	store.state.viewModal.correctChoice = song.points.indexOf(Math.max(...song.points))
	store.state.viewModal.index = action.payload;
	return null;
    case 'choose-category': {
	const song = store.state.songs[store.state.viewModal.index];
	store.state.viewModal.done = action.payload;
	store.state.viewModal.points = song.points[action.payload]
	song.done = action.payload;
	store.state.pointCount += song.points[action.payload];
	store.dispatch(new Action('update-tower-flag'));
	return null;
    }
    default:
	return action;
    }
};
