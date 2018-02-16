CREATE TABLE form(
  id serial primary key,
  name varchar(64) not null,
  email varchar(65) not null,
  idNumber varchar(10) not null,
  amount INT,
  date timestamp with time zone not null default current_timestamp
);
