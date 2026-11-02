# Registration-local identity and retry handling

Each plugin registration captures its normalized endpoint/agent configuration and owns its session/token. Register a fresh instance to change endpoint or identity; mutation of api.config after registration does not move existing credentials to another host. Calls within a registration reuse identity/session. Concurrent initial registration is single-flight per instance, never globally.

Retry after HTTP401 or session-not-found remaps tool arguments after registration, keeping nested session_id and envelope consistent. Retry remains bounded to one attempt. Synthetic mocked-fetch regressions exercise two hosts, two identities on a shared host, config mutation, concurrent initial calls, both retry paths and recovery after registration failure. No hosted endpoint, real token, customer data or payment is used.

This is not a redesign of remote authorization or a hosted-backend audit. Existing redirect/TLS/response-size behavior is unchanged. Concurrent session closure/token rotation across already active calls is not claimed to be globally serialized. No npm release included.
