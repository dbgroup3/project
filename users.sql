-- gp3 project

drop table users cascade constraints;

create table users (
	user_id number(11) not null,
	spotify_id varchar(30),
	primary key (user_id, spotify_id)
);

drop sequence user_seq;
create sequence user_seq start with 1;

create or replace trigger user_t
before insert on users
for each row

begin
	select user_seq.NEXTVAL
	into :new.user_id
	from dual;
end;
/

exit;
