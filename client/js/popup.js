// Background Page
var bg = chrome.extension.getBackgroundPage();

// requestAnimationFrame
var nextFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame;

// Channels input
var inputChannels = $('#input-channels');

// Default empty channel
var _channels = (storage.local.getItem('channels') || []).join(',');
inputChannels.val(_channels);

// Switch button
var swt = $('.switch').click(function(){
	var turn = swt.hasClass('closed') ? 'on' : 'off';
	storage.local.setItem('turn', turn);
	if (turn === 'on') {
		bg.turnOn();
		swt.removeClass('closed');
	} else {
		bg.turnOff();
		swt.addClass('closed');
	}
	// TODO: toggle
});

// Turned on
if (!(storage.local.getItem('turn') === 'on' && bg.activated())) {
	swt.addClass('closed');
}

// Easing swt at next frame
nextFrame(function(){
	swt.addClass('easing');
});

function setChannels() {
	var string = inputChannels.val(),
		newChannels = string.split(',');
	storage.local.setItem('channels', newChannels);
	if (_channels !== string) {
		_channels = string;
		bg.sendChannels();
	}
	// window.close();
}

var channels,
	connections,
	selectize;
function fetch() {
	$.ajax({
		url: 'http://' + bg.HOST + ':' + bg.PORT + '/stats',
		dataType: 'json'
	}).done(function(d){
		if (d) {
			channels = d.channels;
			connections = d.connections;
			// TODO: tell stats
		}
	}).fail(function(xhr, reason){
		log.error('fetch failed', reason);
	}).always(function(){
		// setTimeout(fetch, 5e3);
	});
}
fetch();

function build() {
	if (selectize) {
		selectize.destroy();
	}
	inputChannels.selectize({
		maxItems: 3,
		valueField: 'name',
		labelField: 'name',
		searchField: ['name'],
		options: channels,
		persist: false,
		create: function(input){
			return {
				name: cut(input),
				count: 1
			};
		},
		render: {
			option: function(data, escape){
				return '<div class="option"><span class="name">' + escape(data.name) + '</span> <span class="count">(' + data.count + '人)</span></div>';
			},
			option_create: function(data, escape){
				return '<div class="create">创建频道: <strong>' + escape(cut(data.input)) + '</strong>&hellip;</div>';
			}
		},
	});
	selectize = inputChannels[0].selectize;
	selectize.focus();
}

// Trim and cut input to 20 chars
function cut(input) {
	return input.trim().substr(0, 20);
}

inputChannels.change(function(){
	log.info('channels changed', inputChannels.val());
});

chrome.runtime.onMessage.addListener(function(data, sender){
	log.info('runtime.onMessage', data);
	switch (data.type) {
		case 'stats':
			channels = data.channels;
			connections = data.connections;
			build();
			break;
	}
});
