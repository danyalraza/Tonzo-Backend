Create DATABASE if not EXISTS tonzo;
DROP Table if EXISTS profiles;
DROP Table if exists moods;
DROP Table if exists storedplaces;


SET DATABASE = tonzo;

CREATE table profiles (
  id varchar(60) NOT NULL,
  name varchar(60)
);

CREATE table moods (
  id varchar(60) NOT NULL,
  sentiment decimal,
  date date
);

CREATE table storedplaces (
 id varchar(60) NOT NULL,
 longitude DECIMAL NOT NULL,
 latitude DECIMAL NOT NULL,
 phone STRING(20) NULL
 placeid STRING(60) NOT NULL
 date date DEFAULT current_date
);
