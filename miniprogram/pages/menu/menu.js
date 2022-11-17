const app = getApp()
var dblog = require('../../utils/dblog.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    clusters: undefined,
    domains: undefined,
    modes: undefined,
    value: undefined,
    showBtn: true,
    useDictList : [],
    showQuery: wx.getDeviceInfo().platform == "devtools"
  },

  /**
   * 生命周期函数--监听页面加载
   * 如果之前有使用的词库则直接跳转
   */
  auto_navigate() {
    try {
      if (app.globalData.dictInfo.useDict) {
        wx.navigateTo({
          url: '/child_package/pages/words/words',
        })
      }
    } catch(e) {
      setTimeout(this.auto_navigate, 50)
    }
  },

  onLoad() {
    setTimeout(this.auto_navigate, 0)
  },

  /**
   * 生命周期函数--监听页面显示
   * 主要触发场景：onLoad结束；从words页面返回
   */
  picker_render() {
    if (!app.globalData.hasOwnProperty('dictInfo')) {
      return setTimeout(this.picker_render, 20)
    }
    this.setData({
      clusters: Object.keys(app.globalData.dictInfo.clusters_and_domains),
      domains: app.globalData.dictInfo.clusters_and_domains.生命科学,
      modes: app.globalData.dictInfo.modes
    })
    var useDictIndex = this.data.domains.indexOf(app.globalData.dictInfo.useDict)
    if (useDictIndex==-1) {
      useDictIndex = 0
    }
    var useModeIndex = this.data.modes.indexOf(app.globalData.dictInfo.useMode)
    if (useModeIndex==-1) {
      useModeIndex = 0
    }
    this.setData({
      value: [0, useDictIndex, useModeIndex]
    })
  },

  onShow() {
    setTimeout(this.picker_render, 0)
  },

  /**
   * 滚动过程中屏蔽确认按钮，避免数据更新还没完成就提交了
   */
  bindpickstart: function () {
    this.setData({showBtn: false})
  },
  bindpickend: function () {
    this.setData({showBtn: true})
  },

  // picker 选择更新时刷新相关变量值
  bindChange: function (e) { 
    const val = e.detail.value
    if (val[0]!=this.data.value[0]) {
      // todo: 当有不止一个大类后，根据第一列（大类）的改变决定第二列（domain）选项显示什么
    }
    this.setData({
      value: val
    })
    console.log("bindChange complete")
  },

  onConfirm() {
    app.globalData.dictInfo.useDict = this.data.domains[this.data.value[1]]
    app.globalData.dictInfo.useMode = this.data.modes[this.data.value[2]]
    console.log("app.globalData.dictInfo: ", app.globalData.dictInfo)
    if (app.globalData.dictInfo.useDict=="敬请期待") {
      app.globalData.dictInfo.useDict = "基础词库"
    }
    if (app.globalData.dictInfo.useMode=="敬请期待") {
      app.globalData.dictInfo.useMode = "识记模式"
    }

    wx.setStorageSync('dictInfo', app.globalData.dictInfo)
    wx.navigateTo({
      url: '/child_package/pages/words/words',
    })
  },

  onQuery(){
    app.globalData.dictInfo.useDictList = []
    var dict = ""
    for(dict in this.data.domains)
    {
      if(this.data.domains[dict] != "敬请期待")
      {
        app.globalData.dictInfo.useDictList.push(this.data.domains[dict])
      }
    }
    console.log("app.globalData.dictInfo: ", app.globalData.dictInfo)
    wx.setStorageSync('dictInfo', app.globalData.dictInfo)
    wx.navigateTo({
      url: '/child_package/pages/query/query',
    })
  },
  
  onConfig: function () {
    // this.mayIFiltering('no_high_school')
    dblog.logAction("onConfig")
    wx.navigateTo({
      url: '/child_package/pages/setting/setting',
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    // dblog.reportUserLog()
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // dblog.reportUserLog()
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (res) {
    return app.onShareAppMessage(res)
  }
})