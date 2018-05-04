//ERIN
var oracledb = require('oracledb');
var http = require('http');
var path = require('path');
var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var bodyParser = require('body-parser');


var client_id = 'f432f794252040bc94add8bc8576b0c0'; // Your client id
var client_secret = 'c82121c0b79544d7a32b8579aeee91de'; // Your secret
var redirect_uri = 'http://35.172.254.68:8888/callback'; // Your redirect uri


var connection;
var USER_ID;
var ACCESS;
var pl_id;
var pl_ct;
var other_id;

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// TODO:: Turn into function called when user firsts logs in
/**
 * Creates connection to oracledb
 * @param {string} SQL statement to be executed
 * @param {function} cb Callback function
 **/
var doConnect = function(statement, cb) {
//  console.log("doConnect");
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
	//sleep(1000);
};

/** Executes statement on connection
 *
 * @param {string} statement SQL command to be executed
 * @param {Object} connection Oracledb connection object
 **/
//var doInsert = function(statement, connection) {
var doInsert = function(statement) {
	oracledb.getConnection(
		{user: "guest",
		password: "guest",
		connectString: "localhost/XE"},
		function(err, connection) {
			if (err) {
				console.error(err.message);
				return;
			}
  connection.execute(statement, function(err, result) {
      if (err) {
        console.error(err.message);
      }
      else {
	  		connection.commit(function(err) {
		  		if (err) {
		      	console.error(err.message);
		  		}
		  		else {
		      	console.log("Execution successful for " + result.rowsAffected + " rows.");
		      	//console.log(result.rows);
		  		}
         });
      }
      doRelease(connection);
  });
	});
};

/* Executes query on connection
 * Specifically used for select statements?
 *
 * */
var doFetch = function(statement, callback) {
	oracledb.getConnection(
		{user: "guest",
      password: "guest",
      connectString: "localhost/XE"},
	   function(err, connection) {
			if (err) {
				console.error(err.message);
				return;
			}
		   connection.execute(statement, function(err, result) {
			if (err) {
				callback(err, null);
				//console.error(err.message);
			}
			else {
				if (result.rows[0] == undefined) {
					callback(null, null);
				}
				else {
					callback(null, result.rows[0][0]);
					//console.log(result.rows[0][0]);
				}
			}
			doRelease(connection);
		});
	});
};

var doFetchMult = function(statement, callback) {
	oracledb.getConnection(
		{user: "guest",
      password: "guest",
      connectString: "localhost/XE"},
	   function(err, connection) {
			if (err) {
				console.error(err.message);
				return;
			}
		   connection.execute(statement, function(err, result) {
			if (err) {
				callback(err, null);
				//console.error(err.message);
			}
			else {
				if (result.rows[0] == undefined) {
					callback(null, null);
				}
				else {
					callback(null, result.rows);
					//console.log(result.rows);
				}
			}
			doRelease(connection);
		});
	});
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
  var scope = 'user-read-private user-read-email user-top-read';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
	 console.log();
    console.log("Login request");
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
		  ACCESS = access_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: {
            'Authorization': 'Bearer ' + access_token
          },
          json: true
        };

          // use the access token to access the Spotify Web API
 	  request.get(options, function(error, response, body) {
	      //Check if user is already in table
	      let cmd = `SELECT USER_ID FROM USERS WHERE SPOTIFY_NAME = \'` + body.id + `\'`;
	      console.log(cmd);
	       
	      doFetch(cmd, function(err, content) {
		  if (err) {
		      console.error(err.message);
		  }
		  else {
		      if (content == null) {
			  let cmd = `INSERT INTO users VALUES (0,\'` + client_id + `\', \'` + body.id + `\')`;
			  console.log(cmd);
			  //doConnect(cmd, doInsert);
			  doInsert(cmd);
		      }
		      else {
			  console.log("USER EXISTS! USER_ID = " + content);
			  USER_ID = content; //where we set USER_ID
		      }
		  }
	      });
	  });

			//sleep(5000);

          var options = {
          url: 'https://api.spotify.com/v1/me/top/artists',
              headers: {
		  'Authorization': 'Bearer ' + access_token
              },
              json: true
          };

	  //inserting top artists into DB
	  console.log("refreshing user's top artists");
	  request.get(options, function(error, response, body) {
	      for (x in body['items']){
		  let artist_name = body['items'][x]['name'];
		  artist_name = artist_name.replace("'", "''");
		  let popularity = body['items'][x]['popularity'];
		  let artist_id = body['items'][x]['id'];
		  let genre = 'test';
		  let cmd = `SELECT ARTIST_NAME FROM ARTISTS WHERE ARTIST_ID = \'` + artist_id + `\'`;

		  doFetch(cmd, function(err, content) {
		      if (err) {
			  console.error(err.message);
		      }
		      else {
			  if (content == null) {
			      let artist_cmd = `INSERT INTO artists VALUES (\'` + artist_id + `\', \'` + artist_name + `\', \'` + genre + `\')`;
			      let user_cmd = `INSERT INTO user_artists VALUES (\'` + USER_ID + `\', \'` + artist_id  + `\', \'` + popularity  + `\')`;
			      //doConnect(artist_cmd, doInsert);
			      doInsert(artist_cmd);
			      console.log(artist_cmd);
			      //doConnect(user_cmd, doInsert);
			      doInsert(user_cmd);
			      console.log(user_cmd);
			  }
			  else {
			      //console.log("Artist exists!");
			  }
		      }
	    	  });
	      }
	  });

	  var options = {
              url: 'https://api.spotify.com/v1/me/top/tracks',
              headers: {
		  'Authorization': 'Bearer ' + access_token
              },
              json: true
          };

	  //inserting user's top tracks into DB
	  console.log("refreshing user's top tracks");
	  request.get(options, function(error, response, body) {
	      for (x in body['items']){
		  let track_name = body['items'][x]['name'];
		  track_name = track_name.replace("'", "''");
		  let popularity = body['items'][x]['popularity'];
		  let track_id = body['items'][x]['id'];
		  let artist_id = body['items'][x]['artists'][0]['id'];
		  let artist_name = body['items'][x]['artists'][0]['name'];
		  let cmd = `SELECT SONG_NAME FROM TRACKS WHERE SONG_ID = \'` + track_id + `\'`;
		  doFetch(cmd, function(err, content) {
		      if (err) {
			  console.error(err.message);
		      }
		      else {
			  if (content == null) {
			      let track_cmd = `INSERT INTO tracks VALUES (\'` + track_id + `\', \'` + track_name + `\', \'` + artist_id + `\')`;
			      let user_cmd = `INSERT INTO user_tracks VALUES (\'` + USER_ID + `\', \'` + track_id  + `\', \'` + popularity  + `\')`;
			      //doConnect(track_cmd, doInsert);
			      doInsert(track_cmd);
			      console.log(track_cmd);
			      //doConnect(user_cmd, doInsert);
			      doInsert(user_cmd);
			      console.log(user_cmd);
			  }
			  else {
			      //console.log("Track exists!");
			  }
		      }
	    	  });
	      }
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

//runs this on user page load -- may be a way to add this under app.get('/users')??
app.get('/usernames', function(req, res) {
    //issue query to database to get user
    let cmd = `SELECT spotify_name FROM users WHERE user_id != \'` + USER_ID + `\'`; //CHANGE SO NOT HARD-CODED
    //console.log(cmd);
    doFetchMult(cmd, function(err, content) {
	if (err) {
	    console.error(err.message);
	}
	else {
	         var new_content = [];
		 //console.log(content);
		 for (var i = 0; i < content.length; i++) {
			//console.log(content[i][0]);
		        new_content.push(content[i][0]);
		 }
	         //console.log(new_content);
		 res.send({'s_name': new_content});
	}
    });

});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/compareMusic', function(req, res) {
    var other_user = req.body.other_user;
    let cmd = `SELECT A1.artist_name
    FROM user_artists UA1, user_artists UA2, artists A1
    WHERE UA1.user_id = \'` + USER_ID + `\' AND
    UA2.user_id =
	(SELECT user_id
	 FROM users
	 WHERE SPOTIFY_NAME = \'` + other_user + `\') AND
    UA1.artist_id = UA2.artist_id AND
    UA1.artist_id = A1.artist_id`;
    doFetchMult(cmd, function(err, content) {
	if (err) {
	    console.error(err.message);
	}
	else {
	    if(!content) {
		console.log("no common artists");
		res.send({'shared_artists': null});
	    }
	    else {
		var new_content = [];
		for (var i = 0; i < content.length; i++) {
		    new_content.push(content[i][0]);
		}
		console.log(new_content);
		res.send({'shared_artists': new_content});
	    }
	}
    });
});
/*
app.post('/topArtists', function(req, res) {
    var other_user = req.body.other_user;
    let cmd = `SELECT * FROM (SELECT A1.artist_name FROM user_artists UA1, artists A1 where UA1.user_id = \'` + USER_ID + `\' AND UA1.artist_id = A1.artist_id ORDER BY popularity DESC) resultSet WHERE rownum <= 5`;
    doFetchMult(cmd, function(err, content) {
	if (err) {
	    console.error(err.message);
	}
	else {
	    if(!content) {
		console.log("nothing");
		res.send({'top_artists': null});
	    }
	    else {
		var new_content = [];
		for(var i = 0; i < content.length; i++){
		    new_content.push(content[i][0]);
		}
		console.log(new_content);
		res.send({'top_artists': new_content});
	    }
	}
    });
});
*/
function pl_comm_tracks() {
    console.log("searching for common tracks...");
    cmd = `SELECT T.song_id
    FROM user_tracks UT1, user_tracks UT2, tracks T
    WHERE UT1.user_id = \'` + USER_ID + `\' AND
    UT2.user_id = \'` + other_id + `\' AND
    UT1.song_id = UT2.song_id AND
    UT1.song_id = T.song_id`;
    doFetchMult(cmd, function(err, content) {
	if (err) {
	    console.error(err.message);
	}
	else {
	    if(!content) {
		//console.log("...no common tracks");
		return;
	    }
	    else {
		for (var i = 0; i < content.length; i++) {
		    cmd = `INSERT INTO playlist_contents VALUES (\'` + pl_id + `\', \'` + content[i][0] + `\')`;
		    doConnect(cmd, doInsert);
		    pl_ct = pl_ct + 1;
		}
		console.log("...done");
	    }
	}
    });
    console.log("1. " + pl_ct + " songs in playlist #" + pl_id);
    return;
}

function pl_comm_artists() {
    console.log("searching for tracks in database from common artists...");
    cmd = `SELECT A1.artist_id
    FROM user_artists UA1, user_artists UA2, artists A1
    WHERE UA1.user_id = \'` + USER_ID + `\' AND
    UA2.user_id = \'` + other_id + `\' AND
    UA1.artist_id = UA2.artist_id AND
    UA1.artist_id = A1.artist_id`;
    doFetchMult(cmd, function(err, content) {
	if (err) {
	    console.error(err.message);
	}
	else {
	    if(!content) {
		//console.log("...no common artists");
		return;
	    }
	    else {
		for (var i = 0; i < content.length; i++) {
		    cmd = `INSERT INTO playlist_contents(playlist_id, song_id)
		    SELECT \'` + pl_id + `\', song_id
		    FROM tracks
    		    WHERE artist_id = \'` + content[i][0] + `\'`;
		    doConnect(cmd, doInsert);
		    pl_ct = pl_ct + 1;
		}
		console.log("...done");
	    }
	}
    });
    console.log("2. " + pl_ct + " songs in playlist #" + pl_id);
    return;
}

function pl_comm_artists_api() {
    console.log("searching for tracks in spotify api from common artists...");
    cmd = `SELECT A1.artist_id
    FROM user_artists UA1, user_artists UA2, artists A1
    WHERE UA1.user_id = \'` + USER_ID + `\' AND
    UA2.user_id = \'` + other_id + `\' AND
    UA1.artist_id = UA2.artist_id AND
    UA1.artist_id = A1.artist_id`;
    doFetchMult(cmd, function(err, content) {
	if (err) {
	    console.error(err.message);
	}
	else {
	    if(!content) {
		//console.log("...no common artists");
		return;
	    }
	    else {
		for (var i = 0; i < content.length; i++) {
		    var options = {
 			url: `https://api.spotify.com/v1/artists/${content[i][0]}/top-tracks?country=US`,
			headers: {
			    'Authorization': 'Bearer ' + ACCESS//access_token
          		},
			json: true
		    };
		    console.log(options.url);
		    let artist_id = content[i][0];
      		    request.get(options, function(error, response, body) {
	   		for (x in body['tracks']){
			    let track_name = body['tracks'][x]['name'];
			    track_name = track_name.replace("'", "''");
			    let track_id = body['tracks'][x]['id'];
			    let cmd = `SELECT SONG_NAME FROM TRACKS WHERE SONG_ID = \'` + track_id + `\'`;
			    doFetch(cmd, function(err2, content2) {
				if (err2) {
				    console.error(err2.message);
				}
				else {
				    if (content2 == null) {
			      		let track_cmd = `INSERT INTO tracks VALUES (\'` + track_id + `\', \'` + track_name + `\', \'` + artist_id + `\')`;
					doConnect(track_cmd, doInsert);
				    }
				    else {
					//console.log("Track exists!");
				    }
				}
	    		    });
			}
		    });
		    cmd = `INSERT INTO playlist_contents(playlist_id, song_id)
		    SELECT \'` + pl_id + `\', song_id
		    FROM tracks
    		    WHERE artist_id = \'` + artist_id + `\'`;
		    doConnect(cmd, doInsert);
		    pl_ct = pl_ct + 1;
		}
		console.log("...done");
	    }
	}
    });
    console.log("3. " + pl_ct + " songs in playlist #" + pl_id);
    return;
}

function pl_rand_tracks() {
    console.log("searching for a user's most popular top tracks...");
    cmd = `SELECT UT.song_id
    FROM user_tracks UT
    WHERE UT.user_id = \'` + USER_ID + `\'
    ORDER BY popularity`;
    doFetchMult(cmd, function(err, content) {
	if (err) {
	    console.error(err.message);
	}
	else {
	    if(!content) {
		//console.log("...no common tracks");
		return;
	    }
	    else {
		for (var i = 0; i < 5; i++) {
		    cmd = `INSERT INTO playlist_contents VALUES (\'` + pl_id + `\', \'` + content[i][0] + `\')`;
		    doConnect(cmd, doInsert);
		    pl_ct = pl_ct + 1;
		}
		console.log("...done");
	    }
	}
    });
    cmd = `SELECT UT.song_id
    FROM user_tracks UT
    WHERE UT.user_id = \'` + other_id + `\'
    ORDER BY popularity`;
    doFetchMult(cmd, function(err, content) {
	if (err) {
	    console.error(err.message);
	}
	else {
	    if(!content) {
		//console.log("...no common tracks");
		return;
	    }
	    else {
		for (var i = 0; i < 5; i++) {
		    cmd = `INSERT INTO playlist_contents VALUES (\'` + pl_id + `\', \'` + content[i][0] + `\')`;
		    doConnect(cmd, doInsert);
		    pl_ct = pl_ct + 1;
		}
		console.log("...done");
	    }
	}
    });
    console.log("4. " + pl_ct + " songs in playlist #" + pl_id);
    return;
}

app.post('/genPlaylist', function(req, res) {
    var other_user = req.body.other_user;
	 pl_ct = 0;
    let cmd = `SELECT user_id
	 	FROM users
	 	WHERE SPOTIFY_NAME = \'` + other_user + `\'`;
    doFetch(cmd, function(err, content) {
	if (err) {
	    console.error(err.message);
	}
	else {
	    if(!content) {
		console.log("no user");
	    }
	    else {
		other_id = content;
		let cmd = `SELECT max(playlist_id) from playlist_users`;
		doFetch(cmd, function(err2, value) {
		    if (err2) {
			console.error(err2.message);
		    }
		    else {
			pl_id = value + 1;
			let list_cmd = `INSERT INTO playlist_users VALUES (\'` + USER_ID + `\', \'` + pl_id + `\')`;
			doConnect(list_cmd, doInsert);
			list_cmd = `INSERT INTO playlist_users VALUES (\'` + other_id + `\', \'` + pl_id + `\')`;
			doConnect(list_cmd, doInsert);
		    }
		});

		// insert playlist functions sequentially here
		console.log("0. " + pl_ct + " songs in playlist #" + pl_id);
		if (pl_ct < 10) {
		    //pl_comm_tracks();
		    setTimeout(pl_comm_tracks, 1000);
		}
		if (pl_ct < 10) {
		    //pl_comm_artists();
		    setTimeout(pl_comm_artists, 1000);
		}
		if (pl_ct < 10) {
		    //pl_comm_artists_api();
		    setTimeout(pl_comm_artists_api, 1000);
		}
		if (pl_ct < 10) {
		    setTimeout(pl_rand_tracks, 1000);
		}
		console.log(pl_ct + " total songs added to playlist #" + pl_id);
	    }
	}
    });
});


app.get('/getPlaylist', function(req, res) {
    let cmd = `SELECT Z.playlist_id, UX.spotify_name, T.song_name, A.artist_name, Z.U1
    FROM playlist_contents C, tracks T, users UX, artists A,
    (SELECT X.user_id AS U1, U.user_id AS U2, U.playlist_id
     FROM playlist_users U,
     (SELECT *
      FROM playlist_users
      WHERE user_id = \'` + USER_ID + `\') X
     WHERE U.playlist_id = X.playlist_id AND U.user_id != X.user_id) Z
    WHERE C.playlist_id = Z.playlist_id AND
    C.song_id = T.song_id AND
	 Z.U2 = UX.user_id AND
    T.artist_id = A.artist_id`;
    doFetchMult(cmd, function(err, content) {
	if (err) {
	    console.error(err.message);
	}
	else {
	    if(!content) {
		console.log("no playlist songs");
		res.send({'get_playlist': null});
	    }
	    else {
		var new_content = [];
		var songs = [];
		for (var i = 0; i < content.length; i++) {
		    new_content.push(content[i]);
		}
		console.log(new_content);
		res.send({'get_playlist': new_content});
	    }
	}
    });
});

app.get('/users', function(req, res) {
  res.sendFile(__dirname + '/public/users.html', {
    headers: {
	'access_token': ACCESS
    }
  });

});

app.get('/profile', function(req, res) {
  res.sendFile(__dirname + '/public/profile.html', {
		headers: {
		    'access_token': ACCESS
		}
  });
});

app.get('/playlist', function(req, res) {
    res.sendFile(__dirname + '/public/playlist.html', {
	headers: {
	    'access_token': ACCESS
	}
    });
});
console.log('Listening on 8888');
app.listen(8888);
