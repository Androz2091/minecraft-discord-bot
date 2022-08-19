const fs = require('fs');
const ms = require('ms');
const fetch = require('node-fetch');
const Discord = require('discord.js');
const client = new Discord.Client();
client.commands = new Discord.Collection();

const { prefix, token, updateInterval, ipAddress, port, playersChannel, statusChannel } = require('./config.json');

/**
 * List, collect, and return all commands in the commands folder
 */
let commandList = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    // set a new item in the Collection
    // with the key as the command name and the value as the exported module
    commandList.push({ 'name': command.name, 'description': command.description, 'usage': command?.usage });
    client.commands.set(command.name, command);
}

/**
 * This function is used to update statistics channel
 */
const updateChannel = async () => {
    // Fetch statistics from mcapi.us
    const res = await fetch(`https://mcapi.us/server/status?ip=${ipAddress}${port ? `&port=${port}` : ''}`)
    if (!res) {
        const statusChannelName = `【🛡】Status: Offline`
        client.channels.cache.get(statusChannel).setName(statusChannelName)
        return false
    }
    // Parse the mcapi.us response
    const body = await res.json()

    // Get the current player count, or set it to 0
    const players = body.players.now

    // Get the server status
    const status = (body.online ? "Online" : "Offline")

    // Generate channel names
    const playersChannelName = `【👥】Players: ${players}`
    const statusChannelName = `【🛡】Status: ${status}`

    // Update channel names
    client.channels.cache.get(playersChannel).setName(playersChannelName)
    client.channels.cache.get(statusChannel).setName(statusChannelName)

    return true
}

client.on('ready', () => {
    client.user.setActivity(`the server ${ipAddress}`, { type: 'WATCHING' });
    console.log(`Ready. Logged in as ${client.user.tag}.`);
    setInterval(() => {
        updateChannel();
    }, ms(updateInterval))
});

/**
 * Help command and command handler
 */
client.on('message', async message => {
    if (message.author.bot || message.channel.type === 'dm') return;

    if (message.content == `${prefix}help`) {
        const embed = new Discord.MessageEmbed()
            .setTitle(`${client.user.username} command list`)
            .setColor('3f04a4')
            .setThumbnail(client.user.avatarURL())
            .setDescription(`
**Server prefix:** \`${prefix}\`\n
${commandList.map(cmd => `**${cmd.name}**\n${cmd.description}\n\`${prefix}${cmd.usage}\``).join('\n\n')}
`)
            .setFooter(`[] is optional, <> is required • command count: ${commandList.length}`);
        return message.channel.send(embed);
    }

    if (message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (!client.commands.has(command)) return;

    try {
        client.commands.get(command).execute(client, message, args);
    } catch (error) {
        console.error(error);
        message.reply('There was an error trying to execute that command!');
    }
});

client.login(token);
