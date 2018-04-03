-- gp3 project

drop table stations cascade constraints;

create table stations (
	station_id number(11),
	station_name varchar(45),
	station_type number(11),
	api_id number(11),
	primary key (station_id)
);

exit;
