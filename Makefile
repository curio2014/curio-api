start:
	@export DEBUG="curio:* cache* store*" && supervisor -w 'lib,serve,models,app.js,conf' \
	--harmony	-p 1000 -n error -- --debug app.js

build:
	@export NODE_ENV=production && \
		npm install --production

debug:
	@export DEBUG="curio:*" && node --harmony --debug app.js

inspector:
	@node-inspector --web-port=3001

createdb:
	createuser -P -e curio
	createdb -e -O curio curio 'The wechat app Curio'

init_db:
	rm -rf ./var/dbstore/
	./bin/curio init_db

fillup:
	./bin/curio fillup

shrink:
	npm shrinkwrap
