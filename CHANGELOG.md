# Changelog

Every update to imgversus gets a version number and a short note here. Bug fixes bump the last number (1.0.1), new features bump the middle one (1.1.0).

## 1.1.0 – 2026-10-29

- Comparisons don't expire. Your link stays up for as long as the site is running, and the homepage says so now.
- I added simple usage counts on my side: how many comparisons get made and how often they're opened. No cookies, no third-party trackers, nothing tied to you.
- Under the hood, storage can now move to Cloudflare R2, which means room for a lot more images. Existing links keep working either way.

## 1.0.0 – 2026-10-29

First public release.

- Upload 2 to 12 images and get a short link you can share
- Slider comparison, with image pickers in the top corners when there are more than two images
- Click-to-switch mode for flicking between two images in place
- Fullscreen, mouse wheel / pinch zoom, and pixel-sharp rendering when you zoom in close
- Keyboard shortcuts: `1`–`9` and `Shift`+`1`–`9` to pick images, `S` to swap, `M` to change mode, `F` for fullscreen
- 18 languages, picked automatically from your browser
- Feedback form
