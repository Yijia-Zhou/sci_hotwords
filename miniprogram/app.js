App({

  initGlobalDictInfo()
  {
    console.log('getStorage - dictInfo - fail:')
    this.globalData.dictInfo =   {
      "_id":"2.x",
      "modes":["识记模式",
      "检验模式"],
      "dictNames":{
        "生命科学":{
          "基础词库":{
            "paper_count":1.217564E+06,
            "diff_showcase":["signal","researcher", "institute","displaced","distal", "deform","elisa","resuspend","homogeneous","catheter"]},
          "分子生物学":{
            "paper_count":75205.0,
            "diff_showcase":["case", "capacity", "digest", "lncRNA", "vital", "phenyl", "pole","fluid","penetrate","proton"]},
          "神经&认知":{"paper_count":51713.0,
                "diff_showcase":["temporal",
                "assume",
                "microscope",
                "glucose",
                "poly",
                "excite",
                "propagate",
                "dysfunction",
                "cardiac",
                "gait"]},
          "生信&计算":{"paper_count":18965.0,
                "diff_showcase":["network",
                "database",
                "reconstruct",
                "indices",
                "discharge",
                "cortex",
                "fuzzy",
                "probe",
                "primer",
                "poisson"]}
          },
        "医学":{"医学基础":{"paper_count":1.217564E+06,
          "diff_showcase":["signal",
          "researcher",
          "institute",
          "displaced",
          "distal",
          "deform",
          "elisa",
          "resuspend",
          "homogeneous",
          "catheter"]}
        },
        "农学":{
          "农学基础":{
            "paper_count":1.217564E+06,
            "diff_showcase":["signal",
              "researcher",
              "institute",
              "displaced",
              "distal",
              "deform",
              "elisa",
              "resuspend",
              "homogeneous",
              "catheter"]}}
        },
      "daily_target":30.0,
      "marker":16.0
    }
  },

  isSameDay(prevDay, curDay){
    return prevDay == curDay
  },

  loadDictInfo(){
    let _this = this
    
    wx.getStorage({
      key: 'dictInfo',
      success (res) {
        console.log('getStorage - dictInfo - success:', res)
        _this.globalData.dictInfo = res.data
        if (!_this.globalData.dictInfo.hasOwnProperty('dictNames')) { // 把clusters_and_domains改名成dictNames时的临时措施
          _this.globalData.dictInfo.dictNames = _this.globalData.dictInfo.clusters_and_domains
        }
        // 临时：将难度设置(diff_threshold)存储位置从 dictNames 中移出
        if (!_this.globalData.dictInfo.hasOwnProperty('diff_thresholds')) {
          _this.globalData.dictInfo.diff_thresholds = new Object()
          let clusters = _this.globalData.dictInfo.dictNames
          console.log(clusters)
          for (let cluster_keyi in Object.keys(clusters)) {
            let dicts = clusters[Object.keys(clusters)[cluster_keyi]]
            for (let dict_keyi in Object.keys(dicts)) {
              let dict = dicts[Object.keys(dicts)[dict_keyi]]
              if (dict.hasOwnProperty('diff_threshold')) {
                _this.globalData.dictInfo.diff_thresholds[Object.keys(dicts)[dict_keyi]] = dict.diff_threshold
              }
            }
          }
          console.log('diff_thresholds', _this.globalData.dictInfo.diff_thresholds)
        }
        if(!_this.globalData.dictInfo.hasOwnProperty("tracer")){
          _this.globalData.dictInfo.tracer = {}
        }
        if (!_this.globalData.dictInfo.hasOwnProperty('daily_target')) {
          _this.globalData.dictInfo.daily_target = 30
        }
      },
      fail () {
        _this.initGlobalDictInfo(_this)
      },
      complete () {
        // 慢慢进行一个是否需要更新词库的判断
        let globalDictInfo = _this.globalData.dictInfo
        const db = wx.cloud.database()

        db.collection('dictInfo').doc('2.x').get().then(res => { 
          let remoteData = res.data
          if (remoteData && (!globalDictInfo.marker || globalDictInfo.marker!= remoteData.marker)) {
            /**
             * 本地 Storage 的 keys 为已缓存的词典们和一些其它字段，dictInfo.marker 是标记其状态以便判断是否需要刷新缓存的标记值
             * 当 dictInfo.marker 与数据库中 marker 不一致时标记所有词库需要更新
             * 词库使用时会检查自己是否在 ‘dict_need_refresh’ 中，是的话就会从数据库拉去新版进行更新
             */
            wx.setStorageSync('dict_need_refresh', wx.getStorageInfoSync().keys)

            // dictInfo: dictNames, modes, useDict, useMode, marker
            _this.globalData.dictInfo.dictNames = remoteData.dictNames
            _this.globalData.dictInfo.modes = remoteData.modes
            _this.globalData.dictInfo.marker = remoteData.marker

            wx.setStorageSync('dictInfo', _this.globalData.dictInfo)
          }
        }).catch(err => {
          console.log('Offline err:',err)
          _this.globalData.offline = true
        })
        console.log('getStorage - dictInfo - complete')
      }
    })
  },

  async onLaunch() {
    console.log('app.onLaunch')
    this.initcloud()
    this.globalData = new Object()
    this.loadDictInfo()
    console.log("onLaunch end")
  },

  flag: false,
  /**
   * 初始化云开发环境（支持环境共享和正常两种模式）
   */
  async initcloud() {
    const shareinfo = wx.getExtConfigSync() // 检查 ext 配置文件
    const normalinfo = require('./envList.js').envList || [] // 读取 envlist 文件
    if (shareinfo.envid != null) { // 如果 ext 配置文件存在，环境共享模式
      this.c1 = new wx.cloud.Cloud({ // 声明 cloud 实例
        resourceAppid: shareinfo.appid,
        resourceEnv: shareinfo.envid,
      })
      // 装载云函数操作对象返回方法
      this.cloud = async function () {
        if (this.flag != true) { // 如果第一次使用返回方法，还没初始化
          await this.c1.init().then(console.log).catch(err => {console.log(err)}) // 初始化一下
          this.flag = true // 设置为已经初始化
        }
        return this.c1 // 返回 cloud 对象
      }
    } else { // 如果 ext 配置文件存在，正常云开发模式
      if (normalinfo.length != 0 && normalinfo[0].envId != null) { // 如果文件中 envlist 存在
        wx.cloud.init({ // 初始化云开发环境
          traceUser: true,
          env: normalinfo[0].envId
        }).then(console.log).catch(err => {console.log(err)})
        // 装载云函数操作对象返回方法
        this.cloud = () => {
          return wx.cloud // 直接返回 wx.cloud
        }
      } else { // 如果文件中 envlist 不存在，提示要配置环境
        this.cloud = () => {
          wx.showModal({
            content: '当前小程序没有配置云开发环境，请在 envList.js 中配置你的云开发环境', 
            showCancel: false
          })
          throw new Error('当前小程序没有配置云开发环境，请在 envList.js 中配置你的云开发环境')
        }
      }
    }
  },

  // 获取云数据库实例
  async database() {
    return (await this.cloud()).database()
  },

  // 上传文件操作封装
  async uploadFile(cloudPath, filePath) {
    return (await this.cloud()).uploadFile({
      cloudPath,
      filePath
    })
  },

  // 下载文件操作封装
  async downloadFile(fileID) {
    return (await this.cloud()).downloadFile({
      fileID
    })
  },

  // 获取用户唯一标识，兼容不同环境模式
  async getOpenId() {
    const {
      result: {
        openid,
        fromopenid
      }
    } = await (await this.cloud()).callFunction({
      name: 'getOpenId'
    }).catch(e => {
      let errStr = e.toString()
      console.log('getOpenId err : ', errStr)
      wx.hideLoading()
      wx.showModal({
        content: '网络服务异常，请确认网络重新尝试!',
        showCancel: false
      })
      throw new Error(errStr)
    })
    if (openid !== "") return openid
    return fromopenid
  },

  async onShareAppMessage(res) {
    if (res.from === 'button') {
      // 来自页面内转发按钮
      console.log(res.target)
    }
    let fromOpenId = await this.getOpenId()
    let title = '生科SCI高频单词 扫清文献阅读障碍'
    return {
      title: title,
      path: '/pages/menu/menu?fromOpenId='+fromOpenId,
      query: '',
      imageUrl: '/images/shareImage.png',
    }
  },

  onHide () {
    let dblog = require('/utils/dblog.js')
    dblog.reportUserLog()
  }
})