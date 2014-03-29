/**
 * PostgreSQL `generate_series` function helper
 */
var Model = require('jugglingdb').AbstractClass
var _ = require_('lib/utils')
var db = require('./index')
var floordate = require('floordate')

// only support these intervals

var ONE_MINUTE = 60 * 1000
var ONE_HOUR = 60 * ONE_MINUTE
var ONE_DAY = 24 * ONE_HOUR
var deltas = {
  '1hour': ONE_HOUR,
  '1day': ONE_DAY,
  '7days': 7 * ONE_DAY,
  '30days': 30 * ONE_DAY,
}
var intervals = {
  second: 1000,
  minute: 60000,
  hour: ONE_HOUR,
  day: ONE_DAY,
  week: 7 * ONE_DAY
}

function safeDates(options) {
  var interval = options.interval
  var end = new Date(options.maxDate) || new Date()
  var start = new Date(options.minDate)
  var period = options.period

  if (isNaN(+end)) {
    end = new Date()
  }
  // end value is actually a ceil date
  end = new Date(+floordate(end, interval) + intervals[interval])

  if (period) {
    if (!(period in deltas)) {
      throw new Error('Invalid period ' + period)
    }
    start = new Date(end - deltas[period])
  }
  if (isNaN(+start)) {
    throw new Error('Invalid minDate')
  }

  return [start, end]
}


Model.timeseries_count = function* timeseries(options) {
  options = options || {}

  sql = [
    "SELECT date, coalesce(count,0) AS count FROM",
       "generate_series(TIMESTAMP WITH TIME ZONE '${start}', TIMESTAMP WITH TIME ZONE '${end}', '1 ${interval}') AS date",
    "LEFT OUTER JOIN",
       "(SELECT",
          "date_trunc('${interval}', ${column}) as day,",
          "count(id) as count",
        "FROM",
          "${table}",
        "WHERE",
          "${column} >= TIMESTAMP WITH TIME ZONE '${start}'",
          "AND ${column} < TIMESTAMP WITH TIME ZONE '${end}'",
          "${filter}",
          "GROUP BY day) results",
    "ON (date = results.day)"
  ].join(' ')

  var interval = options.interval
  var column = options.column = options.column || 'created_at'
  var modelName = this.modelName
  var prop = this.properties[column]
  var dates = safeDates(options)

  if (!(interval in intervals)) {
    throw new Error('invalid interval ' + interval)
  }

  options.start = dates[0].toISOString()
  options.end = dates[1].toISOString()

  options.table = db.adapter.tableEscaped(modelName)

  if ('object' == typeof options.filter) {
    options.filter = db.adapter.toFilter(modelName, { where: options.filter })
    // the condition clause will be join with `WHERE date >= ...`
    options.filter = options.filter.replace('WHERE ', 'AND ')
  }

  sql = sql.replace(/\${(\w+)}/g, function(p0, p1) {
    return options[p1] || ''
  })

  sql_name = modelName + ' count by ' + interval

  return yield db.adapter.execute(sql)
}

