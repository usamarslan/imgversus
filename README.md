# imgversus

A simple image comparison tool. Drop in two or more images, click to flip between them or drag a slider, and share the link.

**→ [imgversus.com](https://imgversus.com)**

## What it's for

imgversus stacks two or more images on top of each other so you can see exactly what changed. Click the image to flip between them, or drag a line across. It works well for game graphics comparisons, before/after edits, photo processing, design revisions, anything where the difference is in the details.

I built it after imgsli shut down. I used it for years to compare game screenshots on NeoGAF and Reddit (quality vs. performance mode, ray tracing on vs. off), and when it was gone, every alternative I tried was either cluttered or a pain to use. So I made one for myself: drop your images in, share the link. No accounts, no editor, no settings page.

After a while I figured other people might need it too, so here it is. If you're using it for something completely different, or there's something you wish it did, use the feedback button on the site or [open an issue](https://github.com/usamarslan/imgversus/issues). I read all of it.

## What it does

- Upload 2 to 12 images, get a short link like `imgversus.com/a/Xk3pQ9aB`
- Click-to-switch (the default): click the image to flip between two images in place
- Slider mode: drag a line across to reveal one image over the other
- Image pickers in the top corners when you have more than two images
- Fullscreen, zoom with the mouse wheel or pinch, pixel-sharp when you zoom in close
- Images are stored as you uploaded them, no recompression
- Works on phones
- 18 languages, picked from your browser automatically

### Keyboard shortcuts

| Key | Does |
|---|---|
| `←` `→` | Move the slider (hold `Shift` for bigger steps) |
| `1`–`9` | Pick the right image |
| `Shift` + `1`–`9` | Pick the left image |
| `S` | Swap left and right |
| `M` | Switch between slider and click-to-switch |
| `Space` | Flip images in click-to-switch mode |
| `F` | Fullscreen |
| `0` | Reset zoom |

## Do links expire?

No. A comparison stays up for as long as the site is running.

## Privacy

The site counts uploads and link views, along with the visitor's country as Cloudflare reports it, so I can tell whether anyone's actually using it. There are no cookies, no tracking scripts and nothing personal. The code is open, so you can check exactly what gets recorded in [`lib/shared.js`](lib/shared.js). The numbers themselves stay private in my Cloudflare account.

## Running it yourself

It's a static page plus a few Cloudflare Pages Functions, with images stored in Cloudflare KV. Everything fits in Cloudflare's free tier.

```bash
npm install
npm run dev        # http://localhost:8788
```

To deploy to your own Cloudflare account, see the setup steps in [docs/KURULUM.md](docs/KURULUM.md) (in Turkish), or in short:

```bash
npx wrangler login
npx wrangler kv namespace create IMAGES   # put the id in wrangler.toml
npm run deploy
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md), or the version number at the bottom of the site.

## Support

If imgversus saves you some time, you can [sponsor it on GitHub](https://github.com/sponsors/usamarslan). Totally optional.
