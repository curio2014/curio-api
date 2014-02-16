# Curio API [![repo dependency](https://david-dm.org/CuriousityChina/curio-api.png)](https://david-dm.org/CuriousityChina/curio-api)

The backend for [curio](http://github.com/CuriousityChina/curio) web app, built with [koajs](http://koajs.com/).

Requires `node --harmony-generators` enabaled, which means `node >= 0.11.7` or [gnode](https://github.com/TooTallNate/gnode).

## Start

### PostgreSQL basics

Run a PostgreSQL server, add your own user and database via `psql` or `createuser`:

```bash
createuser -P -e curio   # `-P` means prompt password(`--pwprompt`)
createdb -e -O curio curio 'The wechat app Curio'  # `-O` means `--owner`.
```

Or simply `make createdb`.


### Preparing for test data

1. Create database tables

    make init_db

2. Fillup test data

    make fillup

3. Run `make` to start a development server (file changes watched by `Supervisor`)


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

