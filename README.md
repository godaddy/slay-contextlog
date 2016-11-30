## Usage

This module can be used by doing:

``` js
app.preboot(require('slay-contextlog');
// ...
  app.contextLog.info('hiya!');
// ...
```

## Description

Sometimes when writing code you need to create asynchronous workflows.

It can be hard to manage object references to your logger, this module will attach an `app.contextLog` property to track your async workflows.

``` js
var buildId = 1;
app.contextLog.info('about to do things');
app.withBreadcrumb({
  buildId: buildId
}, () => {
  // app.contextLog includes build id in any metadata
  app.contextLog.info('something happened');
  fs.readFile('thing.txt', (err. body) => {
    // app.contextLog still has build id
    app.withBreadcrumb({
      fileCRC: crc(body)
    }, () => {
      app.contextLog.info('something else happened');
    });
  });
});
```

outputs:

```
about to do things
something happened {breadcrumbs=[buildId=1]}
something else happened {breadcrumbs=[buildId=1,fileCRC=DEADBEEF]}
```

## API

``` js
app.contextLog
```

This is a [winston](https://github.com/winstonjs/winston) logger that can be used to log info based upon your current context. It is the preferred approach to logging vs `app.log`.

``` js
app.runWithLoggerBreadcrumb(value, fn);
```

A bit of a mouthful! This function runs `fn` with a `app.contextLog` that contains `value` in the metadata array `breadcrumbs`. Any callbacks queued during execution of `fn`.

NOTE: It does not ensure `Promise` callbacks are set to the proper context for now due to technical limitations of `Promise`.

## Workflows

### Retries

Some operations need to track retries of operations like unsafe operations. If we add breadcrumbs to an existing operation, it will produce 2 breadcrumbs with `retries_left:n` and `retries_left:n-1`. This is undesirable. The solution is to ensure attempt is always given the logger it originally gave a breadcrumb.

``` js
function attempt(fn, retriesLeft, done) {
  // cache original logger
  const logger = app.contextLog;
  function next(err) {
    if (err) {
      perform(retriesLeft--);
      return;
    }

    done();
  }

  function perform(retriesLeft) {
    if (retriesLeft === 0) {
      return void done(Error('No success'));
    }

    app.contextLog = logger;
    app.withBreadcrumb({retriesLeft}, () => fn(next));
  }

  perform(retriesLeft);
}
```

There are various ways to cache the original logger besides this, but it is something to note.


## Test

```sh
npm test
```

## License
MIT
