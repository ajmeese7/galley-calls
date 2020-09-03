const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000; // Heroku or local
const menu = require('./menu');
const transcript = require('./transcript');
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
      let client = await pool.connect();
      const [lastDate, menuRecording] = await menu.get(client);
      if (menuRecording == "IN PROGRESS")
        // Prevents the same menu from being requested multiple times at once
        return console.log("Call already in progress...");

      // Doesn't insert the menu if it is a weekend or the same date as the last one;
      // TODO: Make sure it's past 0700 or something before getting new menu
      const currentDate = new Date();
      const day = currentDate.getDay();
      if (lastDate && lastDate.getDate() == currentDate.getDate() || day == 0 || day == 6) {
        console.log("The latest menu is available! Sending now...");
        return res.send(menuRecording);
      }

      // Makes the call to get a new menu if one is needed
      client = await pool.connect();
      await menu.setRecordingStatus(client);
      require('child_process').fork('make_call.js');
      console.log("Making call to get latest menu...");

      // Lets the requester know that no audio is available yet
      res.send(null);
  })
  .get('/addToDatabase', async (req, res) => {
      let recordingUrl = req.query.RecordingUrl;
      if (!recordingUrl) return res.render('error');
      recordingUrl = `${recordingUrl}.wav`;
      res.send(null); // Prevents timeout error from showing in logs

      const date = new Date();
      const month = date.toLocaleString("default", { month: "short" });
      const fileName = `${month}_${date.getDate()}_${date.getFullYear()}`;
      const transcript_id = await transcript.create(recordingUrl, fileName);
      console.log("Transcription ID:", transcript_id);

      await transcript.isReady(transcript_id);
      console.log("Transcript ready!");

      const transcription = await transcript.get(transcript_id);
      console.log("Transcription:", transcription);

      // https://stackoverflow.com/a/36739415/6456163
      const client = await pool.connect();
      await client.query(`UPDATE menus SET menu_recording=?, transcription=? 
        WHERE id=(SELECT MAX(id) FROM menus);`, [recordingUrl, transcription])
        .then(result => {
          // Only sends the menu each time a new menu is gotten
          console.log("Updated menu with real data!");
          menu.send(recordingUrl, transcription);
        })
        .catch(err => console.error(err))
        .finally(() => client.end());
      
      const https = require("https");
      https.get("https://galley-menu.herokuapp.com/getMenu", res => console.log("Pinging /getMenu!"));
  })
  .get('*', (req, res) => res.render('error'))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));