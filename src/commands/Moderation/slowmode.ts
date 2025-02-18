import Command from "../../structures/Command";
import CommandContext from "../../structures/CommandContext";
import { Message, Snowflake, TextChannel } from "discord.js";
import { NonDigits } from "../../utils/Regex";
import parse from "parse-duration";
import BulbBotClient from "../../structures/BulbBotClient";

export default class extends Command {
	constructor(client: BulbBotClient, name: string) {
		super(client, {
			name,
			description: "Sets a slowmode to the selected channel",
			category: "Moderation",
			usage: "<duration> [channel]",
			examples: ["slowmode 60m", "slowmode 123456789012345678 30m", "slowmode #general 0s"],
			argList: ["duration:Duration"],
			minArgs: 1,
			maxArgs: 2,
			clearance: 50,
			userPerms: ["MANAGE_CHANNELS"],
			clientPerms: ["MANAGE_CHANNELS"],
		});
	}

	async run(context: CommandContext, args: string[]): Promise<void | Message> {
		let duration: number;
		let targetChannel: Snowflake;
		if (!args[1]) targetChannel = context.channel.id;
		else targetChannel = args[1].replace(NonDigits, "");
		const channel: TextChannel | null = targetChannel ? <TextChannel>await context.guild?.channels.fetch(targetChannel).catch(() => null) : null;

		if (!channel)
			return context.channel.send(
				await this.client.bulbutils.translate("global_not_found", context.guild?.id, {
					type: await this.client.bulbutils.translate("global_not_found_types.channel", context.guild?.id, {}),
					arg_expected: "channel:Channel",
					arg_provided: args[1],
					usage: this.usage,
				}),
			);

		if (args.length === 1) duration = <number>parse(args[0]);
		else duration = <number>parse(args[0]);

		if (duration < <number>parse("0s") || duration === null) return context.channel.send(await this.client.bulbutils.translate("duration_invalid_0s", context.guild?.id, {}));
		if (duration > <number>parse("6h")) return context.channel.send(await this.client.bulbutils.translate("duration_invalid_6h", context.guild?.id, {}));

		try {
			await channel.setRateLimitPerUser(duration / 1000);
		} catch (error) {
			return await context.channel.send(
				await this.client.bulbutils.translate("slowmode_missing_perms", context.guild?.id, {
					channel,
				}),
			);
		}

		if (duration === parse("0s")) await context.channel.send(await this.client.bulbutils.translate("slowmode_success_remove", context.guild?.id, { channel }));
		else if (args.length === 1)
			await context.channel.send(
				await this.client.bulbutils.translate("slowmode_success", context.guild?.id, {
					channel,
					slowmode: args[0],
				}),
			);
		else
			await context.channel.send(
				await this.client.bulbutils.translate("slowmode_success", context.guild?.id, {
					channel,
					slowmode: args[0],
				}),
			);
	}
}
