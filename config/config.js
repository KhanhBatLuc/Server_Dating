const config = {
    default: {
        SECRET: 'mysecretkey',
        DATABASE: 'mongodb://localhost:27017/dating',
        JWT_ACCESS_SECRET: 'JWT_ACCESS_SECRET',
        JWT_REFRESH_SECRET: 'JWT_REFRESH_SECRET',
        JWT_ACCESS_TIME: '30d',
        JWT_REFRESH_TIME: '30d',
        REDIS_HOST: '127.0.0.1',
        REDIS_PORT: '6379',
    }
}


exports.get = function get() {
    return config.default
}