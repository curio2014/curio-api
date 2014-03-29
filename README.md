# Curio API

The backend for [curio](http://github.com/CuriousityChina/curio) web app, built with [koajs](http://koajs.com/).

Requires `node --harmony-generators` enabaled, which means `node >= 0.11.7` or [gnode](https://github.com/TooTallNate/gnode).

Currently, `node v0.11.10` is recommended. (Since node v0.11.11 has issue building c++ binding modules).

## Start

### Create databases

Run a PostgreSQL server, add your own user and database via `psql` or `createuser`:

```bash
createuser -P -e curio   # `-P` means prompt password(`--pwprompt`)
createdb -e -O curio curio 'The wechat app Curio'  # `-O` means `--owner`.
```

Or simply `make createdb`.

And make sure you have a `redis-server` running.


### Update `conf/development.conf.js`

Use `make init` to copy conf/development.conf.js.tmpl to `conf/development.conf.js`, edit it, add some of your own configs.

For available options, see `conf/default.conf.js`


### Preparing for test data

1. Create database tables

    ./bin/curio init_db

2. Fillup test data

    ./bin/curio fillup

3. Run `make` to start a development server (file changes watched by `Supervisor`)


### Make the bin `curio` executable

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


### Conventions

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


