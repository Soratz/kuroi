import { settings } from '../config.json';

export class Queue<T> {
	maxLength: number;
	queue: T[];

	constructor(maxLength = settings.maxQueueLength) {
		this.maxLength = maxLength;
		this.queue = [];
	}

	// peek the first element in the queue
	peek(): T | undefined {
		if (this.queue.length != 0) {
			return this.queue[0];
		}
		return undefined;
	}

	last(): T | undefined {
		const len = this.queue.length;
		if (this.queue.length != 0) {
			return this.queue[len - 1];
		}
		return undefined;
	}

	// returns the current length of the queue
	enqueue(element: T): number {
		if (this.queue.length != this.maxLength) {
			return this.queue.push(element);
		}
		return 0;
	}

	// gets the first element if the queue isn't empty
	dequeue(): T | undefined {
		return this.queue.shift();
	}

	// resets the queue
	empty() {
		this.queue.length = 0;
	}

	// gets the current length of the queue
	getLength(): number {
		return this.queue.length;
	}

	// boolean version of length function
	isEmpty(): boolean {
		return this.queue.length == 0;
	}
}