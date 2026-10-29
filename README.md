# imgversus

A simple image comparison slider. Drop in two or more images, drag the line to see the difference, and share the link.

**→ [imgversus.pages.dev](https://imgversus.pages.dev)**

## Why I made this

I used imgsli for years, mostly for comparing game screenshots on NeoGAF and Reddit. Quality mode vs. performance mode, ray tracing on vs. off, that kind of thing. When it shut down I tried pretty much every alternative I could find, and most of them were either cluttered or a pain to use.

So I made one for myself. Drop your images in, drag the line, share the link. No accounts, no editor, no settings page.

After a while I figured other people might need it too, so here it is. If you're using it for something completely different, or there's something you wish it did, use the feedback button on the site or [open an issue](https://github.com/usamarslan/imgversus/issues). I read all of it.

## What it does

- Upload 2 to 12 images, get a short link like `imgversus.pages.dev/a/Xk3pQ9aB`
- Slider comparison, with pickers in the top corners when you have more than two images
- Click-to-switch mode if you'd rather flick between two images in place
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
