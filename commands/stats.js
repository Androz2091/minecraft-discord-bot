const Discord = require('discord.js');
const fetch = require('node-fetch');
const { ipAddress, port, defaultLogo } = require('../config.json');

module.exports = {
    name: 'stats',
    description: 'Returns the server statistics',
    usage: 'stats',
    execute: async (client, message, args) => {
        const sentMessage = await message.channel.send("Fetching statistics, please wait...");

        // Fetch statistics from mcapi.us
        const res = await fetch(`https://mcapi.us/server/status?ip=${ipAddress}${port ? `&port=${port}` : ''}`);
        if (!res) return message.channel.send("Looks like your server is not reachable... Please verify it's online and it isn't blocking access!");
        // Parse the mcapi.us response
        const body = await res.json();

        //https://cdn.spin.rip/content/2022/02/02/1643794001828-mc-block.png
        const attachment = new Discord.MessageAttachment(Buffer.from(!body.favicon ? defaultLogo.substr('data:image/png;base64,'.length) : body.favicon.substr('data:image/png;base64,'.length), 'base64'), "icon.png");

        const embed = new Discord.MessageEmbed()
            .setAuthor(ipAddress)
            .attachFiles(attachment)
            .setImage("attachment://icon.png")
            .addField("Version", body.server.name)
            .addField("Connected", `${body.players.now} players`)
            .addField("Maximum", `${body.players.max} players`)
            .addField("Status", (body.online ? "Online" : "Offline"))
            .setColor("#ff008f")
            .setFooter("Open Source Minecraft Server Status Bot");

        sentMessage.edit(`:chart_with_upwards_trend: Here are the stats for **${ipAddress}**:`, { embed })
    },
};