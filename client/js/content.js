
(function(){

	var minTop = 25,
		maxTop,
		minFontSize = 20,
		maxFontSize = 24,
		minUnitDuration = 7500,
		maxUnitDuration = 12500,
		minDuration,
		maxDuration,
		colors = ['#7cb5ec', '#434348', '#90ed7d', '#f7a35c', '#8085e9', '#f15c80', '#e4d354', '#8085e8', '#8d4653', '#91e8e1'],
		docElem = document.documentElement;

	function Bullet(message) {
		var elem = this.elem = $('<div/>'),
			top = random(minTop, maxTop),
			color = colors[random(colors.length - 1)],
			fontSize = random(minFontSize, maxFontSize),
			duration = random(minDuration, maxDuration),
			clientWidth = docElem.clientWidth,
			text = message.text;
		elem.text(text);
		elem.css({
			color: color,
			fontSize: fontSize + 'px',
			fontWeight: 'bold',
			textShadow: '1px 1px 3px #ffffff',
			whiteSpace: 'nowrap',
			border: 'none',
			margin: '0',
			padding: '0',
			position: 'fixed',
			left: clientWidth + 'px',
			top: top + 'px',
			zIndex: '999999',
			transition: 'all ' + duration + 'ms linear'
		});
		elem.appendTo(document.body);
		setTimeout(function(){
			elem.css('webkitTransform', 'translate(-' + (elem.width() + clientWidth) + 'px)');
		});
		setTimeout(function(){
			elem.remove();
		}, duration);
	}

	function random(min, max) {
		if (max === null || max === undefined) {
			max = min;
			min = 0;
		}
		return min + Math.floor(Math.random() * (max - min + 1));
	}

	function onresize() {
		maxTop = docElem.clientHeight - maxFontSize - minTop;
		var unit = docElem.clientWidth / 1280;
		minDuration = Math.round(unit * minUnitDuration);
		maxDuration = Math.round(unit * maxUnitDuration);
	}
	$(window).on('resize.bullet', onresize);
	onresize();
	
	key('command+b, ctrl+b', function(e){
		chrome.runtime.sendMessage({
			action: 'prompt'
		});
		return false;
	});

	chrome.runtime.onMessage.addListener(function(request, sender){
		if (request.action === 'bullet') {
			new Bullet(request.data);
		}
	});
})();