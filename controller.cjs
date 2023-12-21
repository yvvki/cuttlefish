const app = require('electron');
const remote = require('@electron/remote');

const playlist = remote.getGlobal('playlist');
const steam = remote.getGlobal('steam');
const trials = remote.getGlobal('trials');
const ipcRenderer = require('electron').ipcRenderer;

let isBackground = true;
let savedSlider = 25;
function bakc() {
	// Document.getElementById('load').style.display="none"

	ipcRenderer.send('goBack');
}

function toggleHIDE() {
	ipcRenderer.send('autotoggle');
}

function toggleIT(bool) {
	if (typeof playlist !== 'string') {
		return;
	}

	if (bool !== undefined) {
		savedSlider = 95;
	}

	const slide = document.querySelector('#myRange');
	const togglebutt = document.querySelector('#toggleTxt');
	const togglebutttwo = document.querySelector('#secondToggleTxt');
	isBackground = !isBackground;

	if (slide) {
		if (isBackground) {
			savedSlider = slide.value;
			slide.value = 100;
		} else {
			// If (savedSlider>80){savedSlider=25}
			slide.value = savedSlider;
			// IpcRenderer.send("opac",savedSlider/100);
		}
	}

	if (togglebutt) {
		if (isBackground) {
			togglebutt.innerText = 'Send To Background';
			togglebutttwo.innerText = '(UnFocus)';
		} else {
			togglebutt.innerText = 'Send To Foreground';
			togglebutttwo.innerText = '(Focus)';
		}
	}

	// Console.log('fires');
	if (document.querySelector('#browserOverlay')) {
		document.querySelector('#browserOverlay').style.display = 'none';
	}

	ipcRenderer.send('toggle');
}

ipcRenderer.on('toggleView', function (event, trials) {
	toggleIT();
});

ipcRenderer.on('shortcut', function (event, arg) {
	const slide = document.querySelector('#myRange');
	//
	if (arg == 0) {
		if (slide) {
			if (
				Number.parseFloat(slide.value) == 100 &&
				typeof playlist === 'string'
			) {
				return;
			}

			// Console.log(slide.value);
			if (Number.parseFloat(slide.value) + 5 >= 100) {
				if (typeof playlist === 'string') {
					toggleIT();
				} else {
					slide.value = 100;
				}
			} else {
				slide.value = Number.parseFloat(slide.value) + 5;
			}
			// Console.log(slide.value);
			//
		}
	} else if (arg == 1) {
		if (slide) {
			if (
				Number.parseFloat(slide.value) == 100 &&
				typeof playlist === 'string'
			) {
				toggleIT(true);
				return;
			}

			slide.value =
				Number.parseFloat(slide.value) - 5 < 0
					? 0
					: Number.parseFloat(slide.value) - 5;
		}
	} else if (arg == 2) {
		const ele = document.querySelector('#playpauser');

		ele.src = ele.src.includes('ic_play_arrow_black_24px')
			? ele.src.replace(/ic_.+/i, 'ic_pause_black_24px.svg')
			: ele.src.replace(/ic_.+/i, 'ic_play_arrow_black_24px.svg');
	}
});

ipcRenderer.on('toggleViz', function (event, arg) {
	if (document.querySelector('#browserOverlay')) {
		document.querySelector('#browserOverlay').style.display = 'none';
	}
});

/*
IpcRenderer.on("test", function(event,trials){
if (document.getElementById("numTrials")){
document.getElementById("numTrials").innerHTML=String(trials);
if (trials==1){
	document.getElementById("ess").innerHTML="";
}}
});
*/
document.addEventListener('DOMContentLoaded', function () {
	/*
	Console.log('selfie');
	console.log(playlist);
	console.log(document.getElementById('scrubbing'));
	*/
	/*
	if (document.querySelector('webview')){
	
	webview=document.querySelector('webview');
	  
		  const loadstart = () => {
			console.log('loadstart');
		  }
	  
		  const loadstop = () => {
		  console.log('loadstop');
		  }
	  
		  webview.addEventListener('did-start-loading', loadstart)
		  webview.addEventListener('did-stop-loading', loadstop)
	
	}
	*/

	const input = document.querySelector('#url');

	if (input) {
		// Execute a function when the user releases a key on the keyboard
		input.addEventListener('keyup', function (event) {
			// Number 13 is the "Enter" key on the keyboard
			if (event.key === 'Enter') {
				// Cancel the default action, if needed
				ipcRenderer.send('openURL', input.value);
			}
		});
	}

	if (
		steam && // Console.log('fireeeeeeeed');
		document.querySelector('#snInput')
	) {
		document.querySelector('#snInput').style.display = 'none';
		document.querySelector('#purch').style.display = 'none';
		document.querySelector('#break').style.display = 'none';
		document.querySelector('#steamFrame').style.display = 'flex';
	}

	if (process.platform.startsWith('win') && document.querySelector('#imag')) {
		document.querySelector('#imag').src = 'assets/img/win.jpg';
	}

	/**/
	if (document.querySelector('#plat11')) {
		if (process.platform.startsWith('win')) {
			document.querySelector('#plat11').innerText = 'control (^)';
		} else {
			document.querySelector('#plat11').innerText = 'command (⌘) ';
		}
	}

	if (document.querySelector('#scrubbing')) {
		if (process.platform.startsWith('win')) {
			document.querySelector('#plat1').innerText = '^';
			document.querySelector('#plat2').innerText = '^';
			document.querySelector('#plat3').innerText = '^';
			document.querySelector('#plat4').innerText = '^';
			document.querySelector('#plat5').innerText = '^';
			document.querySelector('#plat6').innerText = '^';
			document.querySelector('#plat7').innerText = '^';
			document.querySelector('#plat8').innerText = '^';
			document.querySelector('#plat9').innerText = '^';
			document.querySelector('#plat10').innerText = '^';
		} else {
			document.querySelector('#plat1').innerText = '⌘';
			document.querySelector('#plat2').innerText = '⌘';
			document.querySelector('#plat3').innerText = '⌘';
			document.querySelector('#plat4').innerText = '⌘';
			document.querySelector('#plat5').innerText = '⌘';
			document.querySelector('#plat6').innerText = '⌘';
			document.querySelector('#plat7').innerText = '⌘';
			document.querySelector('#plat8').innerText = '⌘';
			document.querySelector('#plat9').innerText = '⌘';
			document.querySelector('#plat10').innerText = '⌘';
		}

		if (typeof playlist === 'string') {
			document.querySelector('#scrubbing').style.display = 'none';
			document.querySelector('#ctrls').style.display = 'none';
			document.querySelector('#togshort').style.display = 'block';

			const slide = document.querySelector('#myRange');
			if (slide) {
				slide.value = 100;
			}
		} else {
			document.querySelector('#hide').style.display = 'none';

			// Document.getElementById('show').style.display="none";
			// document.getElementById('kys').style.display="none";
		}
	}

	if (document.querySelector('#numTrials')) {
		document.querySelector('#numTrials').innerHTML = trials;

		if (trials == 1) {
			document.querySelector('#ess').innerHTML = '';
		} else {
			document.querySelector('#ess').innerHTML = 's';
		}
	}

	if (document.querySelector('#slidecontainer')) {
		ipcRenderer.send('showMenu');
	}
});

/*
Function openApp(){
ipcRenderer.send("startwfile",null);
   
}

function openBrowser(url){
ipcRenderer.send("openbrowser", url);
}
*/

const enterLicense = function () {
	const email = document.querySelector('#email').value;
	// Var sn=document.getElementById("sn2").value+document.getElementById("sn1").value+document.getElementById("sn3").value
	let sn =
		document.querySelector('#sn1').value +
		document.querySelector('#sn2').value +
		document.querySelector('#sn3').value;

	sn = sn.toUpperCase();

	ipcRenderer.send('enterlicense', [email, sn]);
};

ipcRenderer.on('invalid', function (event, trials) {
	alert(
		'Invalid License. Please Re-Check Confirmation Email. Ensure you did not enter your Steam Key, which is separate.',
	);
});
ipcRenderer.on('thx', function (event, trials) {
	alert('Thanks for Purchasing!');
});

ipcRenderer.on('triallimit', function (event, trials) {
	alert('Trial Limit Reached, Please Purchase');
});

const controller = function (parameter, value) {
	// Alert(document.getElementById('vidContainer')) // ??
	// document.getElementById('vidContainer').opacity = .9

	ipcRenderer.send(parameter, value);

	if (parameter == 'playpause') {
		const ele = document.querySelector('#playpauser');

		ele.src = ele.src.includes('ic_play_arrow_black_24px')
			? ele.src.replace(/ic_.+/i, 'ic_pause_black_24px.svg')
			: ele.src.replace(/ic_.+/i, 'ic_play_arrow_black_24px.svg');
	}
};

const webFrame = require('electron').webFrame;

webFrame.setVisualZoomLevelLimits(1, 1);
