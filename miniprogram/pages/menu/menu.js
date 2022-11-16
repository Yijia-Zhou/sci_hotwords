const app = getApp()
var actualLoad
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
    useDictList : []
  },

  /**
   * 生命周期函数--监听页面加载
   * 将 Storage 中的 dictInfo 加载入 app.globalData.dictInfo
   */
  async onLoad(actualLoad=true) {
    console.log("menu onLoad start")
    if (actualLoad) {
      // onShow 中调用进行页面重载时 actualLoad 为 false, 此时不需要再次访问云端数据库获取/更新词库信息
      // console.log("actualLoad")
      const db = wx.cloud.database()
      app.globalData.dictInfo = wx.getStorageSync('dictInfo') // 若storage中无此key则返回""
      if (!app.globalData.hasOwnProperty('dictInfo') || typeof(app.globalData.dictInfo) == "string") { 
        // 此时即为没有 app.globalData.dictInfo，立即从云数据库拉去一份初始的
        const dictInfoRes = await db.collection('dictInfo').doc('content').get() 
        app.globalData.dictInfo = dictInfoRes.data
      } else {
        // 慢慢进行一个是否需要更新词库的判断
        db.collection('dictInfo').doc('content').get().then(res => { 
          app.globalData.dataTemp = res.data
          if (actualLoad && app.globalData.dataTemp && (!app.globalData.dictInfo.marker || app.globalData.dictInfo.marker!=app.globalData.dataTemp.marker)) {
            /**
             * 本地 Storage 的 keys 为已缓存的词典们和一些其它字段，dictInfo.marker 是标记其状态以便判断是否需要刷新缓存的标记值
             * 当 dictInfo.marker 与数据库中 marker 不一致时标记所有词库需要更新
             * 词库使用时会检查自己是否在 ‘dict_need_refresh’ 中，是的话就会从数据库拉去新版进行更新
             */
            wx.setStorageSync('dict_need_refresh', wx.getStorageInfoSync().keys)

            // dictInfo: clusters_and_domains, modes, useDict, useMode, marker
            app.globalData.dictInfo.clusters_and_domains = app.globalData.dataTemp.clusters_and_domains
            app.globalData.dictInfo.modes = app.globalData.dataTemp.modes
            app.globalData.dictInfo.marker = app.globalData.dataTemp.marker
            wx.setStorageSync('dictInfo', app.globalData.dictInfo)
          }
        }).catch(err => {
          console.log('Offline')
          console.log(err)
          app.globalData.offline = true
        })
      }
      if (!app.globalData.dictInfo.hasOwnProperty('daily_target')) {
        app.globalData.dictInfo.daily_target = 30
      }
      console.log("app.globalData.dictInfo: ", app.globalData.dictInfo)
    }

    if (app.globalData.dictInfo.useDict && actualLoad) { // 直接跳转到之前使用的词库
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
      url: '../words/words',
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
      url: '../query/query',
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
  },

  /**
   * 生命周期函数--监听页面显示
   * 主要触发场景：从words页面返回
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