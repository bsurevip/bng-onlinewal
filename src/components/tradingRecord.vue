<template>
    <div v-if="this.Global.walletAddress">
      <div  v-for="(item) in objTransactions" key="key">
        <div class="WalletInfoHeader clearfix">
          <div class="left title" style="cursor: pointer" @click="trandingRecordDialog(item.unit)"><span>Unit</span>{{item.unit}}</div>
          <div class="right date">{{new Date(item.date).toLocaleString()}}</div>
        </div>
        <div class="WalletInfoContent">
          <el-row>
            <el-col :span="14">
              <el-row  v-for="(fromItem) in item.from" key="fromIndex">
                <el-col :span="18">
                  <div>
                    <div>{{fromItem.address}}</div>
                    <div>{{fromItem.amount}}</div>
                  </div>
                </el-col>
                <el-col :span="6" v-if="fromItem.address === walletAddress">转出</el-col>
                <el-col :span="6" v-else>转入</el-col>
              </el-row>
            </el-col>
            <el-col :span="10">
              <div v-for="(toItem) in item.to" key="toIndex">
                <div>{{toItem.address}}</div>
                <div>{{toItem.amount}}</div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
      <el-dialog
        title="详细信息"
        :visible.sync="trandingdialogVisible"
        width="80%"
        :before-close="trandinghandleClose">
        <span style="text-align: left" class="trandingdialog">
          <h4>Children：</h4>
          <ul>
              <li v-for="ChildrenItem in tradingRecordObj.child" key="ChildrenItemkey">{{ChildrenItem}}</li>
          </ul>
          <h4>Parents：</h4>
           <ul>
              <li v-for="parentItem in tradingRecordObj.parents" key="ChildrenItemkey">{{parentItem}}</li>
          </ul>
          <h4>latest_included_mc_index : {{tradingRecordObj.latest_included_mc_index}}</h4>
          <h4>level : {{tradingRecordObj.level}}</h4>
          <h4>witnessed_level : {{tradingRecordObj.witnessed_level}}</h4>
          <h4>is_stable : {{tradingRecordObj.is_stable}}</h4>
          <h4>last_ball_unit : {{tradingRecordObj.last_ball_unit}}</h4>
          <h4>fees : {{tradingRecordObj.headers_commission + tradingRecordObj.payload_commission}}</h4>
          <h4>witnesses：</h4>
           <ul>
              <li v-for="(witnessItem, witnessIndex) in tradingRecordObj.witnesses" key="witness">{{witnessIndex}} : {{witnessItem}}</li>
          </ul>
        </span>
        <span slot="footer" class="dialog-footer">
    <!--<el-button @click="trandingdialogVisible = false">取 消</el-button>-->
    <!--<el-button type="primary" @click="init()">确定</el-button>-->
  </span>
      </el-dialog>
    </div>
    <div v-else>
      请导入钱包，不然不能查看交易记录
    </div>
</template>

<script>
import {Loading} from 'element-ui'
export default {
  name: 'tradingRecord',
  data () {
    return {
      objTransactions: {},
      walletAddress: '',
      trandingdialogVisible: false,
      tradingRecordObj: {}
    }
  },
  mounted () {
    this.init()
  },
  methods: {
    handleChange (val) {
      console.log(val)
    },
    trandinghandleClose (done) {
      this.$confirm('确认关闭？')
        .then(_ => {
          done()
          this.transferAccountsInit()
        })
        .catch(_ => {})
    },
    init () {
      let _this = this
      this.Axios.post(this.Global.baseUrl + 'addressInfo', {address: this.Global.walletAddress}).then(function (response) {
        console.log(response)
        _this.objTransactions = response.data.objTransactions
        _this.walletAddress = _this.Global.walletAddress
        // console.log(_this.objTransactions)
      }).catch(function (error) {
        console.log(error)
        console.log('错误')
      })
    },
    trandingRecordDialog (unit) {
      let _this = this
      let loadingInstance = Loading.service({ fullscreen: true })
      this.Axios.post(this.Global.baseUrl + 'getInfoOnUnit', {unit: unit}).then(function (response) {
        _this.$nextTick(() => { // 以服务的方式调用的 Loading 需要异步关闭
          loadingInstance.close()
        })
        console.log(response)
        _this.tradingRecordObj = response.data
        _this.trandingdialogVisible = true
      }).catch(function (error) {
        console.log(error)
        _this.trandingdialogVisible = false
        console.log('请求信息错误')
      })
    }
  }
}
</script>

<style>
  .title {
    text-align: left;
    font-weight: 300;
    font-size: 18px;
    color: #2980b9;
    /*margin: 10px 0;*/
  }
  .title span {
    margin-right: 7px;
    color: #000;
  }
  .WalletInfoHeader {
    background-color: #ccc;
    height: 40px;
    line-height: 40px;
    padding: 0 10px;
  }
  .left {
    float:left;
  }
  .right {
    float: right;
  }
  .clearfix:before, .clearfix:after {
    content:"";
    display:table;
  }
  .clearfix:after{
    clear:both;
    overflow:hidden;
  }
  .clearfix{
    *zoom:1;
  }
  .WalletInfoContent {
    text-align: left;
    word-break:break-all;
    padding: 15px;
  }
  .trandingdialog h4  {
    margin: 10px;
  }
  ul {
    margin: 0;
  }
  li {
    margin: 3px 0;
    list-style: none;
  }
</style>
