
function log() {
	if (log.enabledMethods.indexOf('log') !== -1) {
		return;
	}
	console.log.apply(console, arguments);
}
log.enabledMethods = ['log', 'info', 'warn', 'error'];
log.enabledMethods.forEach(function(method){
	if (method !== 'log' && typeof console[method] === 'function') {
		if (method in log) {
			throw 'duplicated log method [' + method + ']';
		}
		log[method] = function(){
			console[method].apply(console, arguments);
		};
	}
});
