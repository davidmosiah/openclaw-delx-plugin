# ClawHub Publish Support Message

Hi, I’m trying to publish a code plugin on ClawHub, but my account seems to be missing its personal publisher.

Symptoms:
- In `Settings`, saving `Display name` / `Bio` does not appear to persist correctly.
- Publishing from the UI fails with: `Personal publisher not found`.
- Publishing through the API also fails the same way.

Account:
- GitHub / ClawHub handle: `davidmosiah`

Plugin:
- repo: `davidmosiah/openclaw-delx-plugin`
- current branch: `main`

From your source code, it looks like plugin publishing resolves the default owner through the account’s personal publisher, and this account may not have been bootstrapped or linked correctly.

Could you please repair or re-bootstrap the personal publisher for `@davidmosiah`?

Thanks.
