import Vue from 'vue';
import App from '@/App.vue';
import Buefy from 'buefy';
import 'buefy/dist/buefy.css';
import VueCompositionApi from '@vue/composition-api';
import { Integrations } from '@sentry/tracing';
import * as Sentry from '@sentry/vue';

Sentry.init({
  Vue,
  dsn: 'https://e198b0768d3d4ee0a9ad68787f483dad@o373147.ingest.sentry.io/5595433',
  autoSessionTracking: true,
  integrations: [
    new Integrations.BrowserTracing(),
  ],

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,
});

Vue.config.productionTip = false;

Vue.use(VueCompositionApi);
Vue.use(Buefy);

new Vue({
  render: (h) => h(App),
}).$mount('#app');
