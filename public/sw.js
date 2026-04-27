// PWA 설치 요건을 통과하기 위한 최소한의 서비스 워커 파일입니다.
self.addEventListener('install', (e) => {
  console.log('[Service Worker] Installed');
});

self.addEventListener('fetch', (e) => {
  // fetch 이벤트 리스너가 존재해야 브라우저가 PWA로 인식합니다.
});
