import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import Buefy from 'buefy';
import 'buefy/dist/buefy.css';
import { plugin } from 'vue-function-api';


Vue.config.productionTip = false;

Vue.use(Buefy);
Vue.use(plugin);

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');
