const fetch = require('node-fetch');
require('dotenv').config();

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
  .then(text => text.split("\n").slice(2).join("\n").substring(11))
  .catch(err => console.error(err));
}

exports.create = createTranscript;
exports.isReady = transcriptReady;
exports.get = getTranscript;