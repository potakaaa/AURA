import { Redirect, type Href } from 'expo-router';

export default function IndexRedirect() {
  // #region agent log
  fetch('http://127.0.0.1:7302/ingest/54b210d0-7789-4279-b43b-22f94e2db37e', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '3e67de' },
    body: JSON.stringify({
      sessionId: '3e67de',
      runId: 'android-white-screen',
      hypothesisId: 'H3',
      location: 'app/index.tsx:4',
      message: 'Index route redirect rendering',
      data: { targetRoute: '/(tabs)' },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  return <Redirect href={'/(tabs)' as Href} />;
}
