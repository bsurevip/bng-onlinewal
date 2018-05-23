<template>
    <div>
      <div v-if="walletAddrewy">
        <div v-show="qrcodeimgStr">
          <h2>收款地址</h2>
          <div id="qrcodeimg"></div>
          <div v-if="importMoney">
            <p>当前金额：<span>{{collectionForm.money}}</span><a @click="goImportMoney">更改金额</a></p>
          </div>
          <div v-else><a @click="goImportMoney">去设置金额</a></div>
        </div>
        <div v-bind:hidden="qrcodeimgStr">
          <el-form :model="collectionForm" :rules="rules" ref="collectionForm" id="newWalletForm">
            <h1>请输入任意金额</h1>
            <el-form-item prop="money">
              <el-input class="moneyClass" type="text" v-model="collectionForm.money"></el-input>
            </el-form-item>
            <el-button type="primary" size=" mini" @click="submitQrcode('collectionForm')">
              <!--<i class="el-icon-loading"></i>-->
              确定
            </el-button>
            <div class="qrcodeBtn"><a @click="noImportMoney">不设定金额直接生产地址</a></div>
          </el-form>
        </div>
      </div>
      <div v-else>
        <div>请导入钱包文件</div>
      </div>
    </div>
</template>
<script>
export default {
  name: 'collection',
  data () {
    return {
      walletAddrewy: false,
      qrcodeimgStr: false,
      importMoney: false,
      collectionForm: {
        money: ''
      },
      rules: {
        money: [
          { required: true, message: '请输入金额', trigger: 'blur' }
        ]
      }
    }
  },
  mounted () {
    this.aa()
    // this.qrcodeImg()
    // if (this.Global.walletAddress) {
    //   this.walletAddrewy = this.Global.walletAddress
    //   console.log(this.Global)
    //
    // }
  },
  methods: {
    aa () {
      console.log(this.Global.walletAddress)
      if (this.Global.walletAddress) {
        this.walletAddrewy = true
      } else {
        this.walletAddrewy = false
      }
    },
    submitQrcode (formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          this.importMoney = true
          this.qrcodeImg(this.collectionForm.money)
        } else {
          console.log('error submit!!')
          return false
        }
      })
    },
    noImportMoney () {
      this.qrcodeImg()
    },
    qrcodeImg (amount) {
      console.log(this.Global.walletAddress)
      this.walletAddrewy = this.Global.walletAddress
      let qrcodeText
      if (amount) {
        qrcodeText = 'byteball:' + this.Global.walletAddress + '?amount=' + amount
      } else {
        qrcodeText = 'byteball:' + this.Global.walletAddress
      }
      if (this.Global.walletAddress) {
        $('#qrcodeimg').html('')
        $('#qrcodeimg').qrcode({
          text: qrcodeText,
          width: 200,
          height: 200,
          render: 'canvas'
        })
        this.qrcodeimgStr = true
      } else {
        return false
      }
    },
    goImportMoney () {
      this.importMoney = false
      this.qrcodeimgStr = false
    }
  }
}
</script>

<style scoped>
.qrcodeBtn {
  margin-top: 100px;
}
a:hover{
  cursor: pointer;
  display: inline-block;
  border-bottom: 1px solid #000;
}
#newWalletForm {
  width: 400px;
  margin: auto;
}
</style>
