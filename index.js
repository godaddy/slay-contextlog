/* eslint strict: 0 */

'use strict';

const workflows = require('winston-workflows');
const domain = require('domain');

var uniqueId = 1;
/**
 * Attaches functionality to the application that allows for
 * "breadcrumbs" or "context" to be trickled down to different
 * concurrent requests
 *
 * @param {slap.App} app Application instance
 * @param {Object} opts Options object
 * @param {Function} done Continuation function
 */
module.exports = function addContextLog(app, opts, done) {
  //
  // The application breadcrumb logger is either attached
  // to the current domain or the app.log available in all domains.
  //
  Object.defineProperty(app, 'contextLog', {
    get() {
      return (process.domain && process.domain.log) || app.log;
    },
    set(logger) {
      if (process.domain) {
        process.domain.log = logger;
      }
    },
    configurable: false
  });

  /**
   * Runs the specified `fn` inside of a new Domain which is used SOLELY
   * as a place to hang the breadcrumb information off of for logging.
   *
   * @param {String|Object} creationContext What we are breadcrumbing about
   * @param {Function} logFn Logger function
   * @param {Function} fn Continuation function
   */
  app.withBreadcrumb = function withBreadcrumb(creationContext, logFn, fn) {
    var nestedDomain = domain.create();
    var log = app.log;
    nestedDomain.parent = process.domain || null;
    const id = uniqueId++;
    logFn('contextLog::withBreadcrumb', {
      childBranchId: id,
      creationContext
    });
    nestedDomain.log = workflows.breadcrumb(log, id, 'branchId');
    nestedDomain.run(fn, id);
  };

  done();
};
