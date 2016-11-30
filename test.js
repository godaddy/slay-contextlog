/* eslint strict: 0 */

'use strict';

const contextLog = require('./');
const assume = require('assume');

describe('slay-contextlog', function () {
  var app;
  beforeEach(function () {
    app = {
      msgs: [],
      log: {
        levels: ['info'],
        info: function (msg) {
          app.msgs.push(msg);
        }
      }
    };
  });

  it('defines app.contextLog', function (done) {
    contextLog(app, {}, function () {
      assume(app.contextLog).equals(app.log);
      done();
    });
  });

  it('defines app.withBreadcrumb', function (done) {
    contextLog(app, {}, function () {
      assume(app.withBreadcrumb).is.a('function');
      done();
    });
  });
});
