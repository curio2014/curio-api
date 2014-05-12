.PHONY: test coverage

DB_USER     := curio
DB_PASSWORD :=
DB_NAME     := curio

SQL_CREATE_USER := CREATE ROLE ${DB_USER} NOSUPERUSER NOCREATEDB NOCREATEROLE INHERIT LOGIN;
SQL_CREATE_DB   := CREATE DATABASE ${DB_NAME} OWNER=${DB_USER};
SQL_CREATE_EXT  := CREATE EXTENSION cube; CREATE EXTENSION earthdistance;


start:
	@export DEBUG="curio:* cache* store* wechat*" && supervisor -w 'lib,serve,modules,models,app.js,conf' \
	--harmony	-p 1000 -n error -- --debug app.js

test:
	@NODE_END=test DEBUG= node --harmony ./node_modules/.bin/_mocha


init:
	npm install -g gnode
	npm install -g webot-cli
	mkdir ./var/dbstore
	cp -vi ./conf/development.conf.js.tmpl ./conf/development.conf.js
	make createdb
	make init_db

createdb:
	@echo "${SQL_CREATE_USER} ${SQL_CREATE_DB}" | psql postgres
	@echo "${SQL_CREATE_EXT}" | psql ${DB_NAME}

init_db:
	rm -rf ./var/dbstore
	mkdir ./var/dbstore
	./bin/curio init_db

fillup:
	./bin/curio fillup

build:
	@export NODE_ENV=production && \
		npm install --production \
		--registry=http://r.cnpmjs.org \
		--cache=${HOME}/.npm/.cache/cnpm

debug:
	@export DEBUG="curio:*" && node --harmony --debug app.js

## to debug webot
webot:
	@webot send ${SEND} --des=http://api.curio.com/webot/test --token=token --user=oYAmguC1RY9LPzCxUBflv5n3kyqs --verbose

send_scan:
	@SEND='scan' make webot

send_location:
	@SEND='location' make webot

inspector:
	@node-inspector --web-port=3001

shrink:
	npm shrinkwrap
