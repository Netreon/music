const { SlashCommandBuilder, Events, ButtonBuilder, ButtonStyle, EmbedBuilder, Colors, PermissionFlagsBits, ActionRowBuilder } = require("discord.js")

module.exports = {
	data: new SlashCommandBuilder()
		.setName('müzik')
		.setDescription('Exp Müzik')
        .addSubcommand(subcommand => 
            subcommand.setName("oynat")
            .setDescription("Müzik Oynatırsınız")
            .addStringOption(option => 
                option.setName("müzik")
                    .setDescription("Müzik Belirtiniz")
                    .setRequired(true))
        )
        .addSubcommand(subcommand => 
            subcommand.setName("ses")
            .setDescription("Müzik Ses Ayarlarını Yönetirsiniz")
            .addIntegerOption(option => 
                option.setName("düzey")
                    .setDescription("1den 100e kadar sesi belirtiniz")
                    .setMinValue(1)
                    .setMaxValue(100)
                    .setRequired(true))
        )
        .addSubcommand(subcommand => 
            subcommand.setName("ayarlar")
            .setDescription("Müzik Ayarları")
            .addStringOption(option => 
                option.setName("ayarlar")
                    .setDescription("Müzik Ayarları")
                    .setRequired(true)
                    .addChoices(
                        {name: "sıra", value: "sıra"},
                        {name: "geç", value: "geç"},
                        {name: "durdur", value: "durdur"},
                        {name: "devam", value: "devam"},
                        {name: "bitir", value: "bitir"},
                        {name: "tekrarla", value: "tekrarla"},
                    ))
        ),
	async execute(client, interaction) {
        const { options, member, guild, channel } = interaction

        const subcommand = options.getSubcommand()
        const music = options.getString("müzik")
        const volume = options.getInteger("düzey")
        const option = options.getString("ayarlar")
        const voiceChannel = member.voice.channel

        const embed = new EmbedBuilder()

        if (!voiceChannel) {
            embed.setTitle("Hata")
            embed.setDescription("Lütfen bir ses kanalına katılınız.")
            embed.setThumbnail(interaction.guild.iconURL())
            embed.setColor(Colors.Red)
            return interaction.reply({ embeds: [embed] }).catch(() => {return})
        }

        if (!member.voice.channelId == guild.members.me.voice.channelId) {
            embed.setTitle("Hata")
            embed.setDescription(`Müzik zaten <#${guild.members.me.voice.channelId}> kanalında çalıyor!`)
            embed.setThumbnail(interaction.guild.iconURL())
            embed.setColor(Colors.Red)
            return interaction.reply({ embeds: [embed] }).catch(() => {return})
        }


        try {
            switch (subcommand) {
                case "oynat":
                    embed.setTitle("Lütfen Bekleyiniz")
                    embed.setDescription(`Müzik oynatma isteğiniz alındı. Bu işlem biraz zaman alabilir.`)
                    embed.setThumbnail(interaction.guild.iconURL())
                    embed.setColor(Colors.Blue)
                    return interaction.reply({ embeds: [embed] }).then(async (thenmsg) => {
                        await client.DisTube.play(voiceChannel, music, { textChannel: channel, member: member }).catch(() => {return})
                        const queue2 = await client.DisTube.getQueue(voiceChannel);
                        embed.setTitle("Müzik Oynatılıyor")
                        embed.setDescription(`İstediğiniz müzik sıraya eklendi! Şu anki oynatılan müzik: ` + "`" + queue2.songs[0].name + "` - `" + queue2.songs[0].formattedDuration + "`" + `\n \n <:ex1:1138809682845257851><:ex2:1138809688947965982>`)
                        embed.setThumbnail(interaction.guild.iconURL())
                        embed.setColor(Colors.Green)

                        const skip = new ButtonBuilder()
                            .setCustomId('musicskip')
                            .setLabel('Geç')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji("▶")

                        const bitir = new ButtonBuilder()
                            .setCustomId('musicbitir')
                            .setLabel('Müziği Sonlandır')
                            .setStyle(ButtonStyle.Danger)
                            .setEmoji("⛔")

                        const ses50 = new ButtonBuilder()
                            .setCustomId('ses50')
                            .setLabel('%50')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji("🔉")

                        const ses100 = new ButtonBuilder()
                            .setCustomId('ses100')
                            .setLabel('%100')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji("🔉")

                        const list = new ButtonBuilder()
                            .setCustomId('musicliste')
                            .setLabel('Müzik Listesi')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji("📜")

                        const row = new ActionRowBuilder()
                            .addComponents(skip, bitir, ses50, ses100, list);

                        thenmsg.edit({ embeds: [embed], components: [row] }).catch(() => {return})

                        client.on(Events.InteractionCreate, async (interaction2) => {
                            try {
                                if (!interaction2.isButton()) return;
                                if (interaction2.customId === 'musicskip') {
                                    if (interaction2.user.id != interaction.user.id) return;
                                    const newqueue = await client.DisTube.getQueue(voiceChannel);
                                    if (newqueue.songs[0].name != queue2.songs[0].name) return
                                    try {
                                        await newqueue.skip(voiceChannel);
                                        embed.setTitle("Müzik Geçildi")
                                        embed.setDescription("`" + newqueue.songs[0].name + "` müziği başarıyla geçildi.")
                                        embed.setThumbnail(interaction.guild.iconURL())
                                        embed.setColor(Colors.Green)
                                        interaction2.reply({ embeds: [embed], ephemeral: true }).catch(() => {return})
                                        interaction2.message.edit({ embeds: [embed], components: [] }).catch(() => {return})
                                    } catch {
                                        return
                                    }
                                }
                                if (interaction2.customId === 'musicbitir') {
                                    if (interaction2.user.id != interaction.user.id) return;
                                    const newqueue = await client.DisTube.getQueue(voiceChannel);
                                    if (newqueue.songs.length > 1) return
                                    try {
                                        const currentsong = await newqueue.songs[0].name
                                        await newqueue.stop(voiceChannel);
                                        embed.setTitle("Müzik Bitirildi")
                                        embed.setDescription("`" + currentsong + "` müziği başarıyla bitirildi.")
                                        embed.setThumbnail(interaction.guild.iconURL())
                                        embed.setColor(Colors.Green)
                                        interaction2.reply({ embeds: [embed], ephemeral: true }).catch(() => {return})
                                        interaction2.message.edit({ embeds: [embed], components: [] }).catch(() => {return})
                                    } catch {
                                        return
                                    }
                                }
                                if (interaction2.customId === 'ses50') {
                                    if (interaction2.user.id != interaction.user.id || interaction2.user.id != 1102599312980054016) return;
                                    try {
                                        await client.DisTube.setVolume(voiceChannel, 50)
                                        embed.setTitle("Ses Düzeyi Değiştirildi")
                                        embed.setDescription(`Müzik ses değişimi isteğiniz onaylandı. Müzik ses düzeyi %50 olarak değiştirildi.`)
                                        embed.setThumbnail(interaction.guild.iconURL())
                                        embed.setColor(Colors.Green)
                                        return interaction2.reply({ embeds: [embed], ephemeral: true }).catch((er) => {return console.log(er)})
                                    } catch {
                                        return
                                    }
                                }
                                if (interaction2.customId === 'ses100') {
                                    if (interaction2.user.id != interaction.user.id || interaction2.user.id != 1102599312980054016) return;
                                    try {
                                        await client.DisTube.setVolume(voiceChannel, 100)
                                        embed.setTitle("Ses Düzeyi Değiştirildi")
                                        embed.setDescription(`Müzik ses değişimi isteğiniz onaylandı. Müzik ses düzeyi %100 olarak değiştirildi.`)
                                        embed.setThumbnail(interaction.guild.iconURL())
                                        embed.setColor(Colors.Green)
                                        return interaction2.reply({ embeds: [embed], ephemeral: true }).catch(() => {return})
                                    } catch {
                                        return
                                    }
                                }
                                if (interaction2.customId === 'musicliste') {
                                    try {
                                        const newqueue = await client.DisTube.getQueue(voiceChannel);
                                        embed.setTitle("Müzik Sırası")
                                        embed.setDescription(`${newqueue.songs.map(
                                            (song, id) => `\n**${id + 1}.** ${song.name} - \`${song.formattedDuration}\``
                                        )}`)
                                        embed.setThumbnail(interaction.guild.iconURL())
                                        embed.setColor(Colors.Blue)
                                        return interaction2.reply({ embeds: [embed], ephemeral: true }).catch(() => {return})
                                    } catch {
                                        return
                                    }
                                }
                            } catch {return}
                        });

                    }).catch(() => {return})
                case "ses":
                    if (!member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                        embed.setTitle("Hata")
                        embed.setDescription(`Gerekli yetkiye sahip değilsin.`)
                        embed.setThumbnail(interaction.guild.iconURL())
                        embed.setColor(Colors.Red)
                        return interaction.reply({ embeds: [embed] }).catch(() => {return})
                    }
                    await client.DisTube.setVolume(voiceChannel, volume)
                    embed.setTitle("Ses Düzeyi Değiştirildi")
                    embed.setDescription(`Müzik ses değişimi isteğiniz onaylandı. Müzik ses düzeyi %${volume} olarak değiştirildi.`)
                    embed.setThumbnail(interaction.guild.iconURL())
                    embed.setColor(Colors.Green)
                    return interaction.reply({ embeds: [embed] }).catch(() => {return})
                case "ayarlar":
                    if (!member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                        embed.setTitle("Hata")
                        embed.setDescription(`Gerekli yetkiye sahip değilsin.`)
                        embed.setThumbnail(interaction.guild.iconURL())
                        embed.setColor(Colors.Red)
                        return interaction.reply({ embeds: [embed] }).catch(() => {return})
                    }

                    const queue = await client.DisTube.getQueue(voiceChannel);

                    if (!queue) {
                        embed.setTitle("Hata")
                        embed.setDescription(`Aktif müzik bulunamadı.`)
                        embed.setThumbnail(interaction.guild.iconURL())
                        embed.setColor(Colors.Red)
                        return interaction.reply({ embeds: [embed] }).catch(() => {return})
                    }

                    switch (option) {
                        case "geç":
                            await queue.skip(voiceChannel);
                            embed.setTitle("Müzik Geçildi")
                            embed.setDescription(`Başarıyla oynatma listesindeki diğer bir müziğe geçiş yaptınız.`)
                            embed.setThumbnail(interaction.guild.iconURL())
                            embed.setColor(Colors.Green)
                            return interaction.reply({ embeds: [embed] }).catch(() => {return})
                        case "bitir":
                            await queue.stop(voiceChannel);
                            embed.setTitle("Liste Sıfırlandı")
                            embed.setDescription(`Tüm müzikler bitirildi.`)
                            embed.setThumbnail(interaction.guild.iconURL())
                            embed.setColor(Colors.Green)
                            return interaction.reply({ embeds: [embed] }).catch(() => {return})
                        case "tekrarla":
                            const loopmode = await client.DisTube.setRepeatMode(interaction)
                            if (loopmode == 0) {
                                embed.setTitle("Tekrarlama Ayarı Değiştirildi")
                                embed.setDescription(`Tekrarlama modu ` + "`Kapalı` olarak değiştirildi.")
                                embed.setThumbnail(interaction.guild.iconURL())
                                embed.setColor(Colors.Green)
                                return interaction.reply({ embeds: [embed] }).catch(() => {return})
                            }
                            if (loopmode == 1) {
                                embed.setTitle("Tekrarlama Ayarı Değiştirildi")
                                embed.setDescription(`Tekrarlama modu ` + "`Müzik` olarak değiştirildi.")
                                embed.setThumbnail(interaction.guild.iconURL())
                                embed.setColor(Colors.Green)
                                return interaction.reply({ embeds: [embed] }).catch(() => {return})
                            }
                            if (loopmode == 2) {
                                embed.setTitle("Tekrarlama Ayarı Değiştirildi")
                                embed.setDescription(`Tekrarlama modu ` + "`Sıra` olarak değiştirildi.")
                                embed.setThumbnail(interaction.guild.iconURL())
                                embed.setColor(Colors.Green)
                                return interaction.reply({ embeds: [embed] }).catch(() => {return})
                            }
                        case "durdur":
                            await queue.pause(voiceChannel);
                            embed.setTitle("Müzik Durduruldu")
                            embed.setDescription(`Başarıyla oynatma listesindeki aktif müziği durdurdunuz.`)
                            embed.setThumbnail(interaction.guild.iconURL())
                            embed.setColor(Colors.Green)
                            return interaction.reply({ embeds: [embed] }).catch(() => {return})
                        case "devam":
                            await queue.resume(voiceChannel);
                            embed.setTitle("Müzik Devam Ediyor")
                            embed.setDescription(`Başarıyla oynatma listesindeki durdurulmuş müziği aktifleştirdiniz.`)
                            embed.setThumbnail(interaction.guild.iconURL())
                            embed.setColor(Colors.Green)
                            return interaction.reply({ embeds: [embed] }).catch(() => {return})
                        case "sıra":
                            embed.setTitle("Müzik Sırası")
                            embed.setDescription(`${queue.songs.map(
                                (song, id) => `\n**${id + 1}.** ${song.name} - \`${song.formattedDuration}\``
                            )}`)
                            embed.setThumbnail(interaction.guild.iconURL())
                            embed.setColor(Colors.Blue)
                            return interaction.reply({ embeds: [embed] }).catch(() => {return})
                    }
            }
        } catch(error) {
            embed.setTitle("Bir Sorun Oluştu")
            embed.setDescription(`Lütfen daha sonra tekrar dene.`)
            embed.setThumbnail(interaction.guild.iconURL())
            embed.setColor(Colors.Red)
            return interaction.reply({ embeds: [embed] }).catch(() => {return})
        }
	},
};