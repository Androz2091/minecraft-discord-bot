const ms = require('ms')
const fetch = require('node-fetch')
const Discord = require('discord.js')
const client = new Discord.Client({
    intents: [
        Discord.IntentsBitField.Flags.Guilds,
        Discord.IntentsBitField.Flags.GuildMessages,
        Discord.IntentsBitField.Flags.MessageContent
    ]
});

const config = require('./config.json')

/**
 * This function is used to update statistics channel
 */
const updateChannel = async () => {

    // Fetch statistics from mcapi.us
    const res = await fetch(`https://mcapi.us/server/status?ip=${config.ipAddress}${config.port ? `&port=${config.port}` : ''}`)
    if (!res) {
        const statusChannelName = `【🛡】Status: Offline`
        client.channels.cache.get(config.statusChannel).setName(statusChannelName)
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
    client.channels.cache.get(config.playersChannel).setName(playersChannelName)
    client.channels.cache.get(config.statusChannel).setName(statusChannelName)

    return true
}

client.on('ready', () => {
    console.log(`Ready. Logged as ${client.user.tag}.`)
    setInterval(() => {
        updateChannel()
    }, ms(config.updateInterval))
})

client.on('messageCreate', async (message) => {

    console.log(message.content)

    if(message.content === `${config.prefix}force-update`){
        if (!message.member.permissions.has(Discord.PermissionsBitField.Flags.ManageMessages)) {
            return message.channel.send('Only server moderators can run this command!')
        }
        const sentMessage = await message.channel.send("Updating the channels, please wait...")
        await updateChannel()
        sentMessage.edit("Channels were updated successfully!")
    }

    if(message.content === `${config.prefix}stats`){
        const sentMessage = await message.channel.send("Fetching statistics, please wait...")

        // Fetch statistics from mcapi.us
        const res = await fetch(`https://mcapi.us/server/status?ip=${config.ipAddress}${config.port ? `&port=${config.port}` : ''}`)
        if (!res) return message.channel.send(`Looks like your server is not reachable... Please verify it's online and it isn't blocking access!`)
        // Parse the mcapi.us response
        const body = await res.json()

        const attachment = new Discord.AttachmentBuilder(Buffer.from(body.favicon.substr('data:image/png;base64,'.length), 'base64'), {
            name: "icon.png",
            description: "Server Icon"
        });

        const embed = new Discord.EmbedBuilder()
            .setAuthor({
                name: config.ipAddress
            })
            .setThumbnail("attachment://icon.png")
            .addFields([
                { name: "Version", value: body.server.name },
                { name: "Connected", value: `${body.players.now} players` },
                { name: "Maximum", value: `${body.players.max} players` },
                { name: "Status", value: (body.online ? "Online" : "Offline") }
            ])
            .setColor("#FF0000")
            .setFooter({
                text: "Open Source Minecraft Discord Bot"
            })
        
        sentMessage.edit({
            embeds: [embed],
            content: `:chart_with_upwards_trend: Here are the stats for **${config.ipAddress}**:`,
            files: [attachment]
        })
    }

})

client.login(config.token)
