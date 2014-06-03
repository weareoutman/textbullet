var HOST = '127.0.0.1',
	PORT = 8080,
	RETRIES = 5,
	DELAY = 500;

var socket,
	activeInfo,
	promptAfterConnected = false,
	delaying = false,
	retries = RETRIES,
	retryTimer;

function log() {
	console.log.apply(console, arguments);
}

function connect() {
	log('Connecting');
	delaying = false;
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

function activated() {
	return (socket && (socket.readyState === socket.OPEN || socket.readyState === socket.CONNECTING)) || delaying;
}

function onopen() {
	log('Connected');
	retries = RETRIES;
	setIcon('connected');
	// setPopup('popup.html');
	sendChannels();
	if (promptAfterConnected) {
		promptAfterConnected = false;
		toPrompt();
	}
}

function onmessage(e) {
	log('Received', e.data);
	var data = JSON.parse(e.data);
	if (activeInfo) {
		chrome.tabs.sendMessage(activeInfo.tabId, {
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
		delaying = true;
		retryTimer = setTimeout(connect, delay);
	}
}

function onerror() {
	log('Connect error');
	setIcon(storage.local.getItem('turn') === 'on' ? 'closed' : 'normal');
	promptAfterConnected = false;
}

function send(data) {
	log('Sending', data);
	return socket.send(JSON.stringify(data));
}

function toPrompt() {
	if (connecting() || delaying) {
		promptAfterConnected = true;
		return;
	}
	if (! connected()) {
		promptAfterConnected = true;
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
		path: 'icons/' + icon + '.svg'
	});
}

function sendChannels() {
	var channels = storage.local.getItem('channels') || [];
	if (channels.length > 0) {
		send({
			channels: channels
		});
	}
}

function turnOff() {
	if (connected() || connecting()) {
		retries = 0;
		socket.close();
	} else {
		if (delaying) {
			clearTimeout(retryTimer);
			delaying = false;
		}
		setIcon('normal');
	}
}

function turnOn() {
	if (! activated()) {
		retries = RETRIES;
		connect();
	}
}

chrome.tabs.onActivated.addListener(function(active) {
	activeInfo = active;
});

chrome.runtime.onMessage.addListener(function(request, sender){
	switch (request.action) {
		case 'prompt':
			toPrompt();
			break;
	}
});