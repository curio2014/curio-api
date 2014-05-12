# Curio API

The backend for [curio](http://github.com/CuriousityChina/curio) web app, built with [koajs](http://koajs.com/).

Requires `node --harmony-generators` enabaled, which means `node >= 0.11.7` or [gnode](https://github.com/TooTallNate/gnode).

Currently, `node v0.11.10` is recommended. (Since node v0.11.11 has issue building c++ binding modules).

## Start

### Install debug tool globally

	  npm install -g webot-cli
    npm install -g supervisor
    npm install -g node-inspector


### Create databases

Start a PostgreSQL server, then run `make createdb`.

Also remember to start a `redis-server` running.


### Set local configurations

Use `make init` to copy conf/development.conf.js.tmpl to `conf/development.conf.js`, edit it, add some of your own configs.

For available options, see `conf/default.conf.js`


### Preparing test data

1. Create database tables

    ./bin/curio init_db

2. Fillup test data

    ./bin/curio fillup

3. Run `make` to start a development server (file changes watched by `Supervisor`)


#### Make the bin `curio` executable

Try add this to your .bashrc:

    export PATH="./bin:$PATH"


## Notes

Url routes:

    /api/               API for mesa.curio.im
    /wx/                Urls sent to users, and may be share to Wechat
    /webot/:media_id    Webot interface for Wechat messaging API


Under `/api/`:

    /api/media/:id     A wechat account info
    /api/user/:id      A system user info


### ORM Relations

We use [jugglingdb](https://github.com/1602/jugglingdb) as ORM, and added some handy methods for
easily load relations in `koa`.

Example:

```javascript

// to get the admin, and corresponding media for this admin info
var mediaAdmin = yield MediaAdmin.get(1).attach('media')

```

See `lib/db/index.js` for details.


### Model data storage

Basic information that needs to be fastly queried are stored in PostgreSQL; Supplementary information
are stored as key-value JSON in LevelDB, see `lib/db/cprops.js`.

A `Model.get` will not load `cprops` by default. In most case, you will need to do `yield model.load('props')` or `yield model.loadProps()`.


### Conventions

#### Coding style

1. Return early
2. Do `module.exports` early

#### Directories

```
.
├── benchmark      # Benchmark test
├── bin            # Helper CLI
├── conf           # Configurations based on various environment
├── database       # Database schemas, sync/update/downgrade tools
├── lib            # Libraries
├── models         # core models
├── modules        # detachable modules
├── serve          # Routers and Controllers
├── templates      # templates for serve html pages
├── test
└── var
```


#### Routes

RESTful API are all under serve/resources.js.
Use a custom handler to override the API behavior .

The `Resource` methods are:

    index     GET      items   Model.all(this.query)
    create    POST     items   Model.create(this.req.body)
    read      GET      item    Model.get(this.params.id)
    destroy   DELETE   item    model.destroy()
    update    PUT      item    model.updateAttributes(this.req.body)


When the logic for a specific handler becomes complext, you may want to move it to
the model layer or a seperated file under `serve/`.

Each resource can be given an access control by use `auth.need('roleName')`.


### Trouble shooting

```
Error: yield a function, promise, generator, array, or object
```

You may have passed an invalid value for `yield`, in most cases, the variable is `undefined`.
Check the next call of your _yield chain_.


