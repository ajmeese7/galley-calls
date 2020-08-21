const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

client
  .calls
  .create({
      record: true,
      // https://www.twilio.com/docs/voice/twiml/pause
      twiml: '<Response><Pause length="45"/><Say>Bye</Say><Hangup/></Response>',
      recordingStatusCallbackMethod: 'GET',
      recordingStatusCallback: 'https://galley-menu.herokuapp.com/addToDatabase',
      from: '+14193183668',
      to: '+18504527059'
    })
  .then(call => {
    console.log("Completed call with SID", call.sid);
  });