import Command from "../../../../structures/Command";
import SubCommand from "../../../../structures/SubCommand";
import CommandContext from "../../../../structures/CommandContext";
import { Message } from "discord.js";
import DatabaseManager from "../../../../utils/managers/DatabaseManager";
import AutoModPart, { AutoModListPart } from "../../../../utils/types/AutoModPart";
import BulbBotClient from "../../../../structures/BulbBotClient";
import { NonDigits } from "../../../../utils/Regex";

const databaseManager: DatabaseManager = new DatabaseManager();

export default class extends SubCommand {
	constructor(client: BulbBotClient, parent: Command) {
		super(client, parent, {
			name: "add",
			clearance: 75,
			minArgs: 2,
			maxArgs: -1,
			usage: "<part> <item> [items...]",
			argList: ["part:string", "item:string"],
		});
	}

	public async run(context: CommandContext, args: string[]): Promise<void | Message> {
		const partArg: string = args[0];
		let items: string[] = args.slice(1);

		const partexec = /^(website|invite|word)s?$|^(?:words?_?)?(token)s?$|^(ignore)d?_?(channel|user|role)s?$/.exec(partArg.toLowerCase());
		if (!partexec)
			return context.channel.send(
				await this.client.bulbutils.translate("event_message_args_unexpected", context.guild!.id, {
					argument: partArg,
					arg_expected: "part:string",
					arg_provided: partArg,
					usage: "`website`, `invites`, `words`, `words_token`, `ignore_channels`, `ignore_roles`, or `ignore_users`",
				}),
			);
		const partString = partexec[1] ?? partexec[2] ?? `${partexec[3]}_${partexec[4]}`;

		if (!items.length) return context.channel.send(await this.client.bulbutils.translate("global_error.automod_items_length_undefined", context.guild!.id, {}));

		const part: AutoModListPart = AutoModPart[partString];
		if(partString.includes("_")) items = items.map(item => item.replace(NonDigits, ""));
		const result = await databaseManager.automodAppend(context.guild!.id, part, items);

		if (!result.added.length) return context.channel.send(await this.client.bulbutils.translate("automod_already_in_database", context.guild!.id, { item: items.join("`, `") }));
		await context.channel.send(
			await this.client.bulbutils.translate("automod_add_success", context.guild!.id, {
				category: partArg,
				item: result.added.join("`, `"),
			}),
		);
	}
}
