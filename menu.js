const Discord = require('discord.js');

// Selects most recent menu recording and its date
function getMenu(client) {
  const menu = async () => {
    var result;
    await client.query(`SELECT date, menu_recording FROM menus ORDER BY date DESC LIMIT 1;`)
      .then(res => result = res.rows[0])
      .catch(err => console.error(err))
      .finally(() => client.end());

    // Returns in format that allows for destructuring assignment
    return result ? [result.date, result.menu_recording] : [0,0];
  }

  return (async () => await menu() )();
}

// Sends the message recording in the specified Discord channel
// via the GalleyBot bot user
function sendMenu(recordingUrl, transcription) {
  const client = new Discord.Client();
  client.on('ready', async () => {
    let channelId = "559457192860712963";

    // Set message variables depending on the date
    let date = new Date();
    let dayOfWeek = date.getDay();
    if (dayOfWeek >= 5) dayOfWeek = 0;
    const days = ["the weekend of Friday", "Monday", "Tuesday", "Wednesday", "Thursday"];
    const month = date.toLocaleString("default", { month: "long" });
    const ordinalDate = getOrdinalDate(dayOfWeek == 0 ? getLastFriday() : date.getDate());

    // Create and format the final message and send it
    let message = `Here's the recording of the galley menu for ${days[dayOfWeek]}, ${month} ${ordinalDate}!`;
    let channel = client.channels.cache.get(channelId);
    await channel.send(message, {
      files: [{
        // IDEA: Attach the transcription file name here instead, w/ the date?
        attachment: recordingUrl,
        name: "menu_recording.wav"
      }]
    }).catch(console.error);

    message = `Here is the transcription, if you prefer to read: \n\n ${transcription}`;
    await channel.send(message);
    console.log("The menu has been sent!");

    // Reacts to own message
    await channel.messages.fetch({ limit: 1 }).then(async (messages) => {
      let lastMessage = messages.first();
      if (lastMessage.author.bot) {
        await lastMessage.react("🍔").catch(console.error);
        await lastMessage.react("🍕").catch(console.error);
        await lastMessage.react("🍟").catch(console.error);
      }
    }).catch(console.error);
  });

  client.login(process.env.BOT_TOKEN);
}

//https://stackoverflow.com/a/30323586/6456163
function getLastFriday() {
  let d = new Date(),
      day = d.getDay(),
      diff = (day <= 5) ? (7 - 5 + day) : (day - 5);

  // Operating under the assumption that this works; will continue to test
  if (diff == 7) diff = 0;
  d.setDate(d.getDate() - diff);
  return d.getDate();
}

// https://stackoverflow.com/a/44418732/6456163
function getOrdinalDate(n) {
  return n + (n > 0 ? ['th', 'st', 'nd', 'rd'][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10] : '');
}

exports.send = sendMenu;
exports.get = getMenu;