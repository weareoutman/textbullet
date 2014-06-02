var storage = {};
function defineStorage(name) {
	var store = window[name];
	storage[name.replace('Storage', '')] = {
		getItem: function(key) {
			var value = store.getItem(key);
			if (typeof value !== 'string' || value === '') {
				value = 'null';
			}
			return JSON.parse(value);
		},
		setItem: function(key, value) {
			return store.setItem(key, JSON.stringify(value));
		},
		removeItem: function(key) {
			return store.removeItem(key);
		},
		clear: function() {
			return store.clear();
		}
	};
}
defineStorage('localStorage');
defineStorage('sessionStorage');