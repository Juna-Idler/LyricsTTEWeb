// キャッシュファイルの指定
var CACHE_NAME = 'LyricsTTE-caches';
var urlsToCache = [
    'index.html',
    'WaveViewer.js',
    'AudioFragmentPlayer.js',
    'Lyrics.js',
    'index.js',
    'help.html'
];

// インストール処理
self.addEventListener('install', (event)=> {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll(urlsToCache);
            })
    );
});

// リソースフェッチ時のキャッシュロード処理
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then((response)=> {
                return response ? response : fetch(event.request);
            })
    );
});
