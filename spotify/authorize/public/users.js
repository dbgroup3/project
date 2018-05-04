//This file can be changed, I was just using it to test out Spotify API functionality - it works :)
var access_token = document.cookie;
var SHARED;
var OTHER;

var usernamesSource = document.getElementById('usernames-template').innerHTML,
    usernamesTemplate = Handlebars.compile(usernamesSource),
    usernamesPlaceholder = document.getElementById('usernames');


var sharedSource = document.getElementById('shared-template').innerHTML,
    sharedTemplate = Handlebars.compile(sharedSource),
    sharedPlaceholder = document.getElementById('shared');

var commonsongsSource = document.getElementById('commonsongs-template').innerHTML,
    commonsongsTemplate = Handlebars.compile(commonsongsSource),
    commonsongsPlaceholder = document.getElementById('commonsongs');

var imagesArray = ["img/yellow.png", "img/pink.png", "img/gray.png", "img/blue.png", "img/lightblue.png"];


//Run this when the page loads
var s_name;
$(document).ready(function() {
    $.ajax({
	url: '/usernames',
    }).done(function(d) {
	s_name = d.s_name;
	console.log(s_name);
	for(var i = 0; i < s_name.length; i++){
	    usernamesPlaceholder.innerHTML = usernamesTemplate({
		spotify_name: s_name
	    });
	}
    });
});

function displayImage(){
    var num = Math.floor(Math.random() * 5);
    //document.getElementsByTagName('img').src = imagesArray[num];
    console.log(imagesArray[num]);
    return imagesArray[num];
}

function getTopSongs(userName){
    $.ajax({
	type: 'POST',
	url: '/topArtists',
	data: {
	    other_user: userName
	}
    }).done(function(data) {
	top_artists = data.top_artists;
	console.log(top_artists);
	if(top_artists != null) {
	    commonsongsPlaceholder.innerHTML = commonsongsTemplate({
		top_artists: top_artists
	    });
	} else {
	    commonsongsPlaceholder.innerHTML = commonsongsTemplate({
		top_artists: ['one or more user does not have top songs']
	    });
	}
    });
}



var shared_artists;
function myTest(innerName){
    OTHER = innerName;
    var allartists = [];
    //console.log(innerName);
    $.ajax({
	type: 'POST',
	url: '/compareMusic',
	data : {
	    other_user: innerName
	},
    }).done(function(data) { 
	shared_artists = data.shared_artists;
	if(shared_artists != null){
	    sharedPlaceholder.innerHTML = sharedTemplate({
		shared_artists: shared_artists	
	    });

	} else {
	    sharedPlaceholder.innerHTML = sharedTemplate({
		shared_artists: ['no shared artists']
	    });
	}
	//console.log(shared_artists);
    });
}

function getUser(other){
    document.getElementById("h2-other").innerHTML = "Your shared artists with: " + other;
    console.log(other);
}
function getUserForPlaylist(){
    console.log(OTHER); 
	//document.getElementById("test-button").innerHTML = "test";
}
function getPlaylist() {
	//console.log("you pushed the button");
	$.ajax({
		type: 'POST',
		url: '/genPlaylist',
		data: {
			other_user: OTHER
		},
	})
}

function playlistClick() {
	message = "Generated playlist with: " + OTHER
	console.log(message);
	var modal = document.getElementById('myModal');
	var span = document.getElementsByClassName("close")[0];
	modal.style.display = "block";
	span.onclick = function() {
		modal.style.display = "none";
	}
	window.onclick = function(event) {
		if (event.target == modal) {
			modal.style.display = "none";
		}
	}
}

