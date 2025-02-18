import Command from "../../structures/Command";
import CommandContext from "../../structures/CommandContext";
import { Guild, GuildMember, Message } from "discord.js";
import { NonDigits, UserMentionAndID } from "../../utils/Regex";
import { massCommandSleep } from "../../Config";
import InfractionsManager from "../../utils/managers/InfractionsManager";
import BulbBotClient from "../../structures/BulbBotClient";
import { BanType } from "../../utils/types/BanType";

const infractionsManager: InfractionsManager = new InfractionsManager();

export default class extends Command {
	constructor(client: BulbBotClient, name: string) {
		super(client, {
			name,
			description: "Unbans multiple people from a guild",
			category: "Moderation",
			aliases: ["munban"],
			usage: "<user> <user2>... [reason]",
			examples: ["multiunban 123456789012345678 123456789012345678 nice user", "multiunban @Wumpus#0000 @Nelly##0000 nice user"],
			argList: ["user:User"],
			minArgs: 2,
			maxArgs: -1,
			clearance: 50,
			userPerms: ["BAN_MEMBERS"],
			clientPerms: ["BAN_MEMBERS"],
		});
	}

	public async run(context: CommandContext, args: string[]): Promise<void | Message> {
		const targets: RegExpMatchArray = <RegExpMatchArray>args.slice(0).join(" ").match(UserMentionAndID);
		let reason: string = args.slice(targets.length).join(" ").replace(UserMentionAndID, "");

		if (reason === "") reason = await this.client.bulbutils.translate("global_no_reason", context.guild?.id, {});
		let fullList: string = "";

		if (targets!!.length <= 1) {
			await context.channel.send(
				await this.client.bulbutils.translate("action_multi_less_than_2", context.guild?.id, {
					action: await this.client.bulbutils.translate("action_multi_types.unban", context.guild?.id, {}),
				}),
			);
			return await this.client.commands.get("unban")!.run(context, args);
		}

		context.channel.send(await this.client.bulbutils.translate("global_loading", context.guild?.id, {})).then(msg => {
			setTimeout(() => msg.delete(), (args.length - 0.5) * massCommandSleep);
		});

		for (let i = 0; i < targets.length; i++) {
			if (targets[i] === undefined) continue;
			await this.client.bulbutils.sleep(massCommandSleep);

			let target;
			let infID: number;
			try {
				target = await this.client.users.fetch(targets[i].replace(NonDigits, ""));
			} catch (error) {
				await context.channel.send(
					await this.client.bulbutils.translate("global_not_found", context.guild?.id, {
						type: await this.client.bulbutils.translate("global_not_found_types.user", context.guild?.id, {}),
						arg_expected: "user:User",
						arg_provided: targets[i],
						usage: this.usage,
					}),
				);
			}

			infID = await infractionsManager.unban(
				this.client,
				<Guild>context.guild,
				BanType.MANUAL,
				target,
				<GuildMember>context.member,
				await this.client.bulbutils.translate("global_mod_action_log", context.guild?.id, {
					action: await this.client.bulbutils.translate("mod_action_types.unban", context.guild?.id, {}),
					moderator: context.author,
					target,
					reason,
				}),
				reason,
			);

			fullList += ` **${target.tag}** \`\`(${target.id})\`\` \`\`[#${infID}]\`\``;
		}

		return context.channel.send(
			await this.client.bulbutils.translate("action_success_multi", context.guild?.id, {
				action: await this.client.bulbutils.translate("mod_action_types.unban", context.guild?.id, {}),
				full_list: fullList,
				reason,
			}),
		);
	}
}
