const ms = require('ms')
const fetch = require('node-fetch')
const Discord = require('discord.js')
const client = new Discord.Client()

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
    const players = (body.players ? body.players.now : 0)

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

client.on('message', async (message) => {

    if(message.content === `${config.prefix}force-update`){
        if (!message.member.hasPermission('MANAGE_MESSAGES')) {
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

        const embed = new Discord.MessageEmbed()
            .setAuthor("IP address", body.connect)
            .addField("Version", body.raw.version.name || body.raw.server_engine)
            .addField("Connected", `${(body.raw.players ? body.raw.players.online : body.players.length)} players`)
            .addField("Maximum", `${(body.raw.players ? body.raw.players.max : body.maxplayers)} players`)
            .addField("Status", (body.online ? "Online" : "Offline"))
            .setColor("#FF0000")
            .setFooter("Open Source Minecraft Discord Bot")
        
        sentMessage.edit(null, { embed })
    }

})

client.login(config.token)
