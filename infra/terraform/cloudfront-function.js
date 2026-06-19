function handler(event) {
    var req = event.request;
    var uri = req.uri;

    if (uri.endsWith('/')) {
        req.uri += 'index.html';
        return req;
    }

    if (!/\.[a-z0-9]+$/i.test(uri)) {
        req.uri += '.html';
        return req;
    }

    return req;
}
