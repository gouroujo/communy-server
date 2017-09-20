const Memcached = require('memcached');
const { promisify } = require('util');

const config = require('./config');

const memcached = new Memcached(config.get('MEMCACHE_URL'));

module.exports = {
  get(key) {
    return promisify(memcached.get.bind(memcached))(key)
    .catch(console.log)
  },
  set(key, value, lifetime) {
    return promisify(memcached.set.bind(memcached))(key, value, lifetime)
    .catch(console.log)
  },
  touch(key, lifetime) {
    return promisify(memcached.touch.bind(memcached))(key, lifetime)
    .catch(console.log)
  },
  replace(key, value, lifetime) {
    return promisify(memcached.replace.bind(memcached))(key, value, lifetime)
    .catch(e => {
      console.log(e)
      return promisify(memcached.del.bind(memcached))(key)
        .catch(console.log)
    })
  },
  del(key) {
    return promisify(memcached.del.bind(memcached))(key)
    .catch(console.log)
  },
  m: memcached,
  USER_CACHE_LIFETIME: config.get('USER_CACHE_LIFETIME'),
}
