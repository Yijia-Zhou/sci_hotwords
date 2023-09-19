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

    // 记录新用户来源信息
    if (wx.getStorageInfoSync().keys.length < 3) {
      let launchOption = wx.getLaunchOptionsSync()
      let newUserData = {
        scene: launchOption.scene
      }
      if (options.fromOpenId)
      {
        newUserData.fromType = 'user_share'
        newUserData.fromOpenId = options.fromOpenId
      }
      else if (options.promoID)
      {
        newUserData.fromType = 'promo'
        newUserData.promoID = options.promoID
      }
      shareAppInfo.reportShareAppInfo(newUserData)
      console.log('newUserData:', newUserData)
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

  get_cluster(clusterIdx){
    return this.data.clusters[clusterIdx]
  },

  /**
   * 生命周期函数--监听页面显示
   * 主要触发场景：onLoad结束；从words页面返回
   */
  picker_render() {
    if (!app.globalData.hasOwnProperty('dictInfo')) {
      return setTimeout(this.picker_render, 20)
    }

    let clusters = Object.keys(app.globalData.dictInfo.dictNames)

    // 确保这两个特定元素（如果存在）排在前两位
    const specialItems = ['生命科学', '医学'];
    clusters.sort((a, b) => {
      if (specialItems.includes(a) && specialItems.includes(b)) {
        return specialItems.indexOf(a) - specialItems.indexOf(b);  // 在特定元素之间保持顺序
      }
      if (specialItems.includes(a)) {
        return -1; // a 在 b 之前
      }
      if (specialItems.includes(b)) {
        return 1; // b 在 a 之前
      }
      return 0; // 不改变 a 和 b 的相对顺序
    });

    this.setData({
      clusters: clusters,
      modes: app.globalData.dictInfo.modes,
    })
    
    let useCluster = this.data.clusters.indexOf(app.globalData.dictInfo.useCluster)
    useCluster = useCluster == -1 ? 0 : useCluster

    let domains_array = this.get_domains(this.get_cluster(useCluster))

    this.setData({domains:domains_array})

    let useDictIndex = this.data.domains.indexOf(app.globalData.dictInfo.useDict)
    useDictIndex = useDictIndex == -1 ? this.back2foundermental() : useDictIndex

    let useModeIndex = this.data.modes.indexOf(app.globalData.dictInfo.useMode)
    useModeIndex = useModeIndex == -1 ? 0 : useModeIndex

    this.setData({
      value: [useCluster, useDictIndex, useModeIndex]
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
      let domains_array = this.get_domains(this.get_cluster(val[0]))
      let useDictIndex = this.back2foundermental()
      this.setData({
        domains: domains_array,
        value: [val[0], useDictIndex, val[2]]
      })
    }
    else {
      this.setData({
        value: val
      })
    }
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
    app.globalData.dictInfo.useCluster = this.get_cluster(this.data.value[0])
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