import { Collection, User } from 'discord.js';

export class ReminderManager {
	reminderList: Collection<string, Reminder>;
	reminderCheckInterval: NodeJS.Timeout | null;
	closestReminder: Reminder | null;

	constructor() {
		this.reminderList = new Collection();
		this.reminderCheckInterval = null;
		this.closestReminder = null;
	}

	addReminder(reminder: Reminder) {
		// Each user can only have one reminder at a time
		this.reminderList.set(reminder.target_user.id, reminder);
		// Check closes after each addition
		this.closestReminder = this.findClosestReminder();
		if (!this.reminderCheckInterval) {
			this.startReminderCheck();
		}
	}

	findClosestReminder() {
		// Find the closest reminder to the current time
		const now = Date.now();
		let closestReminder = null;
		let closestTime = Infinity;

		this.reminderList.forEach((reminder) => {
			const timeDiff = reminder.reminder_time - now;
			if (timeDiff < closestTime) {
				closestTime = timeDiff;
				closestReminder = reminder;
			}
		});

		return closestReminder;
	}

	hasReminder(user: User) {
		return this.reminderList.has(user.id);
	}

	removeReminder(reminder: Reminder) {
		this.reminderList.delete(reminder.target_user.id);
	}

	deferReminder(reminder: Reminder, minutes = 1) {
		// defer reminder by minutes if its in the list
		if (this.reminderList.has(reminder.target_user.id)) {
			reminder.reminder_time += minutes * 60 * 1000;
			this.closestReminder = this.findClosestReminder();
		}
	}

	async checkReminders() {
		try {
			// If there is a closest reminder and it has passed, send the reminder and remove it
			if (this.closestReminder && this.closestReminder.checkReminder()) {
				let message;
				if (this.closestReminder.creator_user.id !== this.closestReminder.target_user.id) {
					message = `Hey, ${this.closestReminder.creator_user.username} bunu hatırlamanı istedi -> ${this.closestReminder.message}`;
				} else {
					message = `Hey, bunu hatırlaman lazım -> ${this.closestReminder.message}`;
				}
				const result = await this.closestReminder.sendReminder(message);
				if (!result) {
					this.deferReminder(this.closestReminder, 5);
					return;
				}
				this.removeReminder(this.closestReminder);
				// If there are no reminders left, stop the reminder check
				if (this.reminderList.size === 0) {
					this.stopReminderCheck();
				} else {
					// If there are still reminders, find the new closest reminder
					this.closestReminder = this.findClosestReminder();
				}
			}
		} catch (error) {
			console.error(`Error checking ${this.reminderList.size} reminders: ${error}`);
		}
	}

	startReminderCheck() {
		// Check every 5 seconds
		this.reminderCheckInterval = setInterval(async () => {
			await this.checkReminders();
		}, 5000);
	}

	stopReminderCheck() {
		if (this.reminderCheckInterval) {
			clearInterval(this.reminderCheckInterval);
			this.reminderCheckInterval = null;
			this.closestReminder = null;
		}
	}

	async remindAll() {
		this.reminderList.forEach(async (reminder) => {
			await reminder.sendReminder(`Ben şimdi çıkıyorum. Bunu hatırlaman lazım: ${reminder.message}`);
		});
	}
}


export class Reminder {
	message: string;
	time_added: number;
	reminder_time: number;
	target_user: User;
	creator_user: User;

	constructor(message: string, minutes: number, creator_user: User, target_user: User | null) {
		this.message = message;
		this.time_added = Date.now();
		// convert minutes to milliseconds
		this.reminder_time = minutes * 60 * 1000;
		this.creator_user = creator_user;
		this.target_user = target_user ?? creator_user;
	}

	checkReminder() {
		return (Date.now() - this.time_added >= this.reminder_time);
	}

	async sendReminder(message: string) {
		try {
			await this.target_user.send(message);
			return true;
		} catch (error) {
			console.error(`Error sending reminder from ${this.creator_user.username} to ${this.target_user.username}: ${error}`);
			return false;
		}
	}
}
