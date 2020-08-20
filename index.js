const express = require('express');
const Discord = require('discord.js');
const path = require('path');
const PORT = process.env.PORT || 5000 // Heroku or local
var app = express();

const { Client } = require('pg');
const client = new Client({
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
  .get('/addToDatabase', function (req, res) {
      // IDEA: Cron-job this for Monday-Friday at ~0900
      console.log("Req:", req.query);
      
      let RecordingUrl = req.query.RecordingUrl;
      if (!RecordingUrl) return res.render('error');
      console.log("Recording URL:", RecordingUrl);

      (async () => {
        // Upload to database
        client.connect();

        // TODO: Solve 'UnhandledPromiseRejectionWarning: Error: Client has already been connected. You cannot reuse a client'
        // TODO: Finish this and add pool support for the issue: 
          // https://kb.objectrocket.com/postgresql/how-to-use-nodejs-to-insert-into-a-postgresql-table-958

        // https://stackabuse.com/using-postgresql-with-nodejs-and-node-postgres/
        //const query = `INSERT INTO menus (menu) VALUES ('${text_param}');`
        client.query(`SELECT * FROM menus`)
          .then(result => {
            // Not inserting for now, testing first...
            console.log('Row inserted into table...');
            
            // Display URL and stop writing to page
            res.write(`Recording URL: ${RecordingUrl}`);
            res.end();
          })
          .catch(err => console.error(err))
          .finally(() => client.end());
      })()
  })
  .get('/sendmenu', function (req, res) {
    // https://discord.com/developers/applications/739580391232634910/information;
    // NOTE: For now I'm just going for a recording. If I can get that working,
    // I'll try for the transcription later
    let transcription = req.query.transcription;
    
    const client = new Discord.Client();
    client.on('ready', () => {
      console.log('ready to send the menu!');
    });

    client.on('message', message => {
      // TODO: Test and everything
      message.channel.send(content);
    });

    client.login(process.env.BOT_TOKEN);
  })
  .get('*', (req, res) => res.render('error'))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))