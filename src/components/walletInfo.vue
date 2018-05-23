<template>
    <div>
      <div v-show="!isWalletInfo">
        您未导入任何钱包，请导入钱包，才可以查询钱包信息
      </div>
      <div  v-show="isWalletInfo">
        <table style="margin: auto;text-align: left">
          <tr>
            <th>钱包ID：</th>
            <td>{{this.Global.walletId}}</td>
          </tr>
          <tr>
            <th>钱包地址：</th>
            <td>{{this.Global.walletAddress}}</td>
          </tr>
          <tr>
            <th>余额：</th>
            <td>{{this.bytes}}</td>
          </tr>
          <tr>
            <th>公钥：</th>
            <td>{{this.Global.definition[1] ? this.Global.definition[1].pubkey : '' }}</td>
          </tr>
        </table>
      </div>
    </div>
</template>

<script>
export default {
  name: 'wallet-info',
  data () {
    return {
      isWalletInfo: false,
      activeNames: ['1'],
      bytes: 0
    }
  },
  mounted () {
    this.init()
  },
  methods: {
    handleChange (val) {
      console.log(val)
    },
    init () {
      if (this.Global.walletAddress) {
        console.log(this.Global.walletAddress)
        this.isWalletInfo = true
      } else {
        this.isWalletInfo = false
      }
      let _this = this
      this.Axios.post(this.Global.baseUrl + 'addressInfo', {address: this.Global.walletAddress}).then(function (response) {
        _this.bytes = response.data.objBalance.bytes
        console.log(response)
      }).catch(function (error) {
        console.log(error)
        console.log('错误')
      })
    }
  }
}
</script>

<style scoped>
</style>
