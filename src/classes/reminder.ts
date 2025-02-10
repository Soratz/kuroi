import { Collection, User } from 'discord.js';

export class ReminderManager {
	reminderList: Collection<string, Reminder>;
	reminderCheckInterval: NodeJS.Timeout | null;

	constructor() {
		this.reminderList = new Collection();
		this.reminderCheckInterval = null;
	}

	addReminder(reminder: Reminder) {
		// Each user can only have one reminder at a time
		this.reminderList.set(reminder.user.id, reminder);
		if (!this.reminderCheckInterval) {
			this.startReminderCheck();
		}
	}

	hasReminder(user: User) {
		return this.reminderList.has(user.id);
	}

	removeReminder(reminder: Reminder) {
		this.reminderList.delete(reminder.user.id);
	}

	checkReminders() {
		try {
			this.reminderList.forEach((reminder) => {
				if (reminder.checkReminder()) {
					reminder.sendReminder(`Hey bunu hatırlaman lazım!: ${reminder.message}`);
					this.removeReminder(reminder);
					if (this.reminderList.size === 0) {
						this.stopReminderCheck();
					}
				}

			});
		} catch (error) {
			console.error(`Error checking ${this.reminderList.size} reminders: ${error}`);
		}
	}

	startReminderCheck() {
		this.reminderCheckInterval = setInterval(() => {
			this.checkReminders();
		}, 1000);
	}

	stopReminderCheck() {
		if (this.reminderCheckInterval) {
			clearInterval(this.reminderCheckInterval);
			this.reminderCheckInterval = null;
		}
	}

	remindAll() {
		this.reminderList.forEach((reminder) => {
			reminder.sendReminder(`Ben şimdi çıkıyorum. Bunu hatırlaman lazım: ${reminder.message}`);
		});
	}
}


export class Reminder {
	message: string;
	time_added: number;
	reminder_time: number;
	user: User;

	constructor(message: string, minutes: number, user: User) {
		this.message = message;
		this.time_added = Date.now();
		// convert minutes to milliseconds
		this.reminder_time = minutes * 60 * 1000;
		this.user = user;
	}

	checkReminder() {
		return (Date.now() - this.time_added >= this.reminder_time);
	}

	sendReminder(message: string) {
		this.user.send(message);
	}
}
