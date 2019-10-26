import Vue from 'vue';
import App from '@/App.vue';
import Buefy from 'buefy';
import 'buefy/dist/buefy.css';
import VueCompositionApi from '@vue/composition-api';

Vue.config.productionTip = false;

Vue.use(VueCompositionApi);
Vue.use(Buefy);

new Vue({
  render: (h) => h(App),
}).$mount('#app');
