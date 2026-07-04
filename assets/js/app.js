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
  var chip = document.getElementById('updateChip');

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

  /* Petit bouton « 🆕 Nouveautés » dans la barre de navigation :
     intégré à la barre, il ne masque jamais le contenu. */
  function showChip(text) {
    if (!chip) return;
    if (text) chip.title = text + ' — cliquer pour actualiser';
    chip.hidden = false;
  }

  if (chip) {
    chip.addEventListener('click', function () {
      var seen = chip.getAttribute('data-latest');
      if (seen) localStorage.setItem('newsinfo.lastSeen', seen);
      location.reload();
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
          if (chip) chip.setAttribute('data-latest', stamp);
          showChip(info.titre || 'De nouvelles news sont disponibles !');
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
