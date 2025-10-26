import React from 'react'

// Minimal placeholder page kept so Next doesn't attempt to prerender the admin _app content
// This file previously rendered AdminLayout (client-only) and caused prerender-time errors.
export default function AdminAppPlaceholder() {
  return (
    <div style={{padding:20}}>
      <h1>Admin entry</h1>
      <p>This is a minimal placeholder to satisfy Next.js prerendering. The real admin UI lives under /admin pages.</p>
    </div>
  )
}

