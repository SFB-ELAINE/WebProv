import Vue from 'vue';
import App from '@/App.vue';
import Buefy from 'buefy';
import 'buefy/dist/buefy.css';
import { plugin } from 'vue-function-api';

Vue.config.productionTip = false;

Vue.use(plugin);
Vue.use(Buefy);

new Vue({
  render: (h) => h(App),
}).$mount('#app');
