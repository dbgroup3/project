-- gp3 project

drop table user_permissions cascade constraints;

create table user_permissions (
	user_id number(11),
	station_id number(11),
	p_level number(11),
	primary key (user_id, station_id),
	foreign key (user_id) references users(user_id),
	foreign key (station_id) references stations(station_id)
);

exit;
