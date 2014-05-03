/**
 * Defination of how to run jobs
 */
exports['sync-subscriber'] = function* (job) {
  yield sync_subscriber(job.data)
}
