App({
  async onLaunch() {
    console.log('app.onLaunch')
    this.initcloud()
    this.globalData = new Object()
    let _this = this
    let date = new Date()

    // 载入/初始化tracer
    wx.getStorage({
      key: 'tracer',
      success (res) {
        if (res.data.date != date.toLocaleDateString()) {
          _this.globalData.tracer = {
            doneCount: 0,
            date: date.toLocaleDateString()
          }
        } else {
          _this.globalData.tracer = res.data
        }
      },
      fail () {
        _this.globalData.tracer = {
          doneCount: 0,
          date: date.toLocaleDateString()
        }
      },
      complete () {
        console.log('getStorage - tracer - complete')
      }
    })

    // 载入/初始化dictInfo
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
        if (!_this.globalData.dictInfo.hasOwnProperty('daily_target')) {
          _this.globalData.dictInfo.daily_target = 30
        }
      },
      fail () {
        console.log('getStorage - dictInfo - fail:')
        _this.globalData.dictInfo =   {"_id":"diff_showcase_test","modes":["识记模式","检验模式"],"dictNames":{"生命科学":
        {
            "基础词库":{
                "paper_count":1.217564E+06,
                "diff_showcase": ["signal", "researcher", "institute", "displaced", "distal", "deform", "elisa", "resuspend", "homogeneous", "catheter"]
            },
            "分子生物学":{"paper_count":75205.0,
            "diff_showcase": ["case", "capacity", "digest", "lncRNA", "vital", "phenyl", "pole", "fluid", "penetrate", "proton"]},
            "神经&认知":{"paper_count":51713.0,
            "diff_showcase": ["temporal", "assume", "microscope", "glucose", "poly", "excite", "propagate", "dysfunction", "cardiac", "gait"]
        },
            "生信&计算":{"paper_count":18965.0,
            "diff_showcase": ["network", "database", "reconstruct", "indices", "discharge", "cortex", "fuzzy", "probe", "primer", "poisson"]}
            }
            },"daily_target":30.0,"marker":12.0, diff_thresholds:{}}
      },
      complete () {
        // 慢慢进行一个是否需要更新词库的判断
        const db = wx.cloud.database()
        db.collection('dictInfo').doc('diff_showcase_test').get().then(res => { 
          _this.globalData.dataTemp = res.data
          if (_this.globalData.dataTemp && (!_this.globalData.dictInfo.marker || _this.globalData.dictInfo.marker!=_this.globalData.dataTemp.marker)) {
            /**
             * 本地 Storage 的 keys 为已缓存的词典们和一些其它字段，dictInfo.marker 是标记其状态以便判断是否需要刷新缓存的标记值
             * 当 dictInfo.marker 与数据库中 marker 不一致时标记所有词库需要更新
             * 词库使用时会检查自己是否在 ‘dict_need_refresh’ 中，是的话就会从数据库拉去新版进行更新
             */
            wx.setStorageSync('dict_need_refresh', wx.getStorageInfoSync().keys)

            // dictInfo: dictNames, modes, useDict, useMode, marker
            _this.globalData.dictInfo.dictNames = _this.globalData.dataTemp.dictNames
            _this.globalData.dictInfo.modes = _this.globalData.dataTemp.modes
            _this.globalData.dictInfo.marker = _this.globalData.dataTemp.marker
            _this.globalData.dictInfo.paper_count = _this.globalData.dataTemp.paper_count
            wx.setStorageSync('dictInfo', _this.globalData.dictInfo)
          }
        }).catch(err => {
          console.log('Offline')
          console.log(err)
          _this.globalData.offline = true
        })
        console.log('getStorage - dictInfo - complete')
      }
    })

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

  requestReminder(changed_time) {
    let tmplId = 'fIbeAXEbSJXGLeVhkuTxth5JrxvXw3sweb0NGd8a83c'
    var remind_time = changed_time ? changed_time : this.globalData.dictInfo.remind_time
    if (!remind_time) {
      remind_time = '12:25'
    }
    wx.requestSubscribeMessage({
      tmplIds: [tmplId],
      success (res) {
        console.log(res)
        if (res[tmplId]=='accept') {
          let db = wx.cloud.database()
          let remind_time_obj = new Date(new Date().getTime()+72000000)
          remind_time_obj.setHours(remind_time.split(':')[0])
          remind_time_obj.setMinutes(remind_time.split(':')[1])
          remind_time_obj.setSeconds(0)
          db.collection('reminder').add({
            data: {
              remind_time_ms: remind_time_obj.getTime()
            }
          })
          wx.showToast({
            title: "将于明天 "+remind_time+" 给您发送征服SCI单词提醒 (^◡^) 您可以再随意地看些单词，或是养精蓄锐明天继续",
            duration: 3600,
            icon: 'none'
          })
        }
      }
    })
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
      let flag = e.toString()
      flag = flag.indexOf('FunctionName') == -1 ? flag : '请在cloudfunctions文件夹中getOpenId上右键，创建部署云端安装依赖，然后再次体验'
      wx.hideLoading()
      wx.showModal({
        content: flag, // 此提示可以在正式时改为 "网络服务异常，请确认网络重新尝试！"
        showCancel: false
      })
      throw new Error(flag)
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

  // 计算单词显示长度，单位：a 显示时占用 1 长度（过程中 a 等记为 14 长度，故最后除以14）
  count_display_length: function (word) {
    let res = 0
    for (let char in word) {
      switch(word[char].toLowerCase()) { // 用法参考 https://blog.csdn.net/tel13259437538/article/details/83314965
        case 'i':
        case 'j':
        case 'l':
        case ' ':
          res += 6
          break
        case 'f':
        case 'r':
        case 't':
        case '-':
          res += 10
          break
        case 'm':
        case 'w':
          res += 20
          break
        default:
          res += 14
      }
      if (/^[A-Z]$/.test(word[char])) {
        res += 5  // 如果是大写字母则额外+5
      }
      else if (escape(word[char]).indexOf("%u") >= 0) { // 判断方法来自 https://juejin.cn/post/6844903745583579149
        res += 10  // 如果不是英文字符则额外+10（默认当中文(长度24)处理）
      }
    }
    return res/14
  },

  onHide () {
    let dblog = require('/utils/dblog.js')
    dblog.reportUserLog()
  }
})