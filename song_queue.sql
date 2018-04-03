-- gp3 project

drop table song_queue cascade constraints;

create table user_permissions (
	song_id number(11),
	station_id number(11),
	votes number(11),
	q_position number(11),
	primary key (song_id, station_id),
	foreign key (song_id) references songs(song_id),
	foreign key (station_id) references stations(station_id)
);

exit;
