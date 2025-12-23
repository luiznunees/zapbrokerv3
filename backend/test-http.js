const https = require('https');

console.log('Testing connectivity with native https module...');

const options = {
    hostname: 'google.com',
    port: 443,
    path: '/',
    method: 'GET',
    // Force IPv4
    family: 4
};

const req = https.request(options, (res) => {
    console.log(`statusCode: ${res.statusCode}`);

    res.on('data', (d) => {
        process.stdout.write('Data received (sample): ' + d.toString().substring(0, 20) + '...\n');
    });
});

req.on('error', (error) => {
    console.error('HTTPS Error:', error);
});

req.end();
