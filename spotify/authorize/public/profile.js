//This file can be changed, I was just using it to test out Spotify API functionality - it works :)
var access_token = document.cookie;
var SHARED;

var personalSource = document.getElementById('personal-template').innerHTML,
  personalTemplate = Handlebars.compile(personalSource),
  personalPlaceholder = document.getElementById('personal');


//Run this when the page loads
$(document).ready(function() {
      $.ajax({
        url: 'https://api.spotify.com/v1/me/top/artists',
        type: 'GET',
        headers: {
          'Authorization': 'Bearer ' + access_token,
        },
        time_range: "long_term",
        success: function(response) {
          console.log(response)
          personalPlaceholder.innerHTML = personalTemplate(response);
          if (response.items.length == 0) {
            personalPlaceholder.innerHTML = "Unable to find top tracks. Giving global suggestions.";
            $.ajax({
              url: '	https://api.spotify.com/v1/search',
              type: 'GET',
              headers: {
                'Authorization': 'Bearer ' + access_token,
              },
              data: {
                type: 'artist',
                limit: 9,
                q: 'Taylor',
              },
              success: function(res) {
                personalPlaceholder.innerHTML = personalTemplate(res);
              }

            })
          }
          $(function() {
            $("#dialog").dialog({
              autoOpen: false,
              modal: true,
            });
            $('.topArtist').click(function(e) {
              let loc = document.getElementById('dialog-'+this.id)
              let dest = document.getElementById('dialog')
              dest.innerHTML = loc.innerHTML
              $("#dialog").dialog('open');
            });

          });
        }
      });

      Handlebars.registerHelper('ifThird', function(index, options) {
        if (index % 3 == 2) {
          return options.fn(this);
        } else {
          return options.inverse(this);
        }

      });
      Handlebars.registerPartial('dialog', `      <div id="dialog" title="More on {{name}}">
              <p>Global Followers: {{followers.total}} </p>
              <p>
                {{#each genres}} {{this}} {{/each}}
              </p>
            </div>`)
      });

      /*	}).done(function(data) {
      	    s_name = data.s_name;
      	    console.log(s_name);
      	    for(var i = 0; i < s_name.length; i++){
      		usernames.innerHTML = usernamesTemplate({
      		    spotify_name: s_name
      		    //spotify_name: s_name[i][0]
      		});
      	    }
      	});

      }); */
