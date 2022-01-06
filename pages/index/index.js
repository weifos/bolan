var api = require("../../modules/api.js")
var appG = require("../../modules/appGlobal.js")
var router = require("../../modules/router.js")
var user = require("../../modules/userInfo.js")

Page({
  data: {
    visible: false,
    banners: [],
    stores: [],
    banners1: { imgurl: '', content_type: 0, content_value: '' },
    banners2: { imgurl: '', content_type: 0, content_value: '' },
    banners3: { imgurl: '', content_type: 0, content_value: '' },
    banners4: { imgurl: '', content_type: 0, content_value: '' },
    canIUse: wx.canIUse('button.open-type.getUserInfo')
  },

  //事件处理函数
  bindViewTap: function () {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },

  onLoad: function (opt) {
    if (!opt.store_id) {
      var result = {
        store_id: opt.store_id,
        bar_counter_id: opt.bar_counter_id
      }
      user.methods.setStore(result)
    }
    this.api_200()
  },

  /**
   * 加载首页数据
   */
  api_200: function () {
    var that = this;
    api.post(api.api_200, api.getSign(), function (app, res) {
      if (res.data.Basis.State != api.state.state_200) {
        wx.showToast({
          title: res.data.Basis.Msg,
          icon: 'none',
          duration: 3000
        })
      } else {

        //返回的数组扩展属性
        res.data.Result.banners.map(function (obj, index, arr) {
          obj.type = "image"
        })

        res.data.Result.stores.forEach((item, index) => {
          item.select = false
        })

        //门店数据
        that.setData({
          stores: res.data.Result.stores
        })

        //
        that.setData({
          banners: res.data.Result.banners
        })

        //咖啡点单模块图片
        if (res.data.Result.banners1[0] != null) {
          that.setData({
            banners1: res.data.Result.banners1[0]
          })
        }

        //到店取餐
        if (res.data.Result.banners1[1] != null) {
          that.setData({
            banners2: res.data.Result.banners1[1]
          })
        }

        //课堂报名模块图片
        if (res.data.Result.banners1[2] != null) {
          that.setData({
            banners3: res.data.Result.banners1[2]
          })
        }

        //活动预约模块图片
        if (res.data.Result.banners1[3] != null) {
          that.setData({
            banners3: res.data.Result.banners1[3]
          })
        }

      }
    })
  },

  /**
   * 扫码点单
   */
  api_204: function (result) {
    var that = this
    api.post(api.api_204, api.getSign({
      StoreID: result.store_id,
      BarCounterID: result.bar_counter_id
    }), function (app, res) {
      if (res.data.Basis.State != api.state.state_200) {
        wx.showToast({
          title: res.data.Basis.Msg,
          icon: 'none',
          duration: 3000
        })
      } else {
        //设置扫码门店信息
        user.methods.setStore(res.data.Result)
        router.goUrl({
          url: '/pages/coffee/coffee?store_id=' + res.data.Result.store_id + "&bar_counter_id=" + res.data.Result.bar_counter_id + "&scan=1"
        })
      }
    });
  },

  /**
   * 扫码点单
   */
  scanCode: function () {
    var that = this
    wx.showModal({
      title: '提示',
      content: '请扫描门店二维码确定您所在门店',
      showCancel: true,
      cancelText: '取消',
      //cancelColor: '取消按钮的文本颜色，默认#000000',
      confirmText: '确认',
      //confirmColor: '却惹按钮的文本颜色，默认#000000',
      success: function (res) {
        if (res.confirm) {
          // 调起扫码
          wx.scanCode({
            success(res) {
              if (res.path) {
                user.methods.setPickUp(false)
                let store_id = appG.util.getUrlParam(res.path, "store_id")
                let bar_counter_id = appG.util.getUrlParam(res.path, "bar_counter_id")
                //查询对应的吧台和门店信息
                that.api_204({
                  store_id: store_id,
                  bar_counter_id: bar_counter_id
                })
              }
            }
          })
        } else if (res.cancel) { }
      }
    })
  },

  /**
   * 选择门店
   */
  selectStore: function (e) {
    var that = this
    that.data.stores.forEach((item, index) => {
      item.select = false
      if (e.currentTarget.dataset.id == item.id) {
        item.select = true
      }
    })

    //门店数据
    that.setData({
      stores: that.data.stores
    })
  },

  /**
   * 菜单跳转
   */
  goUrl: function (e) {
    //跳转地址
    let url = ''
    let key = e.currentTarget.dataset.key

    switch (key) {
      //咖啡
      case "coffee":
        url = '../coffee/coffee'
        break;

      //选门店点咖啡
      case "coffee_by_store":
        this.setData({
          visible: true
        })
        break;

      //课程
      case "course":
        url = '../course/course'
        break;

      //活动预约
      case "appt":
        url = '../activity/activity'
        break;

      default:
        break;
    }

    if (url.length > 0) {
      router.goUrl({
        url: url
      })
    }
  },

  /**
   * 取消弹框
   */
  cancelPop: function () {
    let that = this
    that.data.stores.forEach((item, index) => {
      item.select = false
    })

    //门店数据
    that.setData({
      stores: that.data.stores
    })

    this.setData({
      visible: false
    })
  },

  /**
   * 取消弹框
   */
  confirmPop: function () {
    let that = this
    that.setData({
      visible: false
    })

    let store = null
    that.data.stores.forEach((item, index) => {
      if (item.select) {
        store = item
      }
    })

    if (store != null) {
      user.methods.setPickUp(true)
      that.api_204({ store_id: store.id, bar_counter_id: store.barCounter.id })
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: "博览书店会员服务",
      path: "pages/index/index",
      imageUrl: 'http://res.blbook.cn/DefaultRes/Images/mini_share.jpeg'
    }
  }
})