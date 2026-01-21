# Nav Dev Sessions Extension

Browser extension that adds session cookies to requests to `localhost`:
- `io.nais.wonderwall.session` - Employee session cookie (works on all `*.nav.no` domains)
- `sso-dev.nav.no` - End user session cookie for `dev` domains (`*.dev.nav.no`)
- `sso-nav.no` - End user session cookie for `prod` domains (`*.nav.no`, excluding `*.dev.nav.no`)

## Why make this extension?
Manually moving or copying session cookies from `dev` or `prod` to `localhost` is a hassle.
The easiest way is to change the domain of the session cookie, which moves the cookie from `*.dev.nav.no` or `*.nav.no` to `localhost`.

Moving is especially problematic because `dev`/`prod` will set a new session cookie for `*.dev.nav.no` or `*.nav.no`, and invalidate the session cookie for `localhost` the next time you interact with `dev`/`prod`.

This extension automatically adds the session cookies from `dev`/`prod` to all requests to `localhost`. You can and should have both `dev`/`prod` and `localhost` open at the same time.

## Packing

1. Install [Bun](https://bun.sh)
2. Install dependencies - `bun i`
3. Build the extension - `bun run build`
4. Pack the extension - `bun run firefox:pack`

The built and packed extension is in the `/dist` directory.
