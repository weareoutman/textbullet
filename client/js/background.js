var HOST = '127.0.0.1',
	PORT = 8080,
	RETRIES = 5,
	DELAY = 500;

var socket,
	activeMap = {},
	activeWindowId,
	promptAfterConnected = false,
	delaying = false,
	retries = RETRIES,
	retryTimer;

function connect() {
	log.info('Connecting');
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
	log.info('Connected');
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
	log.info('Received', e.data);
	var data = JSON.parse(e.data);
	switch (data.type) {
		case 'bullet':
			if (activeMap[activeWindowId]) {
				chrome.tabs.sendMessage(activeMap[activeWindowId], data);
			}
			break;
		case 'stats':
			chrome.runtime.sendMessage(data);
			break;
	}
}

function onclose(e) {
	log.warn('Failed to connect with', e.reason, e.code);
	// setPopup('');
	retries -= 1;
	if (retries < 1) {
		onerror();
	} else {
		var delay = (RETRIES - retries) * DELAY;
		log.info('Reconnecting in', delay);
		delaying = true;
		retryTimer = setTimeout(connect, delay);
	}
}

function onerror() {
	log.error('Connect error');
	setIcon(storage.local.getItem('turn') === 'on' ? 'closed' : 'normal');
	promptAfterConnected = false;
}

function send(data) {
	log.info('Sending', data);
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
	var text = prompt('输入消息', '#TextBullet ');
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
	var title = 'TextBullet !';
	switch (icon) {
		case 'connecting':
			title = '连接中';
			break;
		case 'closed':
			title = '连接失败';
			break;
	}
	chrome.browserAction.setTitle({
		title: title
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

chrome.tabs.onActivated.addListener(function(info) {
	log.info('onActivated', info);
	activeMap[info.windowId] = info.tabId;
	if (! activeWindowId) {
		activeWindowId = info.windowId;
	}
});
chrome.windows.onFocusChanged.addListener(function(windowId) {
	log.info('onFocusChanged', windowId);
	activeWindowId = windowId;
});
chrome.windows.onRemoved.addListener(function(windowId) {
	log.info('onRemoved', windowId);
	if (activeMap[windowId]) {
		delete activeMap[windowId];
	}
});

chrome.runtime.onMessage.addListener(function(data, sender){
	log.info('runtime.onMessage', data);
	switch (data.type) {
		case 'prompt':
			toPrompt();
			break;
	}
});