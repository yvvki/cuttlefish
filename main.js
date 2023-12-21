import {
	shell,
	ipcMain,
	globalShortcut,
	app,
	BrowserWindow,
	screen,
	dialog,
} from 'electron';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import process from 'node:process';
import Store from 'electron-store';
import {menubar} from 'menubar';
import remote from '@electron/remote/main/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

remote.initialize();

const storage = new Store();
const defaults = {
	email: null,
	sn: null,
	opacity: 0.3,
	trials: 5,
	relaunch: false,
};
let toggleCounter = 0;
let dia = false;

//-------------------
const DRM = false;
const steam = false;
const prompt = false;
//-------------------

global.steam = DRM && steam;

app.commandLine.appendSwitch(
	'widevine-cdm-path',
	join(__dirname, 'widevinecdmadapter.plugin'),
);
// The version of plugin can be got from `chrome://plugins` page in Chrome.
app.commandLine.appendSwitch('widevine-cdm-version', '1.4.8.866');

let pluginName;
switch (process.platform) {
	case 'win32': {
		pluginName = 'pepflashplayer.dll';
		break;
	}

	case 'darwin': {
		pluginName = 'PepperFlashPlayer.plugin';
		break;
	}

	case 'linux': {
		pluginName = 'libpepflashplayer.so';
		break;
	}

	default: {
		break;
	}
}

app.commandLine.appendSwitch('ppapi-flash-path', join(__dirname, pluginName));

// Optional: Specify flash version, for example, v17.0.0.169
app.commandLine.appendSwitch('ppapi-flash-version', '29.0.0.117');

const INDEX_HTML = join('file://', __dirname, 'index.html');
const PROMPT_HTML = join('file://', __dirname, 'prompt.html');
const MODE_HTML = join('file://', __dirname, 'mode.html');

const TRANSPARENT_HTML = join('file://', __dirname, 'transparent.html');
const MENU = join('file://', __dirname, 'menu.html');
const CHILD_PADDING = 0;

ipcMain.on('quitprompt', () => {
	app.quit();
});

ipcMain.on('manual', () => {
	shell.openExternal('http://www.cinqmarsmedia.com/chameleon/manual.html');
});
ipcMain.on('cmm', () => {
	shell.openExternal('https://www.cinqmarsmedia.com/');
});
ipcMain.on('github', () => {
	shell.openExternal(
		'https://github.com/Cinq-Mars-Media/Chameleon-Video-Player',
	);
});
ipcMain.on('donate', () => {
	shell.openExternal(
		'https://www.paypal.com/us/fundraiser/112574644767835624/charity/1944132',
	);
});

// Menubar.setAlwaysOnTop(true, "floating", 1);

// const ipcMain=require('electron')

// var allScreens = screenElectron.getAllDisplays();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
const addClickableRegion = (options) => {
	const {parent} = options;
	const parentBounds = parent.getBounds();
	const {
		width = parentBounds.width,
		height = parentBounds.height,
		x = 0,
		y = 0,
	} = options;

	// Create a child window, setting the position based on the parent's bounds
	const childWindow = new BrowserWindow({
		parent,
		x: parentBounds.x + x,
		y: parentBounds.y + y,
		width: width || parentBounds.width,
		height: height || parentBounds.height,
		// Disable pretty much everything
		transparent: true,
		frame: false,
		skipTaskbar: true,
		movable: false,
		resizable: false,
		maximizable: false,
		minimizable: false,
		fullscreen: false,
		webPreferences: {
			// The `plugins` have to be enabled.
			plugins: true,
			nodeIntegration: true,
			contextIsolation: false,
		},
		icon: join(__dirname, 'assets/icons/png/icon_32x32@2x.png'),
	});
	/* ???????
    // this is a dirty workaround to set the cursor style when hovering over the button
    ipcMain.on(
      'ClickableRegion::set-child-css',
      (e, css) => childWindow.webContents.insertCSS(css)
    );
  
    // When the transpoarent child captures a mouse event, it is forwarded to the parent
    // and mapped to it's coordinates
    ipcMain.on(
      'ClickableRegion::mouse-event',
      (e, data) => {
        parent.webContents.sendInputEvent(Object.assign(
          data,
          {
            x: x + data.x,
            y: y + data.y
          }
        ));
      }
    );
  */
	childWindow.loadURL(TRANSPARENT_HTML);
	childWindow.setIgnoreMouseEvents(true);

	function initMenubar() {
		const menubar = menubar({
			index: MENU,
			browserWindow: {
				height: 300,
				width: 256,
				webPreferences: {
					nodeIntegration: true,
					contextIsolation: false,
				},
				parent,
			},
			tooltip: 'Chameleon Player Options',
			preloadWindow: true,
		});
		global.menubar = menubar;
		globalShortcut.register('Shift+CommandOrControl+t', () => {
			if (
				global.menubar &&
				global.menubar.window &&
				global.menubar.window.webContents
			) {
				global.menubar.window.webContents.send('toggleView');
			}
		});
	}

	initMenubar();

	global.menubarShown = true;
	menubar
		.on('after-show', () => {
			global.menubarShown = true;
		})
		.on('after-hide', () => {
			global.menubarShown = false;
		})
		.on('focus-lost', () => {
			global.menubarShown = false;
			global.menubar.hideWindow();
		});
};

function start() {
	ipcMain.on('openStreamBrowser', (_, url) => {
		global.playlist = url;
		getdimensions();

		modeWin.close();
	});

	ipcMain.on('openURL', (_, arg) => {
		let result = arg;

		if (/[a-z]/i.test(result) && !result.includes('http')) {
			if (result.includes('www')) {
				result = 'http://' + result;
			} else if (result.includes('.')) {
				result = 'http://www.' + result;
			} else {
				result = 'http://www.' + result + '.com';
			}
		}

		// Console.log(result);
		global.playlist = result;
		getdimensions();

		modeWin.close();
	});

	ipcMain.on('showMenu', () => {
		menubar.showWindow();
	});

	ipcMain.on('startwfile', () => {
		if (typeof parent !== 'undefined') {
			parent.close();
		}

		if (!dia) {
			dia = true;
			dialog
				.showOpenDialog({
					properties: ['openFile', 'multiSelections'],
					filters: [
						{
							name: 'Movies',
							extensions: ['mkv', 'avi', 'mp4'],
						},
					],
				})
				.then((filename) => {
					if (filename === undefined) {
						// App.quit()
					} else {
						global.playlist = filename.filePaths;
						/**/
						getdimensions();

						modeWin.close();
					}

					dia = false;
				})
				.catch(console.log);
		}
	});

	ipcMain.on('quitprompt', () => {
		app.quit();
	});
	// Console.log(trials)

	const modeWin = new BrowserWindow({
		width: 1211,
		height: 730,
		frame: false,
		skipTaskbar: true,
		movable: false,
		resizable: false,
		maximizable: false,
		minimizable: false,
		webPreferences: {
			// The `plugins` have to be enabled.
			plugins: true,
			nodeIntegration: true,
			contextIsolation: false,
		},
	});
	modeWin.loadURL(MODE_HTML);

	modeWin.show();
	modeWin.on('close', () => {
		if (global.playlist === undefined) {
			app.quit();
		}
	});

	remote.enable(modeWin.webContents);
}

let promptWin;

function promptDonate() {
	ipcMain.on('start', () => {
		start();
		promptWin.close();
		//
	});

	ipcMain.on('startNoPrompt', () => {
		storage
			.set('auth', {
				data: 'U2FsdGVV3JFudJsuhkjevNoHTzYUz9VwaAMWMvUPaIUsqcDmAKSNWR2eR643rYXSryqb',
			})
			.then(() => {
				start();
				promptWin.close();
			});
	});

	const promptWin = new BrowserWindow({
		width: 600,
		height: 520,
		frame: false,
		skipTaskbar: true,
		movable: false,
		resizable: false,
		maximizable: false,
		minimizable: false,
		webPreferences: {
			// The `plugins` have to be enabled.
			plugins: true,
			nodeIntegration: true,
			contextIsolation: false,
		},
	});
	promptWin.loadURL(PROMPT_HTML);

	promptWin.show();
}

function ready() {
	/*
  Storage.set('auth', {}).then(function () {
      
        })
  */

	globalShortcut.register('CmdOrCtrl+R', () => {});
	globalShortcut.register('Shift+CmdOrCtrl+R', () => {});

	globalShortcut.register('Shift+CmdOrCtrl+X', () => {
		app.quit();
	});

	globalShortcut.register('CmdOrCtrl+-', () => {});
	globalShortcut.register('CmdOrCtrl+=', () => {});

	if (prompt) {
		storage
			.get('auth')
			.then((data) => {
				if (data.data) {
					start();
				} else {
					promptDonate();
				}
			})
			.catch((_) => {
				storage
					.get('data')
					.then((_) => {
						start();
					})
					.catch((_) => {
						promptDonate();
					});
			});
	} else {
		start();
	}
}

function getdimensions() {
	if (process.platform == 'darwin') {
		app.dock.hide();
	}

	/*
    Tray.on('click', function(event) {
      toggleWindow()
  
      // Show devtools when command clicked
      if (window.isVisible() && process.defaultApp && event.metaKey) {
        window.openDevTools({mode: 'detach'})
      }
    })
  
      let menubar = new BrowserWindow({
      width: 300,
      height: 350,
      show: false,
      frame: false,
      resizable: false,
    })
  
    let icon = nativeImage.createFromDataURL(base64Icon)
    tray = new Tray(icon)
  
  */
	const screenElectron = screen;
	const mainScreen = screenElectron.getPrimaryDisplay();

	// Hides the dock icon for our app which allows our windows to join other
	// apps' spaces. without this our windows open on the nearest "desktop" space

	// "floating" + 1 is higher than all regular windows, but still behind things
	// like spotlight or the screen saver

	createWindow(mainScreen.workArea.width, mainScreen.workArea.height, playlist);
	if (promptWin !== undefined) {
		promptWin.close();
	}
}

/*
Function testbutton(){
console.log('test button has fired') // what I want to happen

}
*/

function createWindow(width, height, playlist) {
	let parent = new BrowserWindow({
		webPreferences: {
			plugins: true,
			// Sandbox: true,
			// nodeIntegration: false,
			nodeIntegration: true,
			contextIsolation: false,
			webviewTag: true,
		},
		fullscreen: false,
		width,
		height,
		transparent: true,
		frame: false,
		skipTaskbar: true,
		movable: false,
		resizable: false,
		maximizable: false,
		minimizable: false,
	});

	parent.setSize(width, height);

	if (typeof playlist !== 'string') {
		parent.setIgnoreMouseEvents(true);
	}

	parent.setAlwaysOnTop(true, 'floating', 0);
	// Allows the window to show over a fullscreen window
	parent.setVisibleOnAllWorkspaces(true);

	ipcMain.on('autotoggle', () => {
		console.log('autotoggle');
		if (
			global.menubar &&
			global.menubar.window &&
			global.menubar.window.webContents
		) {
			global.menubar.window.webContents.send('toggleView');
		}
	});

	// SetTimeout(()=>{}, 6000);
	ipcMain.on('toggle', () => {
		// Here???
		toggleCounter++;

		if (toggleCounter % 2) {
			parent.setIgnoreMouseEvents(true);
			// If (!/^win/.test(process.platform)) { robot.mouseClick(); }
		} else {
			parent.setIgnoreMouseEvents(false);
		}

		// Parent.webContents.send("toggleView")
		parent.webContents.send('toggleViz', toggleCounter % 2);
	});

	ipcMain.on('goBack', () => {
		/**/

		parent.webContents.send('relaunch');
	});

	ipcMain.on('toggleMenu', () => {
		// TOGGLE MENU
	});

	ipcMain.on('opac', (_, arg) => {
		parent.webContents.send('opac', arg);
	});

	ipcMain.on('opacityplus', () => {
		parent.webContents.send('opacityplus');
	});

	ipcMain.on('opacityminus', () => {
		parent.webContents.send('opacityminus');
	});

	ipcMain.on('playpause', () => {
		parent.webContents.send('playpause');
	});

	ipcMain.on('timeplus', () => {
		parent.webContents.send('timeplus');
	});

	ipcMain.on('timeminus', () => {
		parent.webContents.send('timeminus');
	});

	ipcMain.on('timefastback', () => {
		parent.webContents.send('timefastback');
	});

	ipcMain.on('timefastforward', () => {
		parent.webContents.send('timefastforward');
	});

	ipcMain.on('quit', () => {
		app.quit();
	});

	//--------------------------------
	/**/
	parent.webContents.once('did-finish-load', () => {
		// Add a transparent clickable child window to capture the mouse events

		addClickableRegion({
			parent,
			x: CHILD_PADDING,
			y: CHILD_PADDING,
			width,
			height,
		});

		// KEYBOARD SHORTCUTS -------------------------------------
		globalShortcut.register('Shift+CommandOrControl+=', () => {
			parent.webContents.send('opacityplus');
			if (
				global.menubar &&
				global.menubar.window &&
				global.menubar.window.webContents
			) {
				global.menubar.window.webContents.send('shortcut', 0);
			}
		});

		globalShortcut.register('Shift+CommandOrControl+-', () => {
			parent.webContents.send('opacityminus');
			if (
				global.menubar &&
				global.menubar.window &&
				global.menubar.window.webContents
			) {
				global.menubar.window.webContents.send('shortcut', 1);
			}
		});

		globalShortcut.register('Shift+CommandOrControl+j', () => {
			if (global.menubarShown) {
				menubar.hideWindow();
			} else {
				menubar.showWindow();
			}
		});

		/*
        GlobalShortcut.register('Shift+CommandOrControl+0', () => {
          parent.webContents.send("opacityhalf");
        })
        */
		/*
        globalShortcut.register('Shift+CommandOrControl+t', () => {
          parent.webContents.send("toggleView");
        })
    */
		globalShortcut.register('Shift+CommandOrControl+h', () => {
			parent.webContents.send('opacitynone');
			// Global.menubar.window.webContents.send("shortcut",3);
		});
		globalShortcut.register('Shift+CommandOrControl+f', () => {
			parent.webContents.send('opacityfull');
			// Global.menubar.window.webContents.send("shortcut",3);
		});

		globalShortcut.register('Shift+CommandOrControl+]', () => {
			parent.webContents.send('timeplus');
		});

		globalShortcut.register('Shift+CommandOrControl+\\', () => {
			parent.webContents.send('skip');
		});

		globalShortcut.register('Shift+CommandOrControl+[', () => {
			parent.webContents.send('timeminus');
		});

		globalShortcut.register('Shift+CommandOrControl+p', () => {
			parent.webContents.send('playpause');
			if (
				global.menubar &&
				global.menubar.window &&
				global.menubar.window.webContents
			) {
				global.menubar.window.webContents.send('shortcut', 2);
			}
		});

		globalShortcut.register('Shift+CommandOrControl+m', () => {
			parent.webContents.send('mute');
		});

		//----------------------------------------------------------

		// could do this in index.html
		// parent.webContents.insertCSS(`body { padding:${CHILD_PADDING}px !important; }`);
		// parent.playlist=playlist
		// parent.webContents.send('playlist', playlist);

		parent.show();
		parent.blur();
		/*
        If (!/^win/.test(process.platform)) {
          robot.mouseClick();
        }
    */
	});

	parent.loadURL(INDEX_HTML);
	// Parent.openDevTools();
	//---------------------------------

	/*
    // and load the index.html of the app.
    parent.loadURL(url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true
    }))
  */
	// Open the DevTools.
	// parent.webContents.openDevTools()

	// Emitted when the window is closed.
	parent.on('closed', () => {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		parent = null;
	});

	remote.enable(parent.webContents);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', ready);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (typeof parent !== 'undefined' && parent === null) {
		createWindow(mainScreen.workArea.width, mainScreen.workArea.height);
	}
});

app.on('widevine-ready', (version, lastVersion) => {
	if (lastVersion === null) {
		console.log('Widevine ' + version + ' is ready to be used!');
	} else {
		console.log(
			'Widevine ' +
				version +
				', upgraded from ' +
				lastVersion +
				', is ready to be used!',
		);
	}
});
app.on('widevine-update-pending', (currentVersion, pendingVersion) => {
	console.log(
		'Widevine ' +
			currentVersion +
			' is ready to be upgraded to ' +
			pendingVersion +
			'!',
	);
});
app.on('widevine-error', (error) => {
	console.log('Widevine installation encountered an error: ' + error);
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
