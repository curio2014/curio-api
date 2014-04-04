var Media = require_('models/media')
var app = require_('serve/mesa')
var auth = require_('serve/mesa/auth')
var kue = require_('lib/kue')
var utils = require_('lib/utils')

var jobs = require('./jobs')

// Manage jobs for media
app.rest('/medias/:id/jobs/:jobname')
  .use(app.auth.need('mediaAdmin'))
  .use(function *() {
    this.assert(this.params.jobname in jobs, 404)

    this.media = yield Media.get(this.params.id)

    this.assert(this.media, 404)
  })
  .get(function *(next) {

  })
  .post(function *(next) {
    var data = utils.defaults({ media_id: this.media.id }, this.body)

    kue.create(this.params.jobname, data)
      .priority(args.priority || 0)
      .save()

    this.body = { ok: true }
  })


