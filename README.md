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

    ./bin/curio init_db

2. Fillup test data

    ./bin/curio fillup


3. Run `make` to start a development server (file changes watched by `Supervisor`)
