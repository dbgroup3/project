-- gp3 project

drop table songs cascade constraints;

create table songs (
	song_id number(11),
	api_id number(11),
	primary key (song_id)
);

exit;
