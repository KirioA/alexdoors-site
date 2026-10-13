# AlexDoors — сайт мастера по установке дверей

Прототип одностраничного сайта: 3D-интро (дверь открывается при прокрутке), типы дверей, работы с галереей, цены, форма.

- `index.html` — разметка и стили
- `js/door.js` — 3D-сцена (three.js r186), `js/door.min.js` — сборка
- `js/main.js` — данные, лайтбокс, Lenis + GSAP ScrollTrigger

Сборка 3D после правок `door.js`:

```
npx esbuild@0.25 js/door.js --bundle --minify --format=esm --outfile=js/door.min.js --alias:three=./vendor/three/three.module.js
```

Фото работ — из Instagram мастера [@alexdoors3214](https://www.instagram.com/alexdoors3214/).
