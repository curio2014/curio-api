start:
	@export DEBUG="curio:* cached:*" && supervisor -w 'lib,serve,models,app.js,server.js,conf' \
		-p 1000 -n error -- --debug --harmony-generators server.js 

build:
	@export NODE_ENV=production && \
		npm install --production

debug:
	@export DEBUG="curio:*" && gnode --debug server.js

inspector:
	@node-inspector --web-port=3001

createdb:
	@createuser -P -e curio
	@createdb -e -O curio curio 'The wechat app Curio'

init_db:
	rm -rf ./var/leveldb
	export NODE_ENV=test
	./bin/curio init_db

fillup:
	./bin/curio fillup

shrink:
	npm shrinkwrap
