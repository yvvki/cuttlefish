// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const app = require('electron');

const ipcRenderer = app.ipcRenderer;
const remote = require('@electron/remote');

let savedOpacity = 0.25;
const playlist = remote.getGlobal('playlist');
let fileMode = true;
let opacityView = 1;
// Opacity view from localStorage?
// var playlistindex=0;
if (typeof playlist === 'string') {
	fileMode = false;
}

function playvid(i, listener) {
	const vid = document.querySelector('#video');
	// Vid.removeEventListener(listener||0)

	if (playlist[i] === undefined) {
		// IpcRenderer.send("startwfile")
		remote.app.relaunch();
		remote.app.exit(0);
	} else {
		vid.src = playlist[i];
	}

	vid.load();
	vid.play();
	i++;

	vid.addEventListener('ended', function () {
		playvid(i);
	});
	// Vid.onend()=>{
	// if playlist is done, restart?
	// playvid(i)
	// }
}

if (fileMode) {
	document.querySelector('#browserContainer').style.display = 'none';
	playvid(0);

	document.querySelector('#vidContainer').style.opacity = savedOpacity;
	opacityView = savedOpacity;
} else {
	// Document.getElementById('load').style.display="flex"

	document.querySelector('#vidContainer').style.display = 'none';
	document.querySelector('#webV').setAttribute('src', playlist);
}

ipcRenderer.on('relaunch', function () {
	remote.app.relaunch();
	remote.app.exit(0);
});

/**/
ipcRenderer.on('toggleViz', function () {
	if (
		!document.querySelector('#browserContainer').style.opacity ||
		document.querySelector('#browserContainer').style.opacity == 1
	) {
		// SavedOpacity=document.getElementById('browserContainer').style.opacity;

		// if (savedOpacity>.8){savedOpacity=.25}
		// console.log('setting saved opacity?');
		document.querySelector('#browserContainer').style.opacity = savedOpacity;
		opacityView = savedOpacity;
	} else {
		// Console.log('elseeee');
		opacityView = 1;
		document.querySelector('#browserContainer').style.opacity = 1;
	}
});

ipcRenderer.on('mute', function () {
	const vid = document.querySelector('#video');
	vid.muted = !vid.muted;
});

//-----------------------------------------------------------------
function setOpacityView() {
	// If(document.getElementById('browserContainer').style.opacity==1 && !fileMode){return}
	document.querySelector('#vidContainer').style.opacity = opacityView;
	/*
  If (opacityView>.98){
  opacityView=.99
  }
  */
	document.querySelector('#browserContainer').style.opacity = opacityView;
	savedOpacity = opacityView;
}

ipcRenderer.on('opac', function (f, value) {
	/**/
	// console.log('ov',opacityView);
	// console.log('v',val);
	if (
		((opacityView == 1 && value < 1) || (value == 1 && opacityView < 1)) &&
		!fileMode
	) {
		ipcRenderer.send('autotoggle');
		opacityView = value;
		return;
	}

	opacityView = value;

	setOpacityView();
});

ipcRenderer.on('opacityplus', function () {
	opacityView += 0.05;
	if (opacityView > 1) {
		opacityView = 1;
	}

	setOpacityView();
});

ipcRenderer.on('opacityminus', function () {
	opacityView += -0.05;
	if (opacityView < 0) {
		opacityView = 0;
	}

	setOpacityView();
});
ipcRenderer.on('opacityhalf', function () {
	opacityView = 0.5;
	setOpacityView();
});

ipcRenderer.on('opacitynone', function () {
	// If(!document.getElementById('browserContainer').style.opacity || document.getElementById('browserContainer').style.opacity==1){return}

	if (document.querySelector('#vidContainer').style.opacity == 0) {
		setOpacityView();
	} else {
		document.querySelector('#vidContainer').style.opacity = 0;
		document.querySelector('#browserContainer').style.opacity = 0;
	}
});

ipcRenderer.on('opacityfull', function () {
	if (
		!document.querySelector('#browserContainer').style.opacity ||
		document.querySelector('#browserContainer').style.opacity == 1
	) {
		return;
	}

	if (document.querySelector('#vidContainer').style.opacity == 1) {
		setOpacityView();
	} else {
		document.querySelector('#vidContainer').style.opacity = 1;
		document.querySelector('#browserContainer').style.opacity = 0.999;
	}
});

ipcRenderer.on('playpause', function () {
	const vid = document.querySelector('#video');
	// Vid.pause();
	// return
	if (vid.paused) {
		vid.play();
	} else {
		vid.pause();
	}
});

ipcRenderer.on('skip', function () {
	const vid = document.querySelector('#video');
	// Vid.pause();
	vid.currentTime += 999_999_999_999_999_999_999_999;
});

ipcRenderer.on('timeplus', function () {
	const vid = document.querySelector('#video');

	// Vid.pause();
	vid.currentTime += 30;
});

ipcRenderer.on('timeminus', function () {
	const vid = document.querySelector('#video');

	// Vid.pause();
	vid.currentTime -= 15;
});

ipcRenderer.on('timefastback', function () {
	const vid = document.querySelector('#video');

	// Vid.pause();
	vid.currentTime -= 240;
});

ipcRenderer.on('timefastforward', function () {
	const vid = document.querySelector('#video');

	// Vid.pause();
	vid.currentTime += 240;
});
