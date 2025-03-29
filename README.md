# Nav dev sessions extension

Browser extension to automatically copy session cookies (`io.nais.wonderwall.session` and `sso-dev.nav.no`) from `*.dev.nav.no` to `localhost`.

## Motivation
Getting a session cookie from `dev` to `localhost` is tedious, error-prone and brittle.
The easiest way is to change the domain for the session cookie, which moves the cookie from `*.dev.nav.no` to `localhost`.
If you interact with `dev` after this, `dev` will set a new session cookie for `*.dev.nav.no`, invalidating the session cookie for `localhost`.
