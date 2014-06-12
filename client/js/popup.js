var bg = chrome.extension.getBackgroundPage();

/*var inputChannels = $('#input-channels'),
	buttonDone = $('#button-done'),
	buttonPrompt = $('#button-prompt');

var channels = (storage.local.getItem('channels') || []).join(',');
inputChannels.val(channels);

buttonDone.on('click', setChannels);
inputChannels.on('keyup', function(e){
	if (e.keyCode === 13) {
		setChannels();
	}
});*/

var inputChannels = $('#input-channels');
var _channels = (storage.local.getItem('channels') || []).join(',');
inputChannels.val(_channels);

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
	// window.close();
});

if (!(storage.local.getItem('turn') === 'on' && bg.activated())) {
	swt.addClass('closed');
}
setTimeout(function(){
	swt.addClass('easing');
}, 1);

/*buttonPrompt.on('click', function(){
	bg.toPrompt();
	window.close();
});*/

function setChannels() {
	var newChannels = inputChannels.val().split(/[,|，]/).map(function(channel){
		return channel.trim().substr(0, 20);
	}).slice(0, 3);
	newChannels = newChannels.filter(function(channel){
		return channel !== '';
	});
	inputChannels.val(newChannels.join(','));
	storage.local.setItem('channels', newChannels);
	if (_channels !== inputChannels.val()) {
		_channels = inputChannels.val();
		bg.sendChannels();
	}
	window.close();
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
		}
	}).fail(function(xhr, reason){
		console.log('fetch failed', reason);
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
				name: input,
				count: 1
			};
		},
		render: {
			option: function(data, escape){
				return '<div class="option"><span class="name">' + escape(data.name) + '</span> <span class="count">(' + data.count + '人)</span></div>';
			},
			option_create: function(data, escape){
				return '<div class="create">创建频道: <strong>' + escape(data.input) + '</strong>&hellip;</div>';
			}
		},
	});
	selectize = inputChannels[0].selectize;
	selectize.focus();
}

inputChannels.change(function(){
	console.log('changed', inputChannels.val());
});

chrome.runtime.onMessage.addListener(function(data, sender){
	console.log('runtime.onMessage', data);
	switch (data.type) {
		case 'stats':
			channels = data.channels;
			connections = data.connections;
			build();
			break;
	}
});
