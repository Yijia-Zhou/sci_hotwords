App({
  async onLaunch() {
    try {
      this.initcloud()
    } catch {
      console.log("Cloud can't be init")
    }
    let tracer = wx.getStorageSync('tracer')
    const date = new Date()
    if (typeof(tracer) == "string" || tracer.date != date.toLocaleDateString()) {
      tracer = {
        doneCount: 0,
        date: date.toLocaleDateString()
      }
    }
    
    this.globalData = {
      tracer
    }
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

  requestReminder() {
    let tmplId = '8wXHxzTSdCeoHYjVcMYyGKX7DoNGHyq4zMDR9UwMr4I'
    var _this = this
    wx.requestSubscribeMessage({
      tmplIds: [tmplId],
      success (res) {
        console.log(res)
        if (res[tmplId]=='accept') {
          let db = wx.cloud.database()
          let remind_time = _this.globalData.dictInfo.remind_time
          if (!remind_time) {
            remind_time = '12:25'
          }
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
            title: '将于明天 '+_this.globalData.dictInfo.remind_time+' 给您发送背单词提醒\r\n您可以再随意地看些单词，或是养精蓄锐明天继续',
            duration: 3200,
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

  onShareAppMessage: function (res) {
    if (res.from === 'button') {
      // 来自页面内转发按钮
      console.log(res.target)
    }
    let title = '生科SCI高频单词 扫清文献阅读障碍'
    return {
      title: title,
      path: '/pages/menu/menu',
      query: '',
      imageUrl: '/images/shareImage.png',
    }
  },
})