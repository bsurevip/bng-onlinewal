import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import Router from 'vue-router'
import NewWallet from '@/components/NewWallet'
import importFile from '@/components/importFile'
import transferAccounts from '@/components/transferAccounts'
import collection from '@/components/collection'
import walletInfo from '@/components/walletInfo'
import tradingRecord from '@/components/tradingRecord'
// import aaa from '@/components/aaa'

Vue.use(Router)
Vue.use(ElementUI)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'NewWallet',
      component: NewWallet
    },
    {
      path: '/NewWallet',
      name: 'NewWallet',
      component: NewWallet
    }, {
      path: '/importFile',
      name: 'importFile',
      component: importFile
    }, {
      path: '/transferAccounts',
      name: 'collection',
      component: transferAccounts
    }, {
      path: '/collection',
      name: 'collection',
      component: collection
    }, {
      path: '/walletInfo',
      name: 'walletInfo',
      component: walletInfo
    }, {
      path: '/tradingRecord',
      name: 'tradingRecord',
      component: tradingRecord
    }, {
      path: '*',
      redirect: NewWallet
    }
  ]
})
