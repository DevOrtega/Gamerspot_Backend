const cors_proxy = require('cors-anywhere');
require('dotenv').config();

const host = '0.0.0.0';
const port = 8080;

cors_proxy.createServer({
    originWhitelist: 'http://localhost:4200',
    //originWhitelist: ['http://ec2-15-237-13-78.eu-west-3.compute.amazonaws.com'],
    requireHeader: ['origin', 'x-requested-with'],
    removeHeaders: ['cookie', 'cookie2']
}).listen(port, host);