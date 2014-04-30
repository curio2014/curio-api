start:
	@export DEBUG="curio:* cache* store* wechat*" && supervisor -w 'lib,serve,modules,models,app.js,conf' \
	--harmony	-p 1000 -n error -- --debug app.js

init:
	npm install -g gnode
	npm install -g webot-cli
	mkdir ./var/dbstore
	cp -vi ./conf/development.conf.js.tmpl ./conf/development.conf.js

build:
	@export NODE_ENV=production && \
		npm install --production \
		--registry=http://r.cnpmjs.org \
		--cache=${HOME}/.npm/.cache/cnpm

debug:
	@export DEBUG="curio:*" && node --harmony --debug app.js

## to debug webot
webot:
	@webot send ${SEND} --des=http://api.curio.com/webot/test --token=token --user=oYAmguC1RY9LPzCxUBflv5n3kyqs

send_scan:
	@SEND='scan' make webot

inspector:
	@node-inspector --web-port=3001

createdb:
	createuser -P -e curio
	createdb -e -O curio curio 'The wechat app Curio'

init_db:
	rm -rf ./var/dbstore
	mkdir ./var/dbstore
	./bin/curio init_db

fillup:
	./bin/curio fillup

shrink:
	npm shrinkwrap
