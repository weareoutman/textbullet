var inputChannels = $('#input-channels'),
	buttonDone = $('#button-done'),
	radioOn = $('#radio-on'),
	radioOff = $('#radio-off'),
	buttonPrompt = $('#button-prompt');

var channels = (storage.local.getItem('channels') || []).join(',');
inputChannels.val(channels);

buttonDone.on('click', setChannels);
inputChannels.on('keyup', function(e){
	if (e.keyCode === 13) {
		setChannels();
	}
});

(storage.local.getItem('turn') === 'on' ? radioOn : radioOff).prop('checked', true);

radioOn.on('click', onturn);
radioOff.on('click', onturn);

buttonPrompt.on('click', function(){
	sendMessage({
		action: 'prompt'
	});
	window.close();
});

function setChannels() {
	var newChannels = inputChannels.val().split(/[,|，]/).map(function(channel){
		return channel.trim().substr(0, 20);
	}).slice(0, 3);
	inputChannels.val(newChannels.join(','));
	storage.local.setItem('channels', newChannels);
	if (channels !== inputChannels.val()) {
		channels = inputChannels.val();
		sendMessage({
			action: 'channels'
		});
	}
	window.close();
}

function onturn() {
	if (this.checked) {
		setTurn(this.value);
	}
}

function setTurn(on) {
	storage.local.setItem('turn', on);
	sendMessage({
		action: on === 'on' ? 'connect' : 'close'
	});
	window.close();
}

function sendMessage(data) {
	chrome.runtime.sendMessage(data);
}