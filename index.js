const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');//google api library
var express=require("express");
var app=express();
var Base64=require("js-base64");

//STEPS TO USE THE APP
//first user has to create a file named as 'credentials.json' 
//as the credentials given by GMAIL will be stored here, these should not be shared with anyone
//as it contains client_id and client_Secret keys.

//After storing credentials when the app will run it will ask user to visit a link
//and after visiting the link user will be given a code and the code is to be pasted on the console
//then a file named 'token.json' will be created and whole authorization process will be completed

//Last Step contains sending emails, which can be sent using sendEmail function created below


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
//Main function for sending mail
async function sendEmail(auth, mail){
    const gmail=google.gmail({version:'v1', auth});
    //The whole body of email is converted to Base64 url encoding
    //thus this line is used for conversion of string to base64 url
    var encodeMessage = Base64.encodeURI(mail);
    //this is the function called through Gmail API to send the message
    let email=await gmail.users.messages.send({
        userId:'me',
        resource:{
            raw: encodeMessage
        }
    })
    return email;
}
//joining multi parts of an email into single one
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
//route for sending email
app.get('/sendmail', async (req,res,next)=>{
  //using this makeMessage function , we need to enter the four parameters from(the mail id from where the mail is sent), 
  //to(the mail id to which the mail is to be sent)
  //subject of the mail
  //main message of the mail
  // if we include front end part also then we can do this task through a form also 
  //by having a POST request
  var mail=makeMessage("rajat456bansal@gmail.com","rajat456bansal@gmail.com","Hello", "Hello! How are you?");
  try{
    let email=await sendEmail(oAuth2Client,mail);
    res.json({email});
  }
  catch(error){
    console.log(error);
  }
});
//app.listen is used to assgn a port on which the api will run
app.listen(3000, ()=>{
  console.log("Server started");
})
