import config from 'config';

if (config.appEnv === 'dev') {
  module.exports = require('./configureStore.development');
} else {
  module.exports = require('./configureStore.production');
}
