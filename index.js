const express = require('express');
const fetch = require('node-fetch');
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
      let recordingUrl = req.query.RecordingUrl;
      if (!recordingUrl) return res.render('error');
      recordingUrl = `${recordingUrl}.wav`;
      res.send(null); // Prevent the timeout error from showing in logs

      const date = new Date();
      const month = date.toLocaleString("default", { month: "short" });
      const fileName = `${month}_${date.getDate()}_${date.getFullYear()}`;
      const transcript_id = await createTranscript(recordingUrl, fileName);
      console.log("Transcription ID:", transcript_id);

      await transcriptReady(transcript_id);
      console.log("Transcript ready!");

      const transcription = await getTranscript(transcript_id);
      console.log("Transcription:", transcription);

      const client = await pool.connect();
      await client.query(`INSERT INTO menus (menu_recording, transcription) VALUES ('${recordingUrl}', '${transcription}');`)
        .then(result => {
          // Only sends the menu each time a new menu is gotten
          console.log("Inserted row into menus!");
          menu.send(recordingUrl, transcription);
        })
        .catch(err => console.error(err))
        .finally(() => client.end());
      
      const https = require("https");
      https.get('https://galley-menu.herokuapp.com/getMenu', res => console.log("Pinging /getMenu!"));
  })
  .get('*', (req, res) => res.render('error'))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

async function createTranscript(recordingUrl, fileName) {
  const options = {
    file_url: recordingUrl,
    language: 'en',
    name: fileName,
    keywords: 'NAS, Pensacola, galley, menu'
  };

  return await fetch('https://api.sonix.ai/v1/media', {
    method: 'POST',
    body: JSON.stringify(options),
    headers: {
      'Authorization': `Bearer ${process.env.SONIX_API_KEY}`,
      'Content-Type': 'application/json'
    }
  })
  .then(res => res.json())
  .then(json => json.id);
}

// Loops continuously every 7.5 seconds until transcript is completed
async function transcriptReady(transcript_id) {
  let sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  await checkStatus();
  
  async function checkStatus() {
    let status;
    await fetch(`https://api.sonix.ai/v1/media/${transcript_id}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${process.env.SONIX_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    .then(res => res.json())
    .then(json => status = json.status);

    if (status !== "completed") {
      await sleep(7500);
      await checkStatus();
    }
  }
}

// Turns the audio file into a transcription
async function getTranscript(transcript_id) {
  return await fetch(`https://api.sonix.ai/v1/media/${transcript_id}/transcript`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${process.env.SONIX_API_KEY}` }
  })
  .then(res => res.text())
  // Format the transcription down to just the text
  .then(text => text.split("\n").slice(2).join("\n").substring(11));
}