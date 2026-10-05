# rinaldo-caporal-landing

Site: https://www.rinaldocaporal.com.br (GitHub Pages, deploy automático a cada push na `main`).

## Estrutura

- `index.html` — conteúdo e textos
- `styles.css` — layout mobile-first (breakpoints 640px e 960px)
- `script.js` — menu, barra fixa do celular, carrosséis, abas dos planos, eventos do Analytics
- `img/` — imagens otimizadas em WebP (`nome-400.webp`, `nome-640.webp`…), favicons e `og-image.jpg` (prévia do link no WhatsApp)

## Imagens

Nunca subir PNG/JPG direto da câmera. Exporte em WebP com largura máxima de ~1200px
(fotos de atletas: 400px e 640px, proporção 4:5). Uma foto deve ter < 80 KB.

## Testar localmente

```bash
python3 -m http.server 8765
```

Abra http://localhost:8765 — o Google Analytics fica desligado em localhost.
