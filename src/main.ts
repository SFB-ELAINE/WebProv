import Vue from 'vue';
import App from '@/App.vue';
import Buefy from 'buefy';
import 'buefy/dist/buefy.css';
import firebase from 'firebase/app';
import 'firebase/database';

Vue.config.productionTip = false;

Vue.use(Buefy);

firebase.initializeApp({
  apiKey: 'AIzaSyCKa8xz75zv_UMdq3lNa36JtpqOGRMS5EA',
  authDomain: 'web-provenance.firebaseapp.com',
  databaseURL: 'https://web-provenance.firebaseio.com',
  projectId: 'web-provenance',
  storageBucket: '',
  messagingSenderId: '661014668557',
  appId: '1:661014668557:web:595398a33864e4ff',
});

new Vue({
  render: (h) => h(App),
}).$mount('#app');
