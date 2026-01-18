export const initialMockState = {
    pointCount: 0,
    viewingCamera: {
	location: [0.5, 0.5, 0.125],
	rotation: 0,
	shallowness: 1.2,
	zoom: 0.6
    },
    graphics: {

    },
    pointsOfInterest: [],
    flatPositions: [
	[0.5, 0.8],
	[0.2, 0.4],
	[0.9, 0.45]
    ],
    songs: [
	{
	    done: -1,
	    points: [0, 6, 3, 1, 0, 0],
	    choices: ['Love', 'Perseverance', 'Self-Determination', 'Aggressive', 'Party', 'Heartbroken'],
	    songName: "Fire",
	    artist: "Kasabian",
	    lyrics: `Shake me into the night
I'm an easy lover
Take me into the fight
I'm an easy brother
And I'm on fire
♪
Burn my sweet effigy
I'm a road runner
Spill my guts on a wheel
I wanna taste, uh-huh
I'm on fire
I'm on fire
And I'm on fire
(I'm going, you tell me, I feel it, I say)
(I'm heading back into the tunnel for my soul to burn)
I'm on fire
(I'm coming, you coming, no hiding, my feeling)
)I wanna take it to the highest over me, yeah)
♪
Wire me up to machines
I'll be your prisoner
Find it hard to believe
You are my murderer
I'm on fire
Look behind you
There's the falling sky
And I'm on fire
(I'm going, you tell me, I feel it, I say)
(I'm heading back into the tunnel for my soul to burn)
I'm on fire
(I'm coming, you coming, no hiding, my feeling)
(I wanna take it to the highest over me, yeah)
♪
And I'm on fire
I'm on fire
Move on, you got to move on
You got to hit 'em to the hip
And get your shake on
Move on, you got to move on
You got to hit 'em to the hip
And get your shake on
(I feel it, I want it, I'm coming, I tell you)
I caught the bullet from the heavens to the one you serve
I'm going, I'm running, out to the highest love
I'm wanna hit you to the hip
And I'm on fire
(Move on, you got to move on)
(You got to hit 'em to the hip)
(And get your shake on)
I'm on fire
(Move on, you got to move on)
(You got to hit 'em to the hip)
(And get your shake on)
`
	},
	{
	    done: -1,
	    points: [3, 1, 0, 0, 0, 6],
	    choices: ['Love', 'Perseverance', 'Self-Determination', 'Aggressive', 'Party', 'Heartbroken'],
	    songName: "The Chain",
	    artist: "Fleetwood Mac",
	    lyrics: `Listen to the wind blow
Watch the sun rise
♪
Run in the shadows
Damn your love, damn your lies
♪
And if you don't love me now
You will never love me again
I can still hear you saying
We would never break the chain (never break the chain)
And if you don't love me now (you don't love me now)
You will never love me again
I can still hear you saying
We would never break the chain (never break the chain)
Listen to the wind blow
Down comes the night
♪
Run in the shadows
Damn your love, damn your lies
♪
Break the silence
Damn the dark, damn the light
♪
And if you don't love me now
You will never love me again
I can still hear you saying
We would never break the chain (never break the chain)
And if you don't love me now (you don't love me now)
You will never love me again
I can still hear you saying
We would never break the chain (never break the chain)
And if you don't love me now (you don't love me now)
You will never love me again
I can still hear you saying
We would never break the chain (never break the chain)
♪
Chain, keep us together (run in the shadows)
Chain, keep us together (running in the shadows)
Chain, keep us together (running in the shadows)
Chain, keep us together (run in the shadows)
Chain, keep us together (run in the shadows)
`
	},
	{
	    done: -1,
	    points: [5, 0, 0, 0, 0, 5],
	    choices: ['Love', 'Perseverance', 'Self-Determination', 'Aggressive', 'Party', 'Heartbroken'],
	    songName: "Dosed",
	    artist: "Red Hot Chili Peppers",
	    lyrics: `I got dosed by you and
Closer than most to you and
What am I supposed to do?
Take it away, I never had it anyway
Take it away and everything will be okay
♪
In you a star is born and
You cut a perfect form and
Someone forever warm
Lay on, lay on, lay on, lay on
Lay on, lay on, lay on, lay on
♪
Way upon the mountain, where she died
♪
All I ever wanted was your life
♪
Deep inside the canyon, I can't hide
♪
All I ever wanted was your life
♪
Show love with no remorse and
Climb onto your seahorse and
This ride is right on course
This is the way I wanted it to be with you
This is the way I knew that it would be with you
Lay on, lay on, lay on, lay on
Lay on, lay on, lay on, lay on
Way upon the mountain, where she died
♪
All I ever wanted was your life
♪
Deep inside the canyon, I can't hide
♪
All I ever wanted was your life
♪
I got dosed by you and
Closer than most to you and
What am I supposed to do
Take it away, I never had it anyway
Take it away and everything will be okay
♪
Way upon the mountain, where she died
♪
All I ever wanted was your life
♪
Deep inside the canyon I can't hide
♪
All I ever wanted was your life
`
	}
    ],
    windowDimensions: [window.innerWidth, window.innerHeight],
    activeAnimations: [],
    viewModal: {
	active: false,
    }
};
