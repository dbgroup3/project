/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

//ERIN
var oracledb = require('oracledb');
var http = require('http');

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var client_id = 'f432f794252040bc94add8bc8576b0c0'; // Your client id
var client_secret = 'c82121c0b79544d7a32b8579aeee91de'; // Your secret
var redirect_uri = 'http://35.172.254.68:8888/callback'; // Your redirect uri


var engines = require('consolidate'); //Erin
var connection;

//ERIN
// TODO:: Turn into function called when user firsts logs in
/**
 * Creates connection to oracledb
 * @param {string} SQL statement to be executed
 * @param {function} cb Callback function
 **/
var doConnect = function(statement, cb) {
  oracledb.getConnection({
      user: "guest",
      password: "guest",
      connectString: "localhost/XE"
    }, function(err, connection) {
    cb(statement, connection)
    } //aalways release connection at end
  );
};
/**
 * Releases existing DB connection
 * @param {Object} connection oracledb connection object
 **/
var doRelease = function(connection) {
  connection.close(
    function(err) {
      if (err)
        console.error(err.message);
    });
};
/** Executes statement on connection
 *
 * @param {string} statement SQL command to be executed
 * @param {Object} connection Oracledb connection object
 **/
var doExecute = function(statement, connection) {
  connection.execute(
    statement,
    function(err, result) {
      if (err) {
        console.error(err.message);
      } else {
      connection.commit(
        function(err) {
          if (err) {
            console.error(err.message);
          } else {
            console.log("Execution successful for " + result.rowsAffected + " rows.");
          }
        });
      }
      doRelease(connection);
    }
    );

};

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';
var app = express();

app.use(express.static(__dirname + '/public'))
  .use(cookieParser());

/**
* User Login Page
* @param {string} endpoint access point
* @param {function} doLogin callback function for login page
**/
app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
    console.log("Login request");
    doConnect(`INSERT INTO users
		 VALUES('0', 'Testing')`, doExecute);

});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
          refresh_token = body.refresh_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: {
            'Authorization': 'Bearer ' + access_token
          },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body.uri);
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
    },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

//Should this go here???
app.set('views', __dirname + '/public');
app.engine('html', engines.mustache);
app.set('view engine', 'html');

//Doesn't display the Hey and Hello there - how does it work with an html file and this route?
app.get('/about', function(req, res) {
  res.render('about', {
    title: 'Hey',
    message: 'Hello there!'
  });
});

console.log('Listening on 8888');
app.listen(8888);
