const { settings } = require('../config.json');

class Queue {
	constructor(maxLength = settings.maxQueueLength) {
		this.maxLength = maxLength;
		this.queue = [];
	}

	peek() {
		if (this.queue.length != 0) {
			return this.queue[0];
		}
		return null;
	}

	enqueue(element) {
		if (this.queue.length != this.maxLength) {
			return this.queue.push(element);
		}
		return 0;
	}

	dequeue() {
		if (this.queue.length != 0) {
			return this.queue.shift();
		}
		return null;
	}

	empty() {
		this.queue.length = 0;
	}
}

module.exports = {
	Queue,
};