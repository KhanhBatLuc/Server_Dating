const redis = require('redis');
const db = require('../config/config').get();

// connect to redis
const redis_client = redis.createClient(db.REDIS_PORT, db.REDIS_HOST);

redis_client.on('connect', function () {
  console.log('redis client connected');
});

module.exports = redis_client;