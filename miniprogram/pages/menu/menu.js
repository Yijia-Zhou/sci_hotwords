const app = getApp()
var dblog = require('../../utils/dblog.js')
var shareAppInfo = require('../../utils/shareApp.js')
var requestDict  = require('../../utils/requestDict.js')
const DictionaryLoader = new requestDict.DictionaryLoader()

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

  onLoad(options) {
    if (!options.no_jump) {
      setTimeout(this.auto_navigate, 0)
    } else {
      this.no_jump = true
    }
    let launchOption = wx.getLaunchOptionsSync()
    console.log(launchOption.scene)
    if (options.fromOpenId)
    {
      console.log("From openid", options.fromOpenId)
      shareAppInfo.reportShareAppInfo(options.fromOpenId, launchOption.scene)
    }
    else
    {
      console.log("From propaganda")
      shareAppInfo.reportShareAppInfo(0, launchOption.scene);
    }
  },

  get_domains (cluster) { // 根据第一行的选择生成第二行的domains array
    let domains_array = Object.keys(app.globalData.dictInfo.dictNames[cluster])
    for (let i in domains_array) {
      if (domains_array[i].includes("基础")) {
        let temp = domains_array[i]
        domains_array.splice(i, 1)
        domains_array.unshift(temp)
      }
    }
    if (!domains_array.includes("我的收藏")) {
      domains_array.unshift("我的收藏")
    }
    if (!domains_array.includes("敬请期待")) {
      domains_array.push("敬请期待")
    }
    return domains_array
  },

  /**
   * 生命周期函数--监听页面显示
   * 主要触发场景：onLoad结束；从words页面返回
   */
  picker_render() {
    if (!app.globalData.hasOwnProperty('dictInfo')) {
      return setTimeout(this.picker_render, 20)
    }
    
    let domains_array = this.get_domains("生命科学")
    this.setData({
      clusters: Object.keys(app.globalData.dictInfo.dictNames),
      domains: domains_array, 
      modes: app.globalData.dictInfo.modes
    })
    var useDictIndex = this.data.domains.indexOf(app.globalData.dictInfo.useDict)
    if (useDictIndex==-1) {
      useDictIndex = this.back2foundermental()
    }
    var useModeIndex = this.data.modes.indexOf(app.globalData.dictInfo.useMode)
    if (useModeIndex==-1) {
      useModeIndex = 0
    }
    this.setData({
      value: [0, useDictIndex, useModeIndex]
    })
    if (this.data.domains[useDictIndex] == "我的收藏" && this.no_jump) {
      this.back2foundermental()
    }

    var specialDict = ["我的收藏", "敬请期待"]

    if(!specialDict.includes(this.data.domains[useDictIndex]))
    {
      DictionaryLoader.preloadDictionary(this.data.domains[useDictIndex])
    }
  },

  onShow() {
    setTimeout(this.picker_render, 0)
    // setTimeout(app.loadFavored, 0)
  },

  /**
   * 滚动过程中屏蔽确认按钮，避免数据更新还没完成就提交了
   */
  bindpickstart: function () {
    this.setData({showBtn: false})
  },

  bindpickend: function () {
    console.log('bindpickend')
    this.setData({showBtn: true})
  },

  back2foundermental() {
    let domains_array = this.data.domains
    for (let i in domains_array) {
      if (domains_array[i].includes("基础")) {
        this.setData({
          'value[1]': i
        })
        return i
      }
    }
    return 1
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
    let _this = this
    if (this.data.domains[this.data.value[1]] == "敬请期待") {
      wx.showModal({
        title: "敬请期待",
        content: "更多学科/子领域词库正在分析/制作中……", 
        confirmText: "好的吧~",
        showCancel: false,
        success: _this.back2foundermental
      })
    } else if (this.data.domains[this.data.value[1]] == "我的收藏" && !wx.getStorageInfoSync().keys.includes('我的收藏')) {
      wx.showModal({
        title: "暂无收藏",
        content: "在别的词库中收藏一些词汇组后再来吧", 
        confirmText: "好的吧~",
        showCancel: false,
        success: _this.back2foundermental
      })
    } else {
      DictionaryLoader.preloadDictionary(this.data.domains[this.data.value[1]])
    }
    console.log("bindChange complete")
  },

  onConfirm() {
    app.globalData.dictInfo.useDict = this.data.value[1] != -1 ? this.data.domains[this.data.value[1]] : this.data.domains[1]
    app.globalData.dictInfo.useMode = this.data.modes[this.data.value[2]]
    console.log("app.globalData.dictInfo: ", app.globalData.dictInfo)
    if (app.globalData.dictInfo.useDict=="敬请期待") {
      app.globalData.dictInfo.useDict = "基础词库"
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
      if(this.data.domains[dict] != "敬请期待" && this.data.domains[dict] != "我的收藏")
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
   * 用户点击右上角分享
   */
  onShareAppMessage: function (res) {
    return app.onShareAppMessage(res)
  }
})