const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000; // Heroku or local
const menu = require('./menu');
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
  .get('/getMenu', async (req, res) => {
      const client = await pool.connect();
      const [lastDate, menuRecording] = await menu.get(client);

      // Doesn't insert the menu if it is a weekend or the same date as the last one
      let currentDate = new Date();
      let day = currentDate.getDay();
      if (lastDate && lastDate.getDate() == currentDate.getDate() || day == 0 || day == 6) {
        console.log("The latest menu is available! Sending now...");
        return res.send(menuRecording);
      }

      // Makes the call to get a new menu if one is needed
      require('child_process').fork('make_call.js');
      console.log("Making call to get latest menu...");

      // Lets the requester know that no audio is available yet
      res.send(null);
  })
  .get('/addToDatabase', async (req, res) => {
      let RecordingUrl = req.query.RecordingUrl;
      if (!RecordingUrl) return res.render('error');

      const client = await pool.connect();
      await client.query(`INSERT INTO menus (menu_recording) VALUES ('${RecordingUrl}.wav');`)
        .then(result => {
          // Only sends the menu each time a new menu is gotten
          console.log("Inserted row into menus!");
          menu.send(menuRecording);
        })
        .catch(err => console.error(err))
        .finally(() => client.end());
      
      const https = require("https");
      https.get('https://galley-menu.herokuapp.com/getMenu', res => console.log("Pinging /getMenu!"));
      res.send(null);
  })
  .get('*', (req, res) => res.render('error'))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));