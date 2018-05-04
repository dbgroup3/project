//This file can be changed, I was just using it to test out Spotify API functionality - it works :)
var access_token = document.cookie;
var playSrc = document.getElementById('playlists-template').innerHTML,
  playTemplate = Handlebars.compile(playSrc),
  playLoc = document.getElementById('playlists');

// SELECT Z.playlist_id, UX.spotify_name, T.song_name, A.artist_name, Z.U1, Z.U2

$(document).ready(function() {
  $.ajax({
    url: '/getPlaylist',
  }).done(function(d) {
    // results as pid, spotify_name, song_name in arr
    if (d.get_playlist) {
      p_list = d.get_playlist;
    } else {
      p_list = []
    }
    let plists = new Set();
    let sanitized = {}
    let info = {}

    p_list.forEach(function(e) {
      plists.add(e[0]);
      // info[e[0]] = {
      //   'user': e[1],
      //   'u1': e[3],
      //   'u2': e[4],
      // }
    });

    plists.forEach(function (el) {

    })

    p_list.forEach(function (el) {
        if (sanitized[el[0]]) {
        // sanitized[el[0]].push([{el[2]
          sanitized[el[0]]['songs'].push({'name': el[2], 'artist': el[3]})
        } else {
        // sanitized[el[0]] = [el[2]]
        sanitized[el[0]] = { 'songs': [{'name': el[2], 'artist': el[3]}],
          'user': el[1], 'uid': e[4] }
        }
    })

    console.log(sanitized)

    playLoc.innerHTML = playTemplate(sanitized)
    })

  });

function doSpotifyPost(uid, nm) {
  $.ajax({
  		type: 'POST',
      url: `https://api.spotify.com/v1/users/` + uid + `/playlists`,
      headers: {
      'Authorization': 'Bearer ' + ACCESS//access_token
          },
      json: true,
      body: {
        name: nm,
      }
    });
}
