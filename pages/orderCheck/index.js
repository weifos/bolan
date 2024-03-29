var api = require("../../modules/api.js")
var appG = require("../../modules/appGlobal.js")
var user = require("../../modules/userInfo.js")
var router = require("../../modules/router.js")

Page({

  /**
   * 页面的初始数据
   */
  data: {
    appId: "",
    cid: 0,
    cno: '',
    cname: '',
    tname: '',
    payType: 0,
    balance: 0,
    isPaying: false,
    orderInfo: {
      serial_no: "",
      user_coupon_id: 0,
      remarks: "",
      actual_amount: 0,
      details: []
    },
    //微信支付参数
    wechatPay: {},
    ticketInfo: [{
      id: 0,
      key: "",
      name: "",
      startTime: "",
      endTime: "",
      discount: "",
      quota: ""
    }]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (opt) {

    //优惠券
    if (opt.cid != undefined && opt.cname != undefined && opt.tname != undefined) {
      this.setData({ cid: opt.cid })
      this.setData({ cno: opt.cno })
      this.setData({ cname: opt.cname })
      this.setData({ tname: opt.tname })
    }

    //跳转地址 
    this.api_317(opt.no)
  },

  /**
   * 选择优惠券
   */
  selectTicket: function () {
    router.goUrl({
      url: '../member/ticketList/index?s=1&m=2&sn=' + this.data.orderInfo.serial_no + '&amount=' + this.data.orderInfo.total_amount
    })
  },

  /**
   * 选择支付方式
   */
  checkedPay: function (e) {
    this.setData({
      payType: e.currentTarget.dataset.id
    })
  },

  /**
   * 微信小程序预支付订单
   */
  api_317(no) {
    let that = this
    let store = user.methods.getStore()

    api.post(api.api_317,
      api.getSign({
        OrderNo: no,
        StoreID: store.store_id
      }),
      function (vue, res) {
        if (res.data.Basis.State == api.state.state_200) {

          //订单信息
          that.setData({
            orderInfo: res.data.Result.order
          })

          user.methods.login(res.data.Result.user)
          that.setData({
            balance: res.data.Result.user.balance
          })

          let disAmount = 0
          let actual_amount = res.data.Result.order.actual_amount
          let total_amount = res.data.Result.order.total_amount
          if (that.data.tname.indexOf('元') != -1) {
            disAmount = parseFloat(that.data.tname.replace('元'))
            res.data.Result.order.coupon_amount = disAmount
            res.data.Result.order.actual_amount = total_amount - disAmount
          } else if (that.data.tname.indexOf('折') != -1) {
            disAmount = parseFloat(that.data.tname.replace('折'))
            res.data.Result.order.coupon_amount = total_amount * ((10 - disAmount) / 10).toFixed(2)
            res.data.Result.order.actual_amount = total_amount - res.data.Result.order.coupon_amount
          } else if (that.data.tname.indexOf('免费') != -1) {
            if (res.data.Result.order.store_details.length == 1) {
              disAmount = actual_amount
              res.data.Result.order.coupon_amount = actual_amount
              res.data.Result.order.actual_amount = 0
            } else {
              that.setData({
                cid: 0
              })
              wx.showToast({
                title: '只有单个商品才能使用免费券',
                icon: 'none',
                duration: 3000
              })
            }
          }

          //订单信息
          that.setData({
            orderInfo: res.data.Result.order
          })

        } else {
          wx.showToast({
            title: res.data.Basis.Msg,
            icon: 'none',
            duration: 3000
          })
        }
      }
    )
  },

  /**
   * 电子钱包支付
   */
  api_336() {
    let that = this

    //是否支付中
    if (!that.data.isPaying) {
      //设置支付中状态
      that.setData({ isPaying: true })
      api.post(api.api_336,
        api.getSign({
          UserCouponId: that.data.cid,
          No: that.data.orderInfo.serial_no,
          StoreID: that.data.orderInfo.store_id
        }),
        function (vue, res) {
          if (res.data.Basis.State == api.state.state_200) {
            wx.showToast({
              title: '支付成功',
              icon: 'succes',
              duration: 1000,
              mask: true
            })
            setTimeout(function () {
              router.goUrl({
                url: '../member/orderList/index'
              })
            }, 1000)
          } else {
            wx.showToast({
              title: res.data.Basis.Msg,
              icon: 'none',
              duration: 3000
            })
          }

          setTimeout(function () {
            that.setData({ isPaying: false })
          }, 2000)

        }
      )
    }
  },


  /**
   * 微信小程序预支付咖啡订单
   */
  api_339() {
    let that = this
    let store = user.methods.getStore()
    api.post(api.api_339,
      api.getSign({
        OrderNo: that.data.orderInfo.serial_no,
        StoreID: store.store_id,
        UserCouponId: that.data.cid,
        UserCouponNo: that.data.cno
      }),
      function (vue, res) {
        if (res.data.Basis.State == api.state.state_200) {
          wx.requestPayment({
            appId: res.data.Result.wechatpay.appId,
            timeStamp: res.data.Result.wechatpay.timeStamp,
            nonceStr: res.data.Result.wechatpay.nonceStr,
            package: res.data.Result.wechatpay.package,
            signType: res.data.Result.wechatpay.signType,
            paySign: res.data.Result.wechatpay.paySign,
            success: function (res) {
              if (res.errMsg = "requestPayment:ok") {
                //跳转地址 
                router.goUrl({
                  url: '../member/orderList/index'
                })
              }
            },
            fail: function (res) {
              router.goUrl({
                url: '../member/orderList/index'
              })
            },
            complete: function (res) {
              //console.log(res)
            }
          })

          //免费券支付
        } else if (res.data.Basis.State == 578) {
          wx.showToast({
            title: '支付成功',
            icon: 'success',
            duration: 2000
          })

          setTimeout(function () {
            router.goUrl({
              url: '../member/orderList/index'
            })
          }, 2000)

        } else {
          wx.showToast({
            title: res.data.Basis.Msg,
            icon: 'none',
            duration: 3000
          })
        }
      }
    )
  },

  /**
   * 立即支付
   */
  goPay: function () {
    let that = this

    //电子钱包支付
    if (that.data.payType == 1) {
      that.api_336()
    } else {
      that.api_339()
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    console.log("按了返回")
    //跳转地址 
    router.goUrl({
      url: '../member/orderList/index'
    })
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})