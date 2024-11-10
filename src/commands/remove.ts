import { ApplyOptions } from '@sapphire/decorators';
import { Args, Command } from '@sapphire/framework';
import { EmbedBuilder, Message, TextChannel, User } from 'discord.js';
import { ticketEmbedColor } from '../lib/constants';
import { getOpenTicketByChannelFromCache } from '../lib/cache';
import { ticketType } from '../schema/tickets';

@ApplyOptions<Command.Options>({
	name: 'remove',
	description: 'Remove a user/role from a ticket'
})
export class AddCommand extends Command {
	public override async messageRun(message: Message, args: Args) {
		const messageChannel = message.channel as TextChannel;
		const userOrRole = await args.pick('user').catch(async () => await args.pick('role').catch(() => null));
		const openTicket = await getOpenTicketByChannelFromCache(messageChannel.id) as ticketType;

		if (openTicket) {
			if (!userOrRole)
				return message.reply({
					embeds: [
						new EmbedBuilder()
							.setDescription('Oops, you need to provide a valid user (mention or ID) or a valid role id.')
							.setColor(ticketEmbedColor)
					]
				});

			if (userOrRole instanceof User) {
				messageChannel.permissionOverwrites.create(userOrRole.id, { ViewChannel: false, SendMessages: false });
			} else {
				messageChannel.permissionOverwrites.create(userOrRole.id, { ViewChannel: false, SendMessages: false });
			}

			return message.reply({
				embeds: [
					new EmbedBuilder()
						.setDescription(`I have removed <@${userOrRole instanceof User ? '' : '&'}${userOrRole.id}> from this ticket as requested.`)
						.setColor(ticketEmbedColor)
				]
			});
		}

		return;
	}
}
