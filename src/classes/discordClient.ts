import { Client, ClientOptions, Collection } from "discord.js";

export { DiscordClient }

// Wrapper class for client
class DiscordClient extends Client {
    // Attaching commands to client to access it from the client instance from other files.
    commands: Collection<String, any>; // TODO: any can be changed to a command class
    contextMenuCommands: Collection<String, any>; // TODO: any can be changed to a command class
    buttonCommands: Collection<String, any>; // TODO: any can be changed to a command class
    constructor(options: ClientOptions) {
        super(options)
        this.commands = new Collection();
        this.contextMenuCommands = new Collection();
        this.buttonCommands = new Collection();
    }
}