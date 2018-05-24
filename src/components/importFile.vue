<template>
    <div v-if="aa">
      <!--选取文件导入-->
      <div>
        <div>
          <h1>选取导入文件</h1>
          <input type="file" ref="file" accept=".encrypted" :v-model="inputFile" @change="selectFile">
        </div>
        <div v-if="encryptData">
          <el-form :model="ruleForm" :rules="rules" ref="ruleForm" id="newWalletForm">
            <h3>输入一个强密码（必须8位）</h3>
            <el-form-item prop="decryptkey">
              <el-row>
                <el-col :span="20">
                  <el-input class="lucencyInput" :type="inputType" v-model="ruleForm.decryptkey"></el-input>
                </el-col>
                <el-col :span="4" style="background-color: #ccc;font-size: 20px;line-height: 55px">
                  <div @click="changeInputType" class="cursorPointer"><i class="el-icon-view"></i></div>
                </el-col>
              </el-row>
              <span></span>
            </el-form-item>
            <el-button type="primary" size=" mini" @click="submitForm('ruleForm')">
              <i v-if="createWalletLoading" class="el-icon-loading"></i>
              解密
            </el-button>
          </el-form>
        </div>
      </div>
      <!--输入口令导入-->
      <div style="margin-top: 60px">
        <h1>使用口令恢复钱包</h1>
        <div>
          <el-form :model="ruleForm1" :rules="rules1" ref="ruleForm1">
            <h3></h3>
            <el-form-item prop="decryptkey">
              <el-row>
                <el-col :span="24">
                  <el-input class="lucencyInput" type="text" v-model="ruleForm1.decryptkey"></el-input>
                </el-col>
              </el-row>
              <span></span>
            </el-form-item>
            <el-button type="primary" size=" mini" @click="submitForm1('ruleForm1')">
              <i v-if="commandWalletLoading" class="el-icon-loading"></i>
              解密
            </el-button>
          </el-form>
        </div>
      </div>
      <el-dialog
        title="提示"
        :visible.sync="dialogVisible"
        width="30%"
        :before-close="handleClose">
        <span>解密成功</span>
        <span slot="footer" class="dialog-footer">
    <el-button @click="dialogVisible = false">取 消</el-button>
    <el-button type="primary" @click="init()">确 定</el-button>
  </span>
      </el-dialog>
    </div>
</template>

<script>
export default {
  name: 'importFile',
  data () {
    return {
      encryptData: '', // 解密的数据
      inputType: 'password',
      createWalletLoading: false,
      dialogVisible: false,
      commandWalletLoading: false,
      aa: true,
      inputFile: '',
      ruleForm: {
        decryptkey: ''
      },
      rules: {
        decryptkey: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 8, max: 8, message: '必须是8位', trigger: 'blur' }
        ]
      },
      ruleForm1: {
        decryptkey: ''
      },
      rules1: {
        decryptkey: [
          { required: true, message: '请输入口令', trigger: 'blur' },
        ]
      }
    }
  },
  methods: {
    init () {
      this.aa = false
      this.inputFile = ''
      this.ruleForm1.decryptkey = ''
      this.ruleForm.decryptkey = ''
      this.encryptData = ''
      this.$nextTick(() => (this.aa = true))
      this.dialogVisible = false
    },
    handleClose (done) {
      this.$confirm('确认关闭？')
        .then(_ => {
          done()
          this.init()
        })
        .catch(_ => {})
    },
    submitForm1 (formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          // 口令恢复
          try {
            let command = createWallet(this.ruleForm1.decryptkey)
            this.Global.walletAddress = command.address
            this.Global.definition = command.definition
            this.Global.mnemonic_phrase = command.mnemonic_phrase
            this.Global.walletId = command.wallet
            this.dialogVisible = true
          } catch (e) {
            alert('口令不正确，请输入正确的口令')
          }
        } else {
          console.log('error submit!!')
          return false
        }
      })
    },
    submitForm (formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          this.decrypt()
          this.createWalletLoading = !this.createWalletLoading
        } else {
          console.log('error submit!!')
          return false
        }
      })
    },
    // 对文件解密
    decrypt () {
      let encryptedHexStr = this.CryptoJS.enc.Hex.parse(this.encryptData)
      // console.log(this.CryptoJS.enc.Base64.stringify(encryptedHexStr))
      // let decrypt = this.CryptoJS.AES.decrypt(this.CryptoJS.enc.Base64.stringify(encryptedHexStr), this.CryptoJS.enc.Utf8.parse(JSON.stringify(this.ruleForm.decryptkey)), {
      //   mode: this.CryptoJS.mode.ECB,
      //   padding: this.CryptoJS.pad.Pkcs7
      // })
      let decrypt = this.CryptoJS.AES.decrypt(this.CryptoJS.enc.Base64.stringify(encryptedHexStr), this.CryptoJS.enc.Utf8.parse(this.ruleForm.decryptkey), {
        mode: this.CryptoJS.mode.ECB,
        padding: this.CryptoJS.pad.Pkcs7
      })
      try {
        // console.log(decrypt)
        let decryptedStr = JSON.parse(decrypt.toString(this.CryptoJS.enc.Utf8))
        // console.log('value: ' + decryptedStr)
        this.Global.walletAddress = decryptedStr.address
        this.Global.definition = decryptedStr.definition
        this.Global.mnemonic_phrase = decryptedStr.mnemonic_phrase
        this.Global.walletId = decryptedStr.wallet
        console.log(decryptedStr)
        this.dialogVisible = true
      } catch (e) {
        // console.log(e)
        // console.log()
      }
      this.createWalletLoading = !this.createWalletLoading
    },
    // 选择钱包 读取内容 解密
    selectFile () {
      let _this = this
      let files = this.$refs.file.files
      let reader = new FileReader() // 新建一个FileReader
      reader.readAsText(files[0], 'UTF-8') // 读取文件
      reader.onload = function (evt) { // 读取完文件之后会回来这里
        _this.encryptData = evt.target.result // 读取文件内容
        // _this.decrypt()
      }
    },
    changeInputType () {
      this.inputType = (this.inputType === 'password' ? 'text' : 'password')
    }
  }
}
</script>

<style scoped>

</style>
