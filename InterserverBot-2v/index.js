const { Client, MessageEmbed, Collection } = require('discord.js'), 
	 Enmap = require("enmap"), 
	 Bot = new Client(), 
	 Cooldowns = new Set(),
	 { token, prefix, embedColor, channels, mongodb, cooldown } = require('./config'), 
	 Messages = new Enmap({provider: new (require('enmap-mongo'))({name: "Messages", dbName: "InterserverBot", url: mongodb})});

Bot.login(token).catch(() => console.error('Token is damaged.'));

Bot.on('ready', async () => {
  if (!Bot.user.bot) return process.exit(0);
  console.log(`${Bot.user.tag} working.`)
  console.log(`Loaded ${channels.filter(x => Bot.channels.cache.has(x)).length} channels.`)
})

Bot.on('message', async (message, messagesIDs = []) => {
  if (!message.guild || !channels.includes(message.channel.id) || message.author.bot === true || message.embeds.length > 0 && message.author.id === Bot.user.id || message.content.startsWith('//.//') || message.content.indexOf('discord.gg') != -1 || message.content.indexOf('discordapp.com/invite') != -1) return;
  if (Cooldowns.has(message.author.id)) return message.delete().catch(error => {});
  channels.forEach((channelID) => {
    if(message.channel.id === channelID || !Bot.channels.cache.has(channelID)) return;
	Messages.set(message.id, {
		message: message.cleanContent,
		user: message.author.id,
		channel: message.channel.id,
		date: Date.now(),
		deleted: false,
		edits: [],
		messages: []
	});
	if (cooldown > 0) {
		Cooldowns.add(message.author.id);
		setTimeout(() => {
			Cooldowns.delete(message.author.id);
		}, cooldown * 1000)
	}
    Bot.channels.cache.get(channelID).send(
      new MessageEmbed()
      .setColor(embedColor)
      .setDescription(message.content.slice(0, 2048))
      .setAuthor(message.author.tag, message.author.displayAvatarURL())
      .setImage(message.attachments.size > 0 ? message.attachments.first().proxyURL : null)
    ).then(({id, channel}) => {
		Messages.push(message.id, {
			message: id,
			channel: channel.id
		}, 'messages');
	}).catch(error => {});
  });
});

Bot.on('messageUpdate', async (a, message) => {
  if(!message.guild || !channels.includes(message.channel.id) || !Messages.has(message.id)) return;
  Messages.push(message.id, message.cleanContent, 'edits')
  Messages.get(message.id).messages.forEach((msg) => {
    if(Bot.channels.cache.has(msg.channel)) Bot.channels.cache.get(msg.channel).messages.fetch(msg.message).then(msg => {
      if(msg) msg.edit(
        new MessageEmbed()
        .setColor(embedColor)
        .setDescription(message.content.slice(0, 2048))
        .setAuthor(message.author.tag, message.author.displayAvatarURL())
        .setImage(message.attachments.size > 0 ? message.attachments.first().proxyURL : null)
      ).catch(error => {})
    }).catch(error => {})
  })
});

Bot.on('messageDelete', async (message) => {
  if(!message.guild || !channels.includes(message.channel.id) || !Messages.has(message.id)) return;
  Messages.set(message.id, true, 'deleted')
  Messages.get(message.id).messages.forEach((msg) => {
    if(Bot.channels.cache.has(msg.channel)) Bot.channels.cache.get(msg.channel).messages.fetch(msg.message).then(msg => {
      if(msg) msg.delete({reason: 'Interserver Message Delete'}).catch(error => {})
    }).catch(error => {})
  })
});

// Commands

if (prefix && prefix !== null) {
	Bot.on('message', async (message, args = [], command = '') => {
		if (!message.guild || message.author.bot || !message.content.startsWith(prefix)) return;
		if (channels.includes(message.channel.id)) return message.delete().catch(error => {});
		args = message.content.slice(prefix.length).split(/\s+/);
		command = args.shift().toLowerCase();
		if (command === 'about') {
			let string = channels.filter(x => Bot.channels.cache.has(x)).map(x => Bot.channels.cache.get(x)).map(x => `[\`${x.name}\`](https://discord.com/channels/${x.guild.id}/${x.id})`).join(' ').slice(0, 1024)
			return message.channel.send(
			new MessageEmbed()
			.setColor(embedColor)
			.setAuthor('Информация', Bot.user.avatarURL())
			.setDescription(`Сообщений - \`${Messages.size.toLocaleString()}\`\nОт вас - \`${Messages.filter(x => !x.deleted && x.user === message.author.id).size.toLocaleString()}\`\n\nСерверов - \`${Bot.guilds.cache.size}\`\nКаналов - \`${Bot.channels.cache.size}\``)
			.addField('Доступные каналы', string)
			)
		} else if (command === 'message') {
			if (!args[0] || !Messages.has(args[0].toLowerCase())) return message.channel.send(`${args[0] ? 'Неверно указан ID' : 'Отсутствует ID'}. Использование - \`${prefix}${command} <MESSAGE-ID>\``)
				let msg = Messages.get(args[0].toLowerCase());
				let embed = new MessageEmbed()
				.setColor(embedColor)
				.setAuthor((Bot.users.cache.has(msg.user) ? Bot.users.cache.get(msg.user).tag : msg.user), (Bot.users.cache.has(msg.user) ? Bot.users.cache.get(msg.user).avatarURL() : Bot.user.avatarURL()))
				.setTimestamp(new Date(msg.date))
				.setDescription('```' + msg.message + '```')
				.setFooter(Bot.channels.cache.has(msg.channel) ? `Отправлено в ${Bot.channels.cache.get(msg.channel).name}` : msg.channel)
				if (msg.deleted) embed.setTitle('Сообщение удалено.')
				if (msg.edits.length > 0) {
					for (let x = 0; x < 20; x++) {
						if (msg.edits[x]) embed.addField(`Изменение - #${x + 1}`, '```' + (msg.edits[x].length >= 1000 ? (msg.edits[x].slice(0, 1000) + '...') : msg.edits[x]) + '```')
					}
				}
				return message.channel.send(embed);
		}
	});
}