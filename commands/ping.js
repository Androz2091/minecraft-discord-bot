module.exports = {
	name: 'ping',
	description: 'Return the bot\'s client and message ping',
	usage: 'ping',
	execute(client, message, args) {
		return message.channel.send(`Latency is ${Date.now() - message.createdTimestamp}ms. API Latency is ${Math.round(client.ws.ping)}ms`);
	},
};