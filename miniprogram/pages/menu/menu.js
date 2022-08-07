const app = getApp()
var actualLoad

Page({

  /**
   * 页面的初始数据
   */
  data: {
    clusters: undefined,
    domains: undefined,
    modes: undefined,
    value: undefined,
    showBtn: true
  },

  /**
   * 生命周期函数--监听页面加载
   * 将 Storage 中的 dictInfo 加载入 app.globalData.dictInfo
   */
  async onLoad(actualLoad=true) {
    console.log("menu onLoad start")
    if (actualLoad) {
      console.log("actualLoad")
      const db = wx.cloud.database()
      const dictInfoRes = await db.collection('dictInfo').doc('content').get()
      var dataTemp = dictInfoRes.data
    }

    console.log('dataTemp: ', dataTemp)
    app.globalData.dictInfo = wx.getStorageSync('dictInfo')
    console.log(app.globalData.dictInfo)
    if (typeof(app.globalData.dictInfo) == "string") {
      app.globalData.dictInfo = new Object()
    }
    if (actualLoad && (!app.globalData.dictInfo.marker || app.globalData.dictInfo.marker!=dataTemp.marker)) {
      // console.log('app.globalData.dictInfo.marker: ', app.globalData.dictInfo.marker)
      // console.log('dataTemp.marker: ', dataTemp.marker)
      wx.setStorageSync('dict_need_refresh', wx.getStorageInfoSync().keys)

      // dictInfo: clusters_and_domains, modes, useDict, useMode, marker
      app.globalData.dictInfo.clusters_and_domains = dataTemp.clusters_and_domains
      app.globalData.dictInfo.modes = dataTemp.modes
      app.globalData.dictInfo.marker = dataTemp.marker
      wx.setStorageSync('dictInfo', app.globalData.dictInfo)
    }
    console.log("app.globalData.dictInfo: ", app.globalData.dictInfo)
    if (app.globalData.dictInfo.useDict && actualLoad) {
      wx.navigateTo({
        url: '../words/words',
      })
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

    app.globalData.loaded = true
  },

  /**
   * 滚动过程中屏蔽确认按钮避免数据未完成更新就提交了
   */
  bindpickstart: function () {
    this.setData({showBtn: false})
  },
  bindpickend: function () {
    this.setData({showBtn: true})
  },

  bindChange: function (e) {
    const val = e.detail.value
    if (val[0]!=this.data.value[0]) {
      // todo: 根据第一列（大类）的改变决定第二列（domain）选项显示什么
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
      app.globalData.dictInfo.useDict = "general"
    }
    if (app.globalData.dictInfo.useMode=="敬请期待") {
      app.globalData.dictInfo.useMode = "识记模式"
    }

    wx.setStorageSync('dictInfo', app.globalData.dictInfo)
    wx.navigateTo({
      url: '../words/words',
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    if (app.globalData.loaded) {
      console.log("onShow - call onLoad")
      this.onLoad(actualLoad=false)
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

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