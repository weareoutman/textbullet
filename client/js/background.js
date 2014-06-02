var HOST = '127.0.0.1',
	PORT = 8080,
	RETRIES = 5,
	DELAY = 500;

var socket, active,
	retries = RETRIES;

function log() {
	console.log.apply(console, arguments);
}

function connect() {
	log('Connecting');
	socket = new WebSocket('ws://' + HOST + ':' + PORT + '/');
	socket.onopen = onopen;
	socket.onmessage = onmessage;
	socket.onclose = onclose;
	setIcon('connecting');
	storage.local.setItem('turn', 'on');
}

function connected() {
	return socket && socket.readyState === socket.OPEN;
}

function connecting() {
	return socket && socket.readyState === socket.CONNECTING;
}

function onopen() {
	log('Connected');
	retries = RETRIES;
	setIcon('connected');
	// setPopup('popup.html');
	sendChannels();
}

function onmessage(e) {
	log('Received', e.data);
	var data = JSON.parse(e.data);
	if (active) {
		chrome.tabs.sendMessage(active.tabId, {
			action: 'bullet',
			data: data
		});
	}
}

function onclose(e) {
	log('Failed to connect with', e.reason, e.code);
	// setPopup('');
	retries -= 1;
	if (retries < 1) {
		onerror();
	} else {
		var delay = (RETRIES - retries) * DELAY;
		log('Reconnecting in', delay);
		setTimeout(connect, delay);
	}
}

function onerror() {
	log('Connect error');
	setIcon('closed');
}

function send(data) {
	log('Sending', data);
	return socket.send(JSON.stringify(data));
}

function toPrompt() {
	if (connecting()) {
		return;
	}
	if (! connected()) {
		return connect();
	}
	var text = prompt('send text', '#TextBullet ');
	if (text) {
		text = text.trim();
		var data = {
			text: text
		};
		send(data);
	}
}

function setIcon(icon) {
	chrome.browserAction.setIcon({
		path: 'icons/' + icon + '.jpg'
	});
}

/*function setPopup(popup) {
	chrome.browserAction.setPopup({
		popup: popup
	});
}*/

function sendChannels() {
	var channels = storage.local.getItem('channels') || [];
	if (channels.length > 0) {
		send({
			channels: channels
		});
	}
}

chrome.tabs.onActivated.addListener(function(activeInfo) {
	active = activeInfo;
});

// chrome.browserAction.onClicked.addListener(toPrompt);

chrome.runtime.onMessage.addListener(function(request, sender){
	switch (request.action) {
		case 'prompt':
			toPrompt();
			break;
		case 'channels':
			sendChannels();
			break;
		case 'close':
			if (connected() || connecting()) {
				retries = 0;
				socket.close();
			}
			break;
		case 'connect':
			if (! connected() && ! connecting()) {
				connect();
			}
			break;
	}
});