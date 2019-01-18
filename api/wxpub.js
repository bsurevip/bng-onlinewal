'use strict';

var request = require('request');
var crypto = require('crypto');
var util = require('util');


const wx_appid = 'wxd4e6f9ecb2549967';
const wx_appsecret = 'e22c4a2b838b88849682b1bf4436acc2';

let cached_accesstoken;

let getAccessToken = function(){
    var url_token = util.format("https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=%s&secret=%s",wx_appid,wx_appsecret);
    request.get({url:url_token,json:true},function (err,resp,data) {
        if(!err && resp.statusCode == 200 && !data.errcode)
        {
            cached_accesstoken = data.access_token;
            var delayTime = (parseInt(data.expires_in) - 100)*2000;
            setTimeout(getAccessToken,delayTime);
        }
        else
        {
            setTimeout(getAccessToken,10000);
        }
    });
}
getAccessToken();

/**
 * 创建兑换券
 * @param {*} cardinfo 
 */
let createWxCard = function(cardinfo)
{

}


module.exports = {
    accessToken:cached_accesstoken,
    getAccessToken:getAccessToken,
    createWxCard:createWxCard
}