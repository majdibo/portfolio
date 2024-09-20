const levels = {
    debug: { value: 0, color: '\x1b[34m' }, // Blue
    info: { value: 1, color: '\x1b[32m' },  // Green
    warn: { value: 2, color: '\x1b[33m' },  // Yellow
    error: { value: 3, color: '\x1b[31m' }  // Red
};

const currentLevel = levels.debug.value;

function log(level, message) {
    if (levels[level].value >= currentLevel) {
        const timestamp = new Date().toISOString();
        console.log(`${levels[level].color}${timestamp} [${level.toUpperCase()}]: ${message}\x1b[0m`);
    }
}

module.exports = {
    debug: (msg) => log('debug', `${msg}`),
    info: (msg) => log('info', msg, ),
    warn: (msg) => log('warn', msg),
    error: (msg) => log('error', msg)
};
