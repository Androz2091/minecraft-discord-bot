const fetch = require('node-fetch');
const { ipAddress, port, statusChannel, playersChannel } = require('../config.json');

module.exports = {
    name: 'force-update',
    description: 'Force update the stats and channels (moderators only)',
    usage: 'force-update',
    execute: async (client, message, args) => {
        if (!message.member.hasPermission('MANAGE_MESSAGES')) {
            return message.channel.send('Only server moderators can run this command!');
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

        const sentMessage = await message.channel.send("Updating the channels, please wait...");
        await updateChannel();
        sentMessage.edit("Channels were updated successfully!");
    },
};
