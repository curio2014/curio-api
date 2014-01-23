start:
	@export DEBUG="curio:*" && supervisor -w 'lib,serve,models,app.js,server.js,conf' \
		-p 1000 -n error -- --harmony-generators server.js 

createdb:
	@createuser -P -e curio
	@createdb -e -O curio curio 'The wechat app Curio'

init_db:
	@./bin/curio init_db

fillup:
	@./bin/curio fillup
