-- gp3 project

drop table users cascade constraints;

create table users (
	user_id number(11),
	frontend_id number(11),
	primary key (user_id)
);

exit;
