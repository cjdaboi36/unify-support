import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { EmbedBuilder, GuildTextBasedChannel, Message } from 'discord.js';
import { ticketEmbedColor } from '../lib/constants';
import { getOpenTicketByChannelFromCache } from '../lib/cache';
import { ticketMessages, ticketType } from '../schema/tickets';
import { createErrorEmbed, getUserRoleInServer } from '../lib/utils';

@ApplyOptions<Command.Options>({
	name: 'reply',
	aliases: ['r'],
	description: 'Use this command to reply to a modmail ticket.'
})
export class ReplyCommand extends Command {
	public override async messageRun(message: Message, args: Args) {
		const messageChannel = message.channel as GuildTextBasedChannel;
		const noPrefix = await args.rest('string').catch(() => null);

		const openTicket = (await getOpenTicketByChannelFromCache(messageChannel.id)) as ticketType;
		if (!openTicket) {
			return message.reply({
				embeds: [createErrorEmbed('No open ticket found for this channel.')]
			});
		}

		const userRole = await getUserRoleInServer(message.author.id);
		const usrDisplayName = message.author.globalName ? `${message.author.globalName} (@${message.author.username})` : message.author.username;

		try {
			const usrMsg = await this.container.client.users.send(openTicket.authorId, {
				embeds: [
					new EmbedBuilder()
						.setColor(ticketEmbedColor)
						.setDescription(noPrefix ? noPrefix : '*No content*')
						.setAuthor({
							name: usrDisplayName,
							iconURL: message.author.avatarURL()!
						})
						.setTimestamp()
						.setFooter({ text: userRole })
				],
				files: Array.from(message.attachments.values())
			});

			const staffMsg = await messageChannel.send({
				embeds: [
					new EmbedBuilder()
						.setColor(ticketEmbedColor)
						.setDescription(noPrefix ? noPrefix : '*No content*')
						.setAuthor({
							name: usrDisplayName,
							iconURL: message.author.avatarURL()!
						})
						.setTimestamp()
						.setFooter({ text: userRole })
				],
				files: Array.from(message.attachments.values())
			});

			await message.delete();
			await this.container.db.insert(ticketMessages).values({
				ticketId: openTicket.id,
				supportMsgId: staffMsg.id,
				clientMsgId: usrMsg.id
			});
		} catch {
			await message.reply({
				embeds: [
					createErrorEmbed(
						'Sorry, I encountered an error while replying to the ticket. The user may have left the server or there was an issue with sending the message.'
					)
				]
			});
		}

		return;
	}
}
