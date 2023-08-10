const Discord = require("discord.js")
const client = new Discord.Client({ intents: [Object.values(Discord.GatewayIntentBits)], partials: [Object.values(Discord.Partials)] })
const log = require("terminal.xr")
const logger = new log()
const { REST } = require("@discordjs/rest");
const fs = require("fs");
const path = require("path");
const config = require("./config.js")

const { DisTube } = require("distube")
const { SoundCloudPlugin } = require('@distube/soundcloud');
const { SpotifyPlugin } = require("@distube/spotify")
const { DeezerPlugin } = require("@distube/deezer")

client.DisTube = new DisTube(client, {
    leaveOnEmpty: true,
    leaveOnFinish: true,
    leaveOnStop: true,
    searchSongs: 5,
    searchCooldown: 30,
    plugins: [new SpotifyPlugin(), new SoundCloudPlugin(), new DeezerPlugin()]
})
    
client.commands = new Discord.Collection();
const slashCommands = [];

client.on(Discord.Events.GuildCreate, async (guild) => {
    logger.info(`[LOG] ${client.user.tag} botu ${guild.name} (${guild.id}) sunucusuna eklendi.`);

    const rest = new REST({ version: '9' }).setToken(config.token);

    try {
        await rest.put(Discord.Routes.applicationGuildCommands(config.id, guild.id), { body: slashCommands });
        logger.success(`[BAŞARILI] ` + `${guild.name} (${guild.id}) sunucusunda tüm slash komutları yüklendi.`);
    } catch (error) {
        logger.error(`[HATA] ` + `${client.user.tag} botunun ${guild.name} (${guild.id}) sunucusunda komutları yüklenemedi.`);
    }
});

client.on(Discord.Events.ClientReady, async () => {
    const rest = new REST({ version: '9' }).setToken(config.token);
    try {
        const guilds = await client.guilds.fetch();
        const guildIDs = guilds.map(guild => guild.id);	

        for (const guildID of guildIDs) {
            await rest.put(Discord.Routes.applicationGuildCommands(config.id, guildID), { body: slashCommands });
            logger.success(`[BAŞARILI] Komutlar yüklendi - Sunucu ID: ${guildID}`);
        }

        logger.success(`[BAŞARILI] Toplam ${guildIDs.length} sunucuda komutlar yüklendi.`);
    } catch (error) {
        logger.error('[HATA] Komut yüklenirken bir hata oluştu: ' + error.message);
	}
});

const commandsPath = path.join(__dirname, 'commands'); // Buraya komutlar klasörünün adını giriniz, bu kodda varsayılan olarak commands olarak belirttim.
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);

	client.commands.set(command.data.name, command);
    slashCommands.push(command.data.toJSON());

    logger.success(`[BAŞARILI] ${command.data.name} dosyası hazırlandı.`)
}

client.on(Discord.Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        logger.error(`[HATA] Komut ${interaction.commandName} bulunamadı.`);
        return;
    }

    try {
        await command.execute(client, interaction);
    } catch (error) {
        return logger.error("[HATA] Bir hata oluştu: " + error.message);
    }
});

client.login(config.token)

require("./index.js")
