const express = require('express');
const Discord = require('discord.js');
const path = require('path');
const PORT = process.env.PORT || 5000 // Heroku or local
var app = express();

require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('index'))
  .get('/index', (req, res) => res.render('index'))
  .use((req, res, next) => {
    // CORS headers
    res.append('Access-Control-Allow-Origin', ['*']);
    res.append('Access-Control-Allow-Methods', 'GET');
    res.append('Access-Control-Allow-Headers', 'Content-Type');
    next();
  })
  .get('/getMenuIfNeeded', function (req, res) {
    (async () => {
      const client = await pool.connect();

      // Selects most recent menu recording
      var lastDate;
      await client.query(`SELECT date, menu_recording FROM menus ORDER BY date DESC LIMIT 1;`)
        .then(result => lastDate = new Date(result.rows[0].date))
        .catch(err => console.error(err))
        .finally(() => client.end());

      // Doesn't insert the menu if it is a weekend or the same date as the last one;
      // TODO: Give some kind of indicator that it failed
      let currentDate = new Date();
      let day = currentDate.getDay();
      if (lastDate.getDate() == currentDate.getDate() || day == 0 || day == 6) return;

      // Makes the call to get a new menu if one is needed
      require('child_process').fork('make_call.js');
    })()

    res.write("You shouldn't be on this URL!");
    res.end();
  })
  .get('/addToDatabase', function (req, res) {
      // IDEA: Cron-job this for Monday-Friday at ~0900
      let RecordingUrl = req.query.RecordingUrl;
      if (!RecordingUrl) return res.render('error');

      (async () => {
        const client = await pool.connect();

        // https://stackabuse.com/using-postgresql-with-nodejs-and-node-postgres/
        await client.query(`INSERT INTO menus (menu_recording) VALUES ('${RecordingUrl}.wav');`)
          .then(result => console.log("Inserted row into menus!"))
          .catch(err => console.error(err))
          .finally(() => client.end());
      })()

      res.write("You shouldn't be on this URL!");
      res.end();
  })
  // TODO: Figure out when to call this one, keeping to proper conventions
  .get('/sendMenu', function (req, res) {
    let RecordingUrl = req.query.RecordingUrl;
    if (!RecordingUrl) return res.render('error');

    res.write("You shouldn't be on this URL!");
    res.end();
    
    const client = new Discord.Client();
    client.on('ready', () => {
      let testChannelId = "682369205735260185";
      let realChannelId = "559457192860712963";

      // Set message depending on the day of the week
      let date = new Date();
      let dayOfWeek = date.getDay();
      if (dayOfWeek >= 5) dayOfWeek = 0;
      const days = ['the weekend of Friday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
      const month = date.toLocaleString('default', { month: 'long' });
      const ordinalDate = getOrdinalDate(dayOfWeek == 0 ? getLastFriday() : date.getDate());

      // https://stackoverflow.com/a/45139862/6456163
      let message = `Here's the recording of the galley menu for ${days[dayOfWeek]}, ${month} ${ordinalDate}!`;
      client.channels.cache.get(testChannelId).send(message, { files: [ `${RecordingUrl}.wav` ] });
      console.log("The menu has been sent!");
    });

    client.login(process.env.BOT_TOKEN);
  })
  .get('*', (req, res) => res.render('error'))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

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