const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');//GMAIL api declaration
var express=require("express");
var app=express();
var Base64=require("js-base64");


// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly',
'https://www.googleapis.com/auth/gmail.send'
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Gmail API.
  authorize(JSON.parse(content),listLabels);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
let oAuth2Client;
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listLabels(auth) {
  const gmail = google.gmail({version: 'v1', auth});
  gmail.users.labels.list({
    userId: 'me',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
  });
}

async function sendEmail(auth, mail){
    const gmail=google.gmail({version:'v1', auth});
    var encodeMessage = Base64.encodeURI(mail);
    let email=await gmail.users.messages.send({
        userId:'me',
        resource:{
            raw: encodeMessage
        }
    })
    return email;
}
function makeMessage(from,to,subject,body){
  var mailParts=[
    `From:${from}`,
    `To:${to}`,
    `Subject:${subject}`,
    `\n${body}`
  ];
  var mail=mailParts.join('\n');
  return mail
}

app.get('/sendmail', async (req,res,next)=>{
  
  var mail=makeMessage("rajat456bansal@gmail.com","rajat456bansal@gmail.com","Hello", "Hello! How are you?");
  try{
    let email=await sendEmail(oAuth2Client,mail);
    res.json({email});
  }
  catch(error){
    console.log(error);
  }
})
app.listen(3000, ()=>{
  console.log("Server started");
})
