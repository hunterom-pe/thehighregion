# Images

Drop photo files here (JPG, PNG, WebP). Then edit `../images.json` and list them:

```json
{
  "photos": [
    "01.jpg",
    "02.jpg",
    { "src": "03.jpg", "caption": "Downtown, 2024" },
    "04.jpg"
  ]
}
```

Order in the array = order on the page. Every 6th photo becomes a full-bleed hero.

Recommended: export long-edge ~2000px, quality ~80%, sRGB. Keep each file under ~500KB for fast loads.
