# Regents Club Animata Pipeline

This folder contains the project-specific pipeline for rebuilding the `regents-club` collection from the Regent shader catalog.

What it does:
- plans all 1,998 editions with deterministic shader families and unique parameter sets
- renders looping MP4 files plus PNG poster frames
- builds a fixed token card manifest for the hosted OpenSea detail pages
- renders portrait token card PNGs for OpenSea grid cards
- builds the OpenSea bulk upload package (`Media/` plus `metadata-file.csv`)
- builds per-token metadata JSON files that point to the hosted card route
- uploads rendered files and metadata through the Lighthouse SDK when you provide an API key

Defaults locked for this collection:
- `1,998` total items
- `1,958` avatar items across 15 active avatar shader families
- `40` background items across `centrifuge` and `cubic`
- `Shard (Inert)`, `Buffer`, and `Bitmap` are currently excluded from the active collection mix
- `Radiant 2` is the most common family at `173`
- `Singularity` is the rarest family at `43`
- item names use `Regents Club #<tokenID>`
- metadata links point to `https://regents.sh/services`
- render output is `1024x1024`, `24 fps`, with loop length chosen per shader family instead of one fixed MP4 duration
- token card output is `1536x2048` and serves:
  - `image` from `/images/animata/cards/<token>.png`
  - `animation_url` from `/cards/regents-club/<token>`

## Commands

Create the edition plan:

```bash
node --experimental-strip-types shaders/animata/animata.ts plan
```

Render one test item:

```bash
node --experimental-strip-types shaders/animata/animata.ts render-one --token-id 1
```

Render one sample per shader family:

```bash
node --experimental-strip-types shaders/animata/animata.ts render-family-samples
```

Run the long render for the full collection, grouped into family folders under `out/media`:

```bash
node --experimental-strip-types shaders/animata/animata.ts render-all-families \
  --plan ./shaders/animata/out/plan.json \
  --out-dir ./shaders/animata/out/media \
  --workers 4 \
  --skip-existing
```

This writes files like:
- `shaders/animata/out/media/radiant-2/1.mp4`
- `shaders/animata/out/media/cubic/2.mp4`

This is the main command to generate all `1,998` MP4 files in the grouped family layout.

For a smaller test pass, you can limit it to specific shader IDs or a smaller count per family:

```bash
node --experimental-strip-types shaders/animata/animata.ts render-all-families \
  --families radiant2,cubic \
  --limit-per-family 1 \
  --workers 2
```

Render the full collection in plain token batches:

```bash
node --experimental-strip-types shaders/animata/animata.ts render-range --start 1 --end 1998 \
  --workers 4 \
  --skip-existing
```

Build the hosted token card manifest that the web route and metadata step both use:

```bash
node --experimental-strip-types shaders/animata/animata.ts build-card-manifest \
  --plan ./shaders/animata/out/plan.json \
  --out ./priv/static/animata/token-card-manifest.json
```

Render portrait token card PNGs from that manifest:

```bash
node --experimental-strip-types shaders/animata/animata.ts render-card-images \
  --card-manifest ./priv/static/animata/token-card-manifest.json \
  --static-root ./priv/static \
  --start 1 --end 25 \
  --workers 4 \
  --skip-existing
```

Build the OpenSea drop package from the rendered card images:

```bash
node --experimental-strip-types shaders/animata/animata.ts build-drop \
  --plan ./shaders/animata/out/plan.json \
  --card-manifest ./priv/static/animata/token-card-manifest.json \
  --static-root ./priv/static
```

Build token metadata that points to the hosted card image and hosted interactive page:

```bash
node --experimental-strip-types shaders/animata/animata.ts build-metadata \
  --plan ./shaders/animata/out/plan.json \
  --card-manifest ./priv/static/animata/token-card-manifest.json \
  --site-url https://regents.sh \
  --out-dir ./shaders/animata/out/metadata
```

Ask OpenSea to refresh tokens after the hosted images and metadata are live:

```bash
OPENSEA_API_KEY=... \
node --experimental-strip-types shaders/animata/animata.ts refresh-opensea \
  --card-manifest ./priv/static/animata/token-card-manifest.json \
  --start 1 --end 25
```

Upload metadata JSON files to Lighthouse if you still want IPFS-hosted metadata envelopes:

```bash
LIGHTHOUSE_API_KEY=... \
node --experimental-strip-types shaders/animata/animata.ts upload-lighthouse \
  --kind metadata \
  --input ./shaders/animata/out/metadata/metadata-manifest.json \
  --out ./shaders/animata/out/metadata-uris.json
```

## Notes

- The media and metadata upload steps expect `@lighthouse-web3/sdk` to be installed in the Node environment where you run them.
- The renderer expects Chrome or Chromium to be available. It will first look at `REGENT_CHROME_EXECUTABLE`, then common macOS and Linux install paths.
- The hosted OpenSea flow now uses the portrait token card PNG for `image` and the hosted Regents route for `animation_url`.
- The raw looping MP4 render is still available for archival or non-OpenSea use, but it is no longer the primary OpenSea detail surface.
- `--workers` lets one command run a small internal worker pool instead of forcing you to split the work by hand.
- `--skip-existing` reuses already-finished PNG and MP4 outputs when those files are already present in the target output path.
