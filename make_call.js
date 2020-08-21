const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

client
  .calls
  .create({
      record: true,
      // TODO: Move to 75 or similar after tested to make sure it's working
      // https://www.twilio.com/docs/voice/twiml/pause
      twiml: '<Response><Pause length="5"/><Say>Bye</Say><Hangup/></Response>',
      recordingStatusCallbackMethod: 'GET',
      recordingStatusCallback: 'https://galley-menu.herokuapp.com/addToDatabase',
      from: '+14193183668',
      to: '+18507188243' //'+18504527059'
    })
  .then(call => {
    console.log("Completed call with SID", call.sid);
  });