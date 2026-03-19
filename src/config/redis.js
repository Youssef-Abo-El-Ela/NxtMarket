const { Redis } = require('ioredis');
const { redis } = require('./env');

const redisClient = new Redis({
    host: redis.host || 'localhost',
    port: redis.port || 6379,
    password: redis.password || undefined,
});

redisClient.on('connect', () => {
    console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
    console.error('Failed to connect to Redis:', err);
});



module.exports = redisClient;
