const cors_proxy = require('cors-anywhere');

const host = '0.0.0.0';
//const port = process.env.PORT || 8080;
const port = process.env.PORT || 80;

cors_proxy.createServer({
    //originWhitelist: 'http://localhost:4200',
    //originWhitelist: 'http://ec2-15-237-13-78.eu-west-3.compute.amazonaws.com',
    originWhitelist: 'https://gamerspot.netlify.app',
    requireHeader: ['origin', 'x-requested-with'],
    removeHeaders: ['cookie', 'cookie2']
}).listen(port, host);