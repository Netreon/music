const Discord = require('discord.js');
const ayarlar = require("./config.js");

const client = new Discord.ShardingManager('./handlers.js', {
    totalShards: "auto",
    token: ayarlar.token
});

client.spawn(); 

client.on('launch', shard => {
  console.log(`${shard.id} IDli shard başarıyla başlatıldı.`)
});