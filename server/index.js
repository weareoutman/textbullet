var HOST = '127.0.0.1',
	PORT = 8080;

var WebSocketServer = require('websocket').server,
	http = require('http'),
	url = require('url');

function log() {
	console.log.apply(console, arguments);
}

var httpServer = http.createServer(function(req, res) {
	var parsed = url.parse(req.url);
	switch (parsed.pathname) {
		case '/stats':
			return stats(req, res);
	}
	res.writeHead(404);
	res.end();
});
httpServer.listen(PORT, HOST);

var wsServer = new WebSocketServer({
	httpServer: httpServer,
	autoAcceptConnections: false
});
wsServer.on('request', onrequest);
log('Listening on %s:%d', HOST, PORT);

var connections = [],
	channelList = [],
	channelMap = {};

function onrequest(req) {
	log('Client connected', req.socket.remoteAddress);
	var socket = req.accept();
	connections.push(socket);
	socket.on('close', onclose.bind(null, socket));
	socket.on('message', function(msg){
		log('Message received', msg);
		if (msg.type === 'utf8') {
			var data;
			try {
				data = JSON.parse(msg.utf8Data);
			} catch(e) {}
			if (! data) {
				return;
			}
			if (typeof data.text === 'string') {
				bullet(data.text, socket);
			} else if (Array.isArray(data.channels)) {
				var oldChannels = socket.channels || [];
				var newChannels = socket.channels = data.channels.slice(0, 3);
				switchChannels(oldChannels, newChannels);
			}
		}
	});
}

function onclose(socket) {
	log('Client disconnected', socket.remoteAddress);
	switchChannels(socket.channels || [], []);
	connections.splice(connections.indexOf(socket), 1);
}

function bullet(text, source) {
	var data = {
		type: 'bullet',
		text: text.substr(0, 40),
		remote: source.remoteAddress
	};
	var msg = JSON.stringify(data);
	log('Bulleting', msg);
	connections.forEach(function(target) {
		var match,
			src = source.channels || [],
			dst = target.channels || [];
		if (dst.length > 0) {
			match = src.some(function(channel){
				return dst.indexOf(channel) !== -1;
			});
		} else {
			match = true;
		}
		if (match) {
			target.send(msg);
		}
	});
}

function broadcast() {
	var msg = JSON.stringify({
		type: 'stats',
		connections: connections.length,
		channels: channelList
	});
	log('Broadcast', msg);
	connections.forEach(function(target){
		target.send(msg);
	});
}

// Routers
function stats(req, res) {
	log('stats');
	var data = {
		connections: connections.length,
		channels: channelList
	};
	res.setHeader('Content-Type', 'application/json');
	res.write(JSON.stringify(data));
	res.end();
}

function switchChannels(oldChannels, newChannels) {
	var exits = oldChannels.filter(function(name){
		return newChannels.indexOf(name) === -1;
	});
	var enters = newChannels.filter(function(name){
		return oldChannels.indexOf(name) === -1;
	});
	exits.forEach(function(name){
		var index = -1;
		channelList.some(function(item, i){
			var match = item.name === name;
			if (match) {
				index = i;
			}
			return match;
		});
		if (index !== -1) {
			var channel = channelList[index];
			if (channel.count <= 1) {
				channelList.splice(index, 1);
			} else {
				channel.count -= 1;
			}
		}
	});
	enters.forEach(function(name){
		var index = -1;
		channelList.some(function(item, i){
			var match = item.name === name;
			if (match) {
				index = i;
			}
			return match;
		});
		if (index !== -1) {
			channelList[index].count += 1;
		} else {
			channelList.push({
				name: name,
				count: 1
			});
		}
	});
	if (enters.length > 0 || exits.length > 0) {
		broadcast();
	}
}
