import posthog from 'posthog-js'

// Adopt the visitor's PostHog id when they arrive from the portfolio's decorated
// "Live Demo" link. Only the anonymous browser id is carried over, never a
// Noctus user id (see the note about identify() before adding it).
const incomingId = new URLSearchParams(window.location.search).get('distinct_id')

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  defaults: '2026-05-30',
  ...(incomingId ? { bootstrap: { distinctID: incomingId } } : {}),
})
