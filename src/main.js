// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import CryptoJS from 'crypto-js'
import Global from './components/Global'
import Axios from 'axios'
import NodeRsa from 'node-rsa'

Vue.config.productionTip = false
Vue.prototype.Global = Global
Vue.prototype.Axios = Axios
Vue.prototype.NodeRsa = NodeRsa

Vue.prototype.CryptoJS = CryptoJS

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
