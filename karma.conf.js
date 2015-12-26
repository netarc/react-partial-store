module.exports = function(config) {
  config.set({
    logLevel: 'LOG_DEBUG',

    reporters: ['spec'],

    singleRun: true,
    autoWatch: false,

    frameworks: [
      'mocha',
      'browserify'
    ],

    files: [
      'test/shims/phantomjs-shims.js',
      'test/*.spec.js'
    ],

    exclude: [
      // TODO: Fix this.. this spec makes http requests and Karma/Nock/PhantomJS/something
      // is not playing nice and cross domain blocking despite any proxy/CORS attempt to fix.
      'test/StackInvoker.spec.js'
    ],

    preprocessors: {
      'test/*.spec.js': ['browserify']
    },

    browserify: {
      debug: true
    },

    customLaunchers: {
      PhantomJS_without_security: {
        base: 'PhantomJS',
        options: {
          settings: {
            webSecurityEnabled: false
          }
        },
        flags: ["--web-security=no"]
      }
    }
  });
};
