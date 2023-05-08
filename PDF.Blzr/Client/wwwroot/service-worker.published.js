// Caution! Be sure you understand the caveats before publishing an application with
// offline support. See https://aka.ms/blazor-offline-considerations

self.importScripts('./service-worker-assets.js');
self.addEventListener('install', event => event.waitUntil(onInstall(event)));
self.addEventListener('activate', event => event.waitUntil(onActivate(event)));
self.addEventListener('fetch', event => event.respondWith(onFetch(event)));

const cacheNamePrefix = 'offline-cache-';
const cacheName = `${cacheNamePrefix}${self.assetsManifest.version}`;
const offlineAssetsInclude = [ /\.dll$/, 
                              /\.pdb$/, 
                              /\.wasm/, 
                              /\.html/, 
                              /\.js$/, 
                              /\.json$/, 
                              /\.css$/, 
                              /\.woff$/, 
                              /\.png$/, 
                              /\.jpe?g$/, 
                              /\.gif$/, 
                              /\.ico$/, 
                              /\.blat$/, 
                              /\.dat$/ ];
const offlineAssetsExclude = [ /^service-worker\.js$/ ];

async function onInstall(event) {
    console.info('Service worker: Install');

    // Fetch and cache all matching items from the assets manifest
    const assetsRequests = self.assetsManifest.assets
        .filter(asset => offlineAssetsInclude.some(pattern => pattern.test(asset.url)))
        .filter(asset => !offlineAssetsExclude.some(pattern => pattern.test(asset.url)))
        .map(asset => new Request(asset.url, { integrity: asset.hash, cache: 'no-cache' }));
    await caches.open(cacheName).then(cache => cache.addAll(assetsRequests));

    // This change forces the browser to update the application if it has changed.
    // When this happens any page reload triggers refresh of the application.
    self.skipWaiting();
}

async function onActivate(event) {
    // Activation happens when application sources have been downloaded and available (because we use skipWaiting above)
    // At this point we can show a prompt to reload the page.
    console.info('Service worker: Activate');

    // Delete unused caches
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys
        .filter(key => key.startsWith(cacheNamePrefix) && key !== cacheName)
        .map(key => caches.delete(key)));
}

async function onFetch(event) {
    let cachedResponse = null;

    if (event && event.request && event.request.method === 'GET') {
        // For all navigation requests, try to serve index.html from cache
        // If you need some URLs to be server-rendered, edit the following check to exclude those URLs
        const shouldServeIndexHtml = event.request.mode === 'navigate' 
                && event.request.url 
                // Do not cache PDF files in wwwroot/pdf-files, these should be handled as direct content
                // This check now also covers <schema>://<host>/pdfjs/sample-2.pdf to guarantee reload.
                && !(event.request.url.toLowerCase().endsWith('.pdf') && event.request.url.toLowerCase().includes('/pdf'));

        const request = shouldServeIndexHtml ? 'index.html' : event.request;
        const cache = await caches.open(cacheName);
        cachedResponse = await cache.match(request);
    }

    return cachedResponse || fetch(event.request);
}
