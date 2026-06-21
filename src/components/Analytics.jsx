import { Helmet } from 'react-helmet-async'
import { TRACKING, hasGA4, hasClarity } from '../data/tracking.js'

/**
 * Injects analytics scripts ONLY when real IDs are configured in
 * src/data/tracking.js (or via env vars). With no IDs set, nothing is added,
 * so no fake/placeholder tags ever ship to production.
 */
export default function Analytics() {
  if (!hasGA4 && !hasClarity) return null

  return (
    <Helmet>
      {hasGA4 && (
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${TRACKING.ga4MeasurementId}`}
        />
      )}
      {hasGA4 && (
        <script>{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${TRACKING.ga4MeasurementId}');
        `}</script>
      )}
      {hasClarity && (
        <script>{`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${TRACKING.clarityProjectId}");
        `}</script>
      )}
    </Helmet>
  )
}
