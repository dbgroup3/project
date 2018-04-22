-- gp3 project

drop table users cascade constraints;

create table users (
	user_id number(11),
	spotify_id varchar(30),
	primary key (user_id)
);

exit;
