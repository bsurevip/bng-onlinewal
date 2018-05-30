<template>
  <div class="hello">
    <h1>生成钱包</h1>
    <el-form :model="ruleForm" :rules="rules" ref="ruleForm" id="newWalletForm">
      <h3>输入一个强密码（必须是8位）</h3>
      <el-form-item prop="key">
        <el-row>
          <el-col :span="20">
            <el-input class="lucencyInput" :type="inputType" v-model="ruleForm.key"></el-input>
          </el-col>
          <el-col :span="4" style="background-color: #ccc;font-size: 20px;line-height: 55px">
            <div @click="changeInputType" class="cursorPointer"><i class="el-icon-view"></i></div>
          </el-col>
        </el-row>
        <span></span>
      </el-form-item>
      <el-button type="primary" size="" @click="submitForm('ruleForm')">
        <i v-if="createWalletLoading" class="el-icon-loading"></i>
        生成钱包
      </el-button>
    </el-form>
    <div v-if="command">
      <p>
        把他下载下来并放在一个安全的地方，使用口令或者此文件，恢复此钱包
      </p>
      <a  id="createInvote" @click="dowload"  :download="fileName" >下载文件</a>
      <br />
      <p>
        把他抄下来并放在一个安全的地方，不要使用它来复制这个钱包
      </p>
      <h3>你的钱包口令</h3>
      <p style="font-size: 24px;font-weight: 700">{{ command }}</p>
      <br />
    </div>
    <h3>推荐使用客户端</h3>
    <div>
      <a href="http://m.shouji.360tpcdn.com/180412/0a7d4a834d188645715928106dee6988/org.bsure.wallet_1062.apk"><img src="../assets/androidDowload.png" alt=""></a>
      <a href="javascript:;" @click="qrcodedialogVisible = true"><img src="../assets/iosDowload.png" alt=""></a>
    </div>
    <el-dialog
      title="下载地址"
      :visible.sync="qrcodedialogVisible"
      width="30%"
      :before-close="qrcodehandleClose">
      <span><img src="../assets/iosbsurecode.png" alt=""></span>
      <span slot="footer" class="dialog-footer">
    <!--<el-button @click="qrcodedialogVisible = false">取 消</el-button>-->
    <el-button type="primary" @click="qrcodedialogVisible = false">确 定</el-button>
  </span>
    </el-dialog>
    <el-dialog
      title="提示"
      :visible.sync="dialogVisible"
      width="30%"
      :before-close="handleClose">
      <span>生成钱包成功</span>
      <span slot="footer" class="dialog-footer">
    <el-button @click="dialogVisible = false">取 消</el-button>
    <el-button type="primary" @click="dialogVisible = false">确 定</el-button>
  </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'NewWallet',
  data () {
    return {
      inputType: 'password',
      dialogVisible: false,
      qrcodedialogVisible: false,
      createWalletLoading: false,
      cryptoMassge: {}, // 加密的数据
      fileName: '', // 生成文件的名字
      command: '', // 钱包口令
      ruleForm: {
        key: ''
      },
      rules: {
        key: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 8, max: 8, message: '必须是8位', trigger: 'blur' }
        ]
      }
    }
  },
  methods: {
    handleClose (done) {
      this.$confirm('确认关闭？')
        .then(_ => {
          done()
        })
        .catch(_ => {})
    },
    qrcodehandleClose (done) {
      this.$confirm('确认关闭？')
        .then(_ => {
          done()
        })
        .catch(_ => {})
    },
    // 生成钱包
    submitForm (formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          this.cryptoMassge = createWallet()
          this.dialogVisible = true
          this.Global.walletAddress = this.cryptoMassge.address
          this.Global.definition = this.cryptoMassge.definition
          this.Global.mnemonic_phrase = this.cryptoMassge.mnemonic_phrase
          this.Global.walletId = this.cryptoMassge.wallet
          this.command = this.cryptoMassge.mnemonic_phrase
          this.crypto(this.cryptoMassge, this.ruleForm.key)
          this.createWalletLoading = !this.createWalletLoading
        } else {
          console.log('error submit!!')
          return false
        }
      })
    },
    // 加密
    crypto (cryptoMassge, cryptokey) {
      this.encryptData = this.CryptoJS.AES.encrypt(JSON.stringify(cryptoMassge), this.CryptoJS.enc.Utf8.parse(cryptokey), {
        mode: this.CryptoJS.mode.ECB,
        padding: this.CryptoJS.pad.Pkcs7
      }).ciphertext.toString()
      this.fileName = 'BsureWalletBackup' + new Date().getTime() + '.encrypted'
      this.createWalletLoading = !this.createWalletLoading
    },
    changeInputType () {
      this.inputType = (this.inputType === 'password' ? 'text' : 'password')
    },
    // 下载文件写入内容
    dowload () {
      let isIE = (navigator.userAgent.indexOf('MSIE') >= 0)
      if (isIE) {
        var strHTML = this.encryptData.toString()
        var winSave = window.open()
        winSave.document.open('text', 'utf-8')
        winSave.document.write(strHTML)
        winSave.document.execCommand('SaveAs', true, 'code.txt')
        winSave.close()
      } else {
        var elHtml = this.encryptData.toString()
        var mimeType = 'text/plain'
        document.getElementById('createInvote').setAttribute('href', 'data:' + mimeType + ';charset=utf-8,' + encodeURIComponent(elHtml))
      }
    }
    // createWallet () {
    //
    // }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1, h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}

</style>
