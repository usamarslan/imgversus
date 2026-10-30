# Changelog

Every update to imgversus gets a version number and a short note here. Most updates bump the last number (1.2.1, 1.2.2, …); bigger milestones bump the middle or first one.

## 1.2.9 – 2026-10-30

- Some screenshot tools save PNGs with a .jpg name. imgversus now looks at what's actually inside the file instead of trusting the name, so a PNG stays a PNG, including when you save it back from the comparison. Files that aren't really images get turned away.

## 1.2.8 – 2026-10-30

- The example on the homepage got sharper. It now uses new screenshots captured as PNG, so there's less compression in the way of the details you're comparing.

## 1.2.7 – 2026-10-29

- New **1:1** button (or `N`): every pixel of the image lands on exactly one pixel of your screen, no scaling at all. It takes Windows/Mac display scaling into account, so it's really 1:1 even at 150% or on a Retina screen. Open a 4K screenshot fullscreen on a 4K monitor and that's exactly what you see.
- Fullscreen is actually full now. The top bar and the image pickers slide away and come back when you move the mouse to the top.
- The corner shows the current scale (like 64% or 1:1), so you always know whether you're looking at the real pixels or a scaled-down version.
- Zooming in past 1:1 goes in whole steps, 200%, 300% and so on, and shows the pixels as they are instead of smoothing them. Below 1:1 the browser's normal smoothing stays.
- The homepage has a live example now, The Witcher 3 Remastered on PS5 Pro, Performance vs Ray Tracing. Click it to see how it works.

## 1.2.6 – 2026-10-29

- In click-to-switch mode, the image name used to pop up right in the middle of the picture, on top of the very thing you're trying to look at. It now shows for a moment just above the image instead.

## 1.2.5 – 2026-10-29

- The homepage still talked about dragging a slider, which isn't the default anymore. It now says what actually happens: click to flip between images, or use the slider if you like.

## 1.2.4 – 2026-10-29

- A lot more room for images. Storage moved to Cloudflare R2, so big 4K PNGs aren't a problem anymore. Links you've already shared keep working.

## 1.2.3 – 2026-10-29

- Small one, mostly behind the scenes: I can now take a comparison down from my side, for example if someone uploads something that shouldn't be there. Nothing changes for you.

## 1.2.2 – 2026-10-29

- The title you give a comparison now shows at the top left of the link, where the imgversus name used to be.
- The hint sits at the top now, and it also tells you that you can switch between click-to-switch and the slider up there.
- Removed the swap and zoom-reset buttons from the top bar. They weren't pulling their weight; `S` and `0` on the keyboard still do the same thing.

## 1.2.1 – 2026-10-29

- Click-to-switch is now the default. Click the image to flip between the two; the slider is still right there at the top if you prefer it.
- A small hint on the image tells you what to do, and hovering the mode buttons explains what each one does.
- The homepage section now says what imgversus is for, not just why I made it.
- Shared links show a proper preview on Reddit, Discord and the like, with the title and the first image.
- Added a sitemap so search engines can find the site.

## 1.2.0 – 2026-10-29

- imgversus has its own address now: [imgversus.com](https://imgversus.com). Old imgversus.pages.dev links redirect on their own, so nothing you've already shared breaks.
- You can also reach me by email at feedback@imgversus.com. The feedback form still works too.

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
