import request from 'request';

// As of 11 Jul 2026, Steam seems to 429 requests that don't have some kind of browser header
export default request.defaults({
    headers: {
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'en-US,en;q=0.9',
    }
});