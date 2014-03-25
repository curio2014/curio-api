start:
	@export DEBUG="curio:* cache* store*" && supervisor -w 'lib,serve,modules,models,app.js,conf' \
	--harmony	-p 1000 -n error -- --debug app.js

build:
	@export NODE_ENV=production && \
		npm install --production

debug:
	@export DEBUG="curio:*" && node --harmony --debug app.js

webot:
	# to debug webot
	@webot send text --des=http://api.curio.com/webot/58 --token=token

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
