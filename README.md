# mj-vvs-web

Tre fristående designförslag för MJ Rörteknik AB (från Figma): **Ljus**, **Mörk** och **Blå**.
Byt design med menyn längst ned – varje byte laddar sidan på nytt från början.

Starta lokalt:

```
npx serve -l 5173 .
```

Öppna sedan http://localhost:5173 (eller direkt `#ljus`, `#mork`, `#bla`).

- `index.html` – alla tre sidorna som `<template>` + ikoner
- `css/base.css` – gemensam grund, animationer och menyn
- `css/ljus.css`, `css/mork.css`, `css/bla.css` – respektive design
- `js/app.js` – sidbyte, scroll-animationer, FAQ och formulär (testläge, inget skickas)
