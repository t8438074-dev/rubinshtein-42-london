(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const art = [
    { id: '01', file: 'artwork-01.webp', shape: 'portrait' },
    { id: '02', file: 'artwork-02.webp', shape: 'portrait' },
    { id: '03', file: 'artwork-03.webp', shape: 'portrait' },
    { id: '04', file: 'artwork-04.webp', shape: 'portrait' },
    { id: '05', file: 'artwork-05.webp', shape: 'square' },
    { id: '06', file: 'artwork-06.webp', shape: 'square' },
    { id: '07', file: 'artwork-07.webp', shape: 'landscape' },
    { id: '08', file: 'artwork-08.webp', shape: 'landscape' }
  ];

  const artPath = (item) => `assets/artworks/${item.file}`;

  const quoteOne = 'Знание, счастье и бесстрашие не ожидают нас где-то за горизонтом; они — часть непрерывного круга, который начинается прямо здесь.';
  const quoteTwo = 'Пустой ум незаменим в поиске жемчужин.';

  const sceneOrder = ['londonEntry', 'londonGallery', 'londonWindows', 'londonSquare'];
  const sceneInfo = {
    londonEntry: {
      number: '01 / 04', kicker: 'ARRIVAL · RUBINSHTEIN STREET, 42', title: 'The street begins here',
      routeTitle: 'The Arrival', routeNote: 'Адрес № 42 и первая встреча с улицей'
    },
    londonGallery: {
      number: '02 / 04', kicker: 'STOP 02 · THE GALLERY ROW', title: 'A gallery behind every window',
      routeTitle: 'The Gallery Row', routeNote: 'Дом № 42, фасады и первые работы'
    },
    londonWindows: {
      number: '03 / 04', kicker: 'STOP 03 · THE ART WINDOWS', title: 'The windows begin to tell stories',
      routeTitle: 'The Art Windows', routeNote: 'Оригинальные картины в витринах и на стенах'
    },
    londonSquare: {
      number: '04 / 04', kicker: 'STOP 04 · THE LITTLE SQUARE', title: 'A quiet ending to the walk',
      routeTitle: 'The Little Square', routeNote: 'Тихая площадь и последняя мысль маршрута'
    }
  };

  let viewer = null;
  let currentScene = 'londonEntry';
  let entered = false;
  let artworkReturnFocus = null;

  function openArtwork(item) {
    artworkReturnFocus = document.activeElement;
    $('modalImage').src = artPath(item);
    $('modalTitle').textContent = `Artwork ${item.id}`;
    $('artModal').classList.add('is-open');
    $('artModal').setAttribute('aria-hidden', 'false');
    $('closeArt').focus();
  }

  function closeArtwork() {
    $('artModal').classList.remove('is-open');
    $('artModal').setAttribute('aria-hidden', 'true');
    $('modalImage').src = '';
    if (artworkReturnFocus && typeof artworkReturnFocus.focus === 'function') artworkReturnFocus.focus();
  }

  function makeArtHotspot(item) {
    return {
      type: 'info',
      text: `Open original artwork ${item.id}`,
      cssClass: `art-hotspot-${item.shape}`, 
      createTooltipFunc: function (hotSpotDiv) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'art-hotspot-frame';
        button.setAttribute('aria-label', `Открыть оригинальную работу ${item.id}`);
        button.title = 'Открыть оригинал';

        const image = document.createElement('img');
        image.src = artPath(item);
        image.alt = `Оригинальная работа Алёны Рубинштейн, номер ${item.id}`;
        image.draggable = false;
        image.loading = 'lazy';

        const label = document.createElement('span');
        label.textContent = 'ALENA RUBINSHTEIN · ORIGINAL';
        button.append(image, label);
        button.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          openArtwork(item);
        });
        hotSpotDiv.appendChild(button);
      }
    };
  }

  function makeSignHotspot(kind, main, sub) {
    return {
      type: 'info',
      text: main,
      cssClass: kind === 'address' ? 'address-hotspot-host' : 'sign-hotspot-host',
      createTooltipFunc: function (hotSpotDiv) {
        const sign = document.createElement('div');
        sign.className = kind === 'address' ? 'street-sign address-sign' : 'street-sign';
        const title = document.createElement('span');
        title.textContent = main;
        sign.appendChild(title);
        if (sub) {
          const small = document.createElement('small');
          small.textContent = sub;
          sign.appendChild(small);
        }
        hotSpotDiv.appendChild(sign);
      }
    };
  }

  function makeQuoteHotspot(kind, quote, kicker) {
    return {
      type: 'info',
      text: quote,
      cssClass: kind === 'chalk' ? 'quote-chalk-host' : 'quote-wall-host',
      createTooltipFunc: function (hotSpotDiv) {
        const panel = document.createElement('div');
        panel.className = kind === 'chalk' ? 'quote-board quote-board-chalk' : 'quote-board quote-board-wall';

        const label = document.createElement('span');
        label.className = 'quote-kicker';
        label.textContent = kicker;

        const text = document.createElement('p');
        text.textContent = quote;

        const signature = document.createElement('small');
        signature.textContent = 'ALENA RUBINSHTEIN';
        panel.append(label, text, signature);
        hotSpotDiv.appendChild(panel);
      }
    };
  }

  function makeNavHotspot(label, target, direction) {
    return {
      type: 'info',
      text: label,
      cssClass: 'nav-hotspot-host',
      createTooltipFunc: function (hotSpotDiv) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'pano-nav-hotspot';
        button.textContent = direction === 'back' ? '←' : '→';
        button.setAttribute('aria-label', label);
        button.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          goToScene(target);
        });
        hotSpotDiv.appendChild(button);
      }
    };
  }

  // Panorama yaw/pitch positions are tied to visible windows, wall panels, and street furniture.
  const scenes = {
    londonEntry: {
      title: 'The Arrival',
      panorama: 'assets/panoramas/london-00-entry.webp',
      yaw: 0,
      pitch: 0,
      hfov: 82,
      hotSpots: [
        Object.assign(makeSignHotspot('address', '42 RUBINSHTEIN STREET', 'LONDON'), { pitch: 17, yaw: -38 }),
        Object.assign(makeSignHotspot('plaque', 'ALENA RUBINSHTEIN', 'ART GALLERY · THREE CITIES · ONE ARTIST'), { pitch: 24, yaw: 20 }),
        Object.assign(makeQuoteHotspot('wall', quoteOne, 'A NOTE FROM THE ARTIST'), { pitch: -27, yaw: -117 }),
        Object.assign(makeArtHotspot(art[0]), { pitch: 8, yaw: 69 }),
        Object.assign(makeArtHotspot(art[1]), { pitch: 8, yaw: 123 }),
        Object.assign(makeNavHotspot('Продолжить прогулку к галерее', 'londonGallery', 'forward'), { pitch: -19, yaw: 1 })
      ]
    },
    londonGallery: {
      title: 'The Gallery Row',
      panorama: 'assets/panoramas/london-01-entry.webp',
      yaw: -45,
      pitch: 1,
      hfov: 78,
      hotSpots: [
        Object.assign(makeArtHotspot(art[2]), { pitch: 28, yaw: -51 }),
        Object.assign(makeArtHotspot(art[3]), { pitch: 4, yaw: -12 }),
        Object.assign(makeArtHotspot(art[4]), { pitch: 7, yaw: 79 }),
        Object.assign(makeNavHotspot('Перейти к художественным витринам', 'londonWindows', 'forward'), { pitch: -19, yaw: 38 }),
        Object.assign(makeNavHotspot('Вернуться к началу улицы', 'londonEntry', 'back'), { pitch: -18, yaw: -142 })
      ]
    },
    londonWindows: {
      title: 'The Art Windows',
      panorama: 'assets/panoramas/london-02-gallery.webp',
      yaw: -16,
      pitch: 0,
      hfov: 80,
      hotSpots: [
        Object.assign(makeSignHotspot('plaque', 'THE CURIOUS HARE', 'BOOKS · PRINTS · OBJECTS'), { pitch: 20, yaw: -82 }),
        Object.assign(makeArtHotspot(art[5]), { pitch: 4, yaw: -83 }),
        Object.assign(makeArtHotspot(art[6]), { pitch: 5, yaw: -8 }),
        Object.assign(makeArtHotspot(art[7]), { pitch: 5, yaw: 165 }),
        Object.assign(makeQuoteHotspot('chalk', quoteTwo, 'A LINE FROM THE BOOKSHOP'), { pitch: -17, yaw: 42 }),
        Object.assign(makeNavHotspot('Дойти до маленькой площади', 'londonSquare', 'forward'), { pitch: -18, yaw: 8 }),
        Object.assign(makeNavHotspot('Вернуться к галерее', 'londonGallery', 'back'), { pitch: -18, yaw: -155 })
      ]
    },
    londonSquare: {
      title: 'The Little Square',
      panorama: 'assets/panoramas/london-03-courtyard.webp',
      yaw: 28,
      pitch: 0,
      hfov: 80,
      hotSpots: [
        Object.assign(makeSignHotspot('plaque', 'RUBINSHTEIN STREET, 42', 'THE LITTLE ART QUARTER'), { pitch: 22, yaw: 105 }),
        Object.assign(makeNavHotspot('Вернуться к художественным витринам', 'londonWindows', 'back'), { pitch: -18, yaw: -150 })
      ]
    }
  };

  function sceneIndex(sceneId) {
    return sceneOrder.indexOf(sceneId);
  }

  function updateSceneUI(sceneId) {
    currentScene = sceneId;
    const info = sceneInfo[sceneId];
    const index = sceneIndex(sceneId);
    $('progressText').textContent = info.number;
    $('progressFill').style.width = `${((index + 1) / sceneOrder.length) * 100}%`;
    $('captionKicker').textContent = info.kicker;
    $('captionTitle').textContent = info.title;
    $('prevButton').disabled = index === 0;
    $('nextButton').disabled = index === sceneOrder.length - 1;
    document.querySelectorAll('.route-step').forEach((button) => {
      const active = button.dataset.scene === sceneId;
      button.classList.toggle('is-current', active);
      if (active) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
  }

  function closeRoutePanel() {
    $('routePanel').classList.remove('is-open');
    $('routePanel').setAttribute('aria-hidden', 'true');
  }

  function goToScene(sceneId) {
    if (!viewer || !scenes[sceneId]) return;
    const target = scenes[sceneId];
    viewer.loadScene(sceneId, target.pitch, target.yaw, target.hfov || 80);
    updateSceneUI(sceneId);
    closeRoutePanel();
    if (!entered) enterWalk();
  }

  function moveScene(delta) {
    const index = sceneIndex(currentScene);
    const next = Math.max(0, Math.min(sceneOrder.length - 1, index + delta));
    if (next !== index) goToScene(sceneOrder[next]);
  }

  function enterWalk() {
    entered = true;
    $('introCard').classList.add('is-hidden');
    $('gestureHint').classList.add('is-visible');
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') {
      closeArtwork();
      closeRoutePanel();
    } else if (event.key === 'ArrowRight' && !event.repeat && !$('artModal').classList.contains('is-open')) {
      moveScene(1);
    } else if (event.key === 'ArrowLeft' && !event.repeat && !$('artModal').classList.contains('is-open')) {
      moveScene(-1);
    }
  }

  function setupControls() {
    $('enterButton').addEventListener('click', enterWalk);
    $('prevButton').addEventListener('click', () => moveScene(-1));
    $('nextButton').addEventListener('click', () => moveScene(1));
    $('mapButton').addEventListener('click', () => {
      $('routePanel').classList.add('is-open');
      $('routePanel').setAttribute('aria-hidden', 'false');
    });
    $('closeRoute').addEventListener('click', closeRoutePanel);
    $('routePanel').addEventListener('click', (event) => {
      if (event.target === $('routePanel')) closeRoutePanel();
    });
    document.querySelectorAll('.route-step').forEach((button) => {
      button.addEventListener('click', () => goToScene(button.dataset.scene));
    });
    $('closeArt').addEventListener('click', closeArtwork);
    $('modalBackdrop').addEventListener('click', closeArtwork);
    document.addEventListener('keydown', onKeyDown);
  }

  function showLoadError(message) {
    const loading = $('loadingScreen');
    loading.textContent = '';
    const mark = document.createElement('div');
    mark.className = 'loading-mark';
    mark.textContent = 'AR';
    const title = document.createElement('div');
    title.className = 'loading-title';
    title.textContent = 'THE STREET IS QUIET FOR A MOMENT';
    const subtitle = document.createElement('div');
    subtitle.className = 'loading-subtitle';
    subtitle.textContent = message;
    const retry = document.createElement('button');
    retry.className = 'primary-button';
    retry.textContent = 'Попробовать ещё раз';
    retry.addEventListener('click', () => window.location.reload());
    loading.append(mark, title, subtitle, retry);
  }

  function init() {
    setupControls();
    if (!window.pannellum) {
      showLoadError('Не удалось загрузить панорамный просмотрщик. Проверьте подключение к интернету.');
      return;
    }
    try {
      const pannellumScenes = {};
      sceneOrder.forEach((id) => {
        const scene = scenes[id];
        pannellumScenes[id] = {
          type: 'equirectangular',
          panorama: scene.panorama,
          autoLoad: true,
          pitch: scene.pitch,
          yaw: scene.yaw,
          hfov: scene.hfov || 80,
          minHfov: 55,
          maxHfov: 98,
          hotSpots: scene.hotSpots
        };
      });

      viewer = window.pannellum.viewer('panorama', {
        default: {
          firstScene: 'londonEntry',
          sceneFadeDuration: 750,
          autoLoad: true,
          showControls: false,
          showFullscreenCtrl: false,
          showZoomCtrl: false,
          mouseZoom: false,
          keyboardZoom: false,
          draggable: true,
          compass: false,
          hfov: 82,
          minHfov: 55,
          maxHfov: 98,
          friction: 0.14,
          orientationOnByDefault: false,
          hotSpotDebug: false
        },
        scenes: pannellumScenes
      });

      viewer.on('load', function () {
        $('loadingScreen').classList.add('is-hidden');
        updateSceneUI(currentScene);
      });
      viewer.on('scenechange', function (sceneId) {
        updateSceneUI(sceneId);
      });
      viewer.on('error', function () {
        showLoadError('Не удалось загрузить один из панорамных видов.');
      });
    } catch (error) {
      console.error(error);
      showLoadError('Не удалось запустить панорамную прогулку.');
    }
  }

  window.addEventListener('DOMContentLoaded', init);
})();
