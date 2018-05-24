<template>
  <div v-if="transferInit">
    <div v-if="this.Global.walletAddress">
      <el-form :model="dynamicValidateForm" ref="dynamicValidateForm" label-width="100px" class="demo-dynamic">
        <el-row v-for="(domain, index) in   dynamicValidateForm.domains" :key="index">
          <el-col :span="10">
            <el-form-item
              :prop="'domains.' + index + '.address'"
              :label="'地址名' + index"
              :rules="[
      { required: true, message: '请输入转账地址', trigger: 'blur' },
    ]"
            >
              <el-input v-model="domain.address"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="10">
            <el-form-item
              :prop="'domains.' + index + '.amount'"
              label="金额"
              :rules="[
      { required: true, message: '请输入转账金额', trigger: 'blur' },
    ]"
            >
              <el-input v-model="domain.amount"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="4" v-if="(index!==0)">
            <el-button @click.prevent="removeDomain(domain)">删除</el-button>
          </el-col>
        </el-row>
        <el-form-item>
          <el-button type="primary" @click="submitForm('dynamicValidateForm')">提交</el-button>
          <el-button @click="addDomain">新增地址</el-button>
          <el-button @click="resetForm('dynamicValidateForm')">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div v-else>
      您未导入任何钱包，请导入钱包，才可以转账
    </div>
    <el-dialog
      title="提示"
      :visible.sync="dialogVisible"
      width="30%"
      :before-close="handleClose">
      <span v-if="transferAccounts">{{massge}}</span>
      <span v-else>{{massge}}</span>
      <span slot="footer" class="dialog-footer">
    <!--<el-button @click="dialogVisible = false">取 消</el-button>-->
    <el-button type="primary" @click="transferAccountsInit">确 定</el-button>
  </span>
    </el-dialog>
  </div>
</template>
<script>
export default {
  name: 'transferAccounts',
  data () {
    return {
      transferAccounts: true,
      dialogVisible: false,
      transferInit: true,
      massge: '转账成功',
      transferAccountsData: {},
      dynamicValidateForm: {
        domains: [{
          address: '',
          amount: 0
        }]
      }
    }
  },
  mounted () {
    this.init()
  },
  methods: {
    transferAccountsInit () {
      this.transferInit = false
      this.dynamicValidateForm = {
        domains: [{
          address: '',
          amount: 0
        }]
      }
      this.$nextTick(() => (this.transferInit = true))
      this.dialogVisible = false
    },
    handleClose (done) {
      this.$confirm('确认关闭？')
        .then(_ => {
          done()
          this.transferAccountsInit()
        })
        .catch(_ => {})
    },
    init () {
      let signData = JSON.stringify(signWithLocalPrivateKey(this.Global.mnemonic_phrase, '', 0, 0, 0))
      let key = new this.NodeRsa('-----BEGIN PUBLIC KEY-----\n' +
        'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDAQampzk/N09gi4fvcpSawObe9\n' +
        'bPwaNCJvuK6yDvrgG6ipnc+yR5MRY2MTexIx4mS20pRlEmYEawukdVr8Ce9I8s2Z\n' +
        'ojLlAYih1Kth0pwlOFPUwHzCEWiNSkDHGVDfhiP/HS8IsA3tOWrESt0j3MVQ5wYf\n' +
        'WR40B7o+DKNz9fc+0QIDAQAB\n' +
        '-----END PUBLIC KEY-----')
      key.setOptions({encryptionScheme: 'pkcs1'})
      for (let i = 0; i < this.dynamicValidateForm.domains.length; i++) {
        this.dynamicValidateForm.domains[i].amount = parseInt(this.dynamicValidateForm.domains[i].amount)
      }
      this.transferAccountsData = {
        sign: signData,
        definition: this.Global.definition,
        sendto: this.dynamicValidateForm.domains,
        address: this.Global.walletAddress
      }
      return key.encrypt(JSON.stringify(this.transferAccountsData), 'base64')
    },

    submitForm (formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          let _this = this
          this.Axios.post(this.Global.baseUrl + 'pay',
            {data: _this.init()}
          ).then(function (response) {
            console.log(response)
            _this.massge = '转账成功'
            console.log('转账成功')
            _this.dialogVisible = true
            _this.transferAccounts = true
          }).catch(function (error) {
            console.log(error.response.data.err)
            _this.massge = error.response.data.err
            _this.dialogVisible = true
            _this.transferAccounts = false
            console.log('转账失败')
          })
          // alert('submit!')
        } else {
          console.log('error submit!!')
          return false
        }
      })
    },
    resetForm (formName) {
      this.$refs[formName].resetFields()
    },
    removeDomain (item) {
      var index = this.dynamicValidateForm.domains.indexOf(item)
      if (index !== -1) {
        this.dynamicValidateForm.domains.splice(index, 1)
      }
    },
    addDomain () {
      this.dynamicValidateForm.domains.push({
        value: '',
        money: '',
        key: Date.now()
      })
    }
  }
}
</script>
<!--<template>-->
  <!--<div>-->
    <!--转账-->
  <!--</div>-->
<!--</template>-->

<!--<script>-->
<!--export default {-->
  <!--name: 'transferccounts',-->
  <!--data () {-->
    <!--return {}-->
  <!--},-->
  <!--mounted () {-->
    <!--this.init()-->
  <!--},-->
  <!--methods: {-->
    <!--init () {-->
      <!--console.log(-->
        <!--signWithLocalPrivateKey('chapter subway west before husband robust step awful between target benefit cause', '', 0, 0, 0)-->
      <!--)-->
      <!--let aa = JSON.stringify(signWithLocalPrivateKey('chapter subway west before husband robust step awful between target benefit cause', '', 0, 0, 0))-->
      <!--let encrypt = new JSEncrypt()-->
      <!--console.log(aa)-->
      <!--encrypt.setPublicKey('-&#45;&#45;&#45;&#45;BEGIN PUBLIC KEY-&#45;&#45;&#45;&#45;\n' +-->
        <!--'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuthhtYGn4QUI5Fl2Qj6D\n' +-->
        <!--'wJpfLOI/EO0l32q0eceBp/lCo4kbVL2O3BYa1QGPzXCDlRzYWmtlzJv92sbnT26I\n' +-->
        <!--'vAkoOvGMWACu5AGBzYIklQYyc17U/PtosgTOuNQYWycCzSCstLjUjr7NIMPLTg0L\n' +-->
        <!--'+FxS5qp2WDB8jbCn4t/94iK0wXmN3lUdBboMvz9XMY00UZmDCvh8Y6QXtypW4js4\n' +-->
        <!--'cke3/CHVLy4hTTBmXlpBI6+bh+MBunx7NBuZR1/6fyQmNQCVOqJx91xTgRaph8FH\n' +-->
        <!--'sp6AS7WEmpggZUov+dGSTuAq2gfEOQhQxt2sE1YqimMVooODO4gD3lMc8F8v/3ZE\n' +-->
        <!--'0wIDAQAB\n' +-->
        <!--'-&#45;&#45;&#45;&#45;END PUBLIC KEY-&#45;&#45;&#45;&#45;')-->
      <!--// let encrypted = encrypt.encrypt(aa)-->
      <!--// console.log(encrypted)-->
    <!--}-->
  <!--}-->
<!--}-->
<!--</script>-->

<!--<style scoped>-->

<!--</style>-->
