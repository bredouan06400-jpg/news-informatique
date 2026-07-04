/* News Informatique — logique applicative (PWA, alertes, installation) */
(function () {
  'use strict';

  var LATEST_URL = 'data/latest.json';
  var CHECK_EVERY_MS = 30 * 60 * 1000; // re-vérifie toutes les 30 min quand l'app est ouverte

  /* ---------- Service worker ---------- */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function (e) {
      console.warn('SW non enregistré :', e);
    });
  }

  /* ---------- Installation (Android / desktop) ---------- */
  var installBtn = document.getElementById('installBtn');
  var deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) installBtn.hidden = false;
  });

  if (installBtn) {
    installBtn.addEventListener('click', function () {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function () {
        deferredPrompt = null;
        installBtn.hidden = true;
      });
    });
  }

  window.addEventListener('appinstalled', function () {
    if (installBtn) installBtn.hidden = true;
  });

  /* iOS : pas de beforeinstallprompt — afficher l'aide dédiée */
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  var isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                     window.navigator.standalone === true;
  var iosHint = document.getElementById('iosHint');
  if (iosHint && isIOS && !isStandalone) iosHint.hidden = false;

  /* ---------- Alertes nouvelles news ---------- */
  var notifBtn = document.getElementById('notifBtn');
  var banner = document.getElementById('updateBanner');

  function refreshNotifBtn() {
    if (!notifBtn) return;
    if (!('Notification' in window)) { notifBtn.hidden = true; return; }
    if (Notification.permission === 'granted') {
      notifBtn.textContent = '🔔 Alertes activées';
      notifBtn.disabled = true;
    } else if (Notification.permission === 'denied') {
      notifBtn.textContent = '🔕 Alertes bloquées (voir réglages navigateur)';
      notifBtn.disabled = true;
    }
  }

  if (notifBtn) {
    notifBtn.addEventListener('click', function () {
      if (!('Notification' in window)) return;
      Notification.requestPermission().then(function () {
        refreshNotifBtn();
        checkLatest(true);
      });
    });
    refreshNotifBtn();
  }

  function notify(title, body) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(function (reg) {
        reg.showNotification(title, {
          body: body,
          icon: 'assets/img/icon-192.png',
          badge: 'assets/img/icon-192.png'
        });
      }).catch(function () { try { new Notification(title, { body: body }); } catch (_) {} });
    } else {
      try { new Notification(title, { body: body }); } catch (_) {}
    }
  }

  var bannerTimer = null;
  function showBanner(text) {
    if (!banner) return;
    banner.querySelector('span').textContent = text;
    banner.hidden = false;
    /* disparaît seule après 15 s pour ne pas gêner la navigation ;
       reviendra au prochain passage si la MAJ n'a pas été vue */
    if (bannerTimer) clearTimeout(bannerTimer);
    bannerTimer = setTimeout(function () { banner.hidden = true; }, 15000);
  }

  if (banner) {
    banner.querySelector('button.reload').addEventListener('click', function () {
      var seen = banner.getAttribute('data-latest');
      if (seen) localStorage.setItem('newsinfo.lastSeen', seen);
      location.reload();
    });
    banner.querySelector('button.close').addEventListener('click', function () {
      var seen = banner.getAttribute('data-latest');
      if (seen) localStorage.setItem('newsinfo.lastSeen', seen);
      banner.hidden = true;
    });
  }

  function checkLatest(silent) {
    fetch(LATEST_URL + '?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (info) {
        var stamp = info.edition + '@' + info.updated;
        var last = localStorage.getItem('newsinfo.lastSeen');
        if (!last) { localStorage.setItem('newsinfo.lastSeen', stamp); return; }
        if (last !== stamp) {
          if (banner) banner.setAttribute('data-latest', stamp);
          showBanner('🆕 ' + (info.titre || 'De nouvelles news sont disponibles !'));
          if (!silent) notify('News Informatique', info.titre || 'De nouvelles news sont disponibles !');
        }
      })
      .catch(function () { /* hors-ligne : silencieux */ });
  }

  checkLatest(false);
  setInterval(function () { checkLatest(false); }, CHECK_EVERY_MS);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) checkLatest(false);
  });
})();
