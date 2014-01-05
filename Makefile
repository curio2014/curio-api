start:
	@export DEBUG="curio:*" && supervisor -w 'lib,serve,models,app.js,server.js,conf' -p 1000 -n error -- --harmony server.js 

