<template>
  <div id="app">
    <el-container>
      <el-header center>
        <el-menu :default-active="activeIndex" class="el-menu-demo" mode="horizontal" @select="handleSelect">
          <el-menu-item index="1">创建钱包</el-menu-item>
          <el-menu-item index="2">导入</el-menu-item>
          <el-menu-item index="3">转账</el-menu-item>
          <el-menu-item index="4">收款</el-menu-item>
          <el-menu-item index="5">钱包信息</el-menu-item>
          <el-menu-item index="6">交易记录</el-menu-item>
        </el-menu>
        <div class="line"></div>
      </el-header>
      <el-main>
       <!--<keep-alive include="">-->
         <router-view />
       <!--</keep-alive>-->
      </el-main>
    </el-container>
  </div>
</template>

<script>
export default {
  name: 'App',
  provide () {
    return {
      reload: this.reload
    }
  },
  data () {
    return {
      activeIndex: '1',
      isRouterAlive: true
    }
  },
  mounted () {
    let headerSelect = ['NewWallet', 'importFile', 'transferAccounts', 'collection', 'walletInfo', 'tradingRecord']
    for (let i = 0; i < headerSelect.length; i++) {
      if (this.$route.path.indexOf(headerSelect[i]) !== -1) {
        this.activeIndex = JSON.stringify((i + 1))
      } else {}
    }
  },
  methods: {
    handleSelect (key, keyPath) {
      let handleSelectData = ['NewWallet', 'importFile', 'transferAccounts', 'collection', 'walletInfo', 'tradingRecord']
      switch (handleSelectData[key - 1]) {
        case 'NewWallet':
          this.$router.push({path: '/NewWallet'})
          break
        case 'importFile':
          this.$router.push({path: '/importFile'})
          break
        case 'transferAccounts':
          this.$router.push({path: '/transferAccounts'})
          break
        case 'collection':
          this.$router.push({path: '/collection'})
          break
        case 'walletInfo':
          this.$router.push({path: '/walletInfo'})
          break
        case 'tradingRecord':
          this.$router.push({path: '/tradingRecord'})
          break
      }
    },
    reload () {
      this.isRouterAlive = false
      this.$nextTick(() => (this.isRouterAlive = true))
    }
  }
}
</script>

<style>
body {
  margin: 0;
}
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  min-width: 700px;
}
.cursorPointer {
  cursor: pointer;
}
.el-menu--horizontal>.el-menu-item.is-active {
  color: #409EFF !important;
}
.newWalletForm .el-form-item__content {
  line-height: 55px;
  height: 55px;
}
.lucencyInput .el-input__inner {
  height: 55px !important;
  border-radius: 0 !important;
}
.el-menu-demo {
  display: inline-block;
}
</style>
