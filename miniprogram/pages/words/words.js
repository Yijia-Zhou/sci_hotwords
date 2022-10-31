const app = getApp()
var dblog = require('../../utils/dblog.js')

Page({
 
  /**
   * 页面的初始数据
   */
  data: {
    // count: function (s) {
    //   return s.length
    // },
    showPlay: true,
    showMoreDeri: false,
    useMode: app.globalData.dictInfo.useMode,
    showChinese: false,
    noAudio: false,
    with3s: true,
    showSetting: false,
    since_touch_setting: 0,
    setting_opacity: 1,
    doneCount: app.globalData.tracer.doneCount
  },

  display_length_count: function (word) {
    // 计算单词显示长度，单位：a 显示时占用 1 长度（过程中 a 等记为 14 长度，故最后除以14）
    var res = 0
    for (let char in word) {
      switch(word[char]) { // 用法参考 https://blog.csdn.net/tel13259437538/article/details/83314965
        case 'i':
        case 'j':
        case 'l':
          res += 6
          break
        case 'f':
        case 'r':
        case 't':
          res += 10
          break
        case 'm':
        case 'w':
          res += 20
          break
        default:
          res += 14
      }
    }
    return res/14
  },

  calFontSize: function (deris) {
    let deris_copy = [...deris]
    for (let i in [0,0,0,0]) {
      deris_copy.push('')
    }
    let max_display_length = 0
    for (let i in [0,1,2,3]) {
      max_display_length = Math.max(max_display_length, this.display_length_count(deris_copy[i].word))
    }
    let fontRes = Math.min(44, 555/(max_display_length+1))
    return [fontRes, fontRes, fontRes, fontRes]
  },

  checkIfDisplay: function (index, dictionary) {
    let item = dictionary[index]
    let res = true
    res = res && (!item[this.data.chooseStatus])
    if (app.globalData.dictInfo.no_high_school) {
      res = res && (!dictionary[index].high_school)
    }
    return res
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function () {
    console.log("words onLoad start")
    const useDict = app.globalData.dictInfo.useDict
    wx.setNavigationBarTitle({title: '生命科学 - ' + useDict})
    switch (app.globalData.dictInfo.useMode) {
      case '识记模式':
        this.data.chooseStatus = 'learnt'
        break
      case '检验模式':
        this.data.chooseStatus = 'tested'
        break
    }
    var dictionary = wx.getStorageSync(useDict)

    if (!dictionary || dictionary.length==0) {
      wx.showLoading({
        title: '获取/更新词库中',
      })
      const db = wx.cloud.database()
      var getRes = await db.collection('dictionary').doc(app.globalData.dictInfo.useDict).get()
      const dataTemp = getRes.data.dictionary

      wx.setStorageSync(app.globalData.dictInfo.useDict, dataTemp)
      
      const useDict = app.globalData.dictInfo.useDict
      var dictionary = wx.getStorageSync(useDict)
    }
    
    else if (wx.getStorageSync('dict_need_refresh').includes(app.globalData.dictInfo.useDict)) {
      wx.showLoading({
        title: '获取/更新词库中',
      })
      const db = wx.cloud.database()
      var getRes = await db.collection('dictionary').doc(app.globalData.dictInfo.useDict).get()
      var dataTemp = getRes.data.dictionary
      console.log('获取/更新词库中', dataTemp)
      for (var i in dictionary) {
        let theOldItem = dictionary[i]
        let itemIndex = dataTemp.findIndex((item) => item._id === theOldItem._id)
        dataTemp[itemIndex].learnt = theOldItem.learnt
        dataTemp[itemIndex].tested = theOldItem.tested
        // 本地学习过程中在 dictionary 内添加的属性塞进更新过的词典里
        // 目前因为基本不会改动词库中词的数目，所以是把旧词库各词组属性存入新词库同一个 index 中，但有空可以改成用 word 作为 key 更好
      }
      wx.setStorageSync(app.globalData.dictInfo.useDict, dataTemp)
      console.log('更新词库完毕~')
      let dict_need_refresh = wx.getStorageSync('dict_need_refresh')
      dict_need_refresh.splice(dict_need_refresh.indexOf(app.globalData.dictInfo.useDict), 1)
      wx.setStorageSync('dict_need_refresh', dict_need_refresh)
    }

    var allDone = true
    for (var w in dictionary) {
      allDone = allDone && (!this.checkIfDisplay(w, dictionary))
    }
    console.log('allDone: ', allDone)
    if (allDone) {
      wx.showToast({
        title: '全部掌握啦\r\n正在重置词典',
        icon: 'none'
      })
      for (var w in dictionary) {
        dictionary[w][this.data.chooseStatus] = false
      }
      wx.setStorageSync(useDict, dictionary)
      this.onLoad()
    }

    // 选取最靠前的未掌握词组
    this.data.indexArray = Array.from(Array(dictionary.length).keys())
    const revered = this.data.indexArray.reverse()
    for (var i in revered) {
      var indexTemp = revered[i]
      // if (!dictionary[indexTemp][this.data.chooseStatus]) {
      if (this.checkIfDisplay(indexTemp, dictionary)) {
        var index = Number(indexTemp)
      }
    }
    if (!index) {
      var index = 0
    }

    for (i in dictionary) {
      dictionary[i].len = Math.max.apply(null, dictionary[i]._id.split(' ').map(s => { return s.length }))
    }

    // 数据加载进渲染模板
    this.setData({
      dictionary: dictionary,
      index: index,
      fontRes: await this.calFontSize(dictionary[index].deris),
      showSetting: app.globalData.dictInfo.hasOwnProperty('no_high_school')
    })

    var _this = this
    this.data.timer_timeout = setTimeout(function(){_this.data.with3s = false}, 3000)

    wx.hideLoading()

    dblog.logWord(dictionary[index]._id)

    // 预备“朗读”功能
    if (app.globalData.offline) {
      this.setData({
        noAudio: true
      })
    } else {
      try {
        this.InnerAudioContext = wx.createInnerAudioContext()
        this.InnerAudioContext.src = 'https://dict.youdao.com/dictvoice?audio=' + dictionary[index]._id
        this.InnerAudioContext.onEnded(() => {
          this.data.audio_timeout = setTimeout(this.onPlay, 1000)
        })
      } catch(e) {
        console.log(e)
        this.setData({
          noAudio: true
        })
      }
    }
  },

  onShowChinese: function () {
    dblog.logAction("onShowChinese")
    this.setData({showChinese: true})
  },

  configFilter: function (filtername, filtering) {
    let filtering_past = app.globalData.dictInfo[filtername]
    app.globalData.dictInfo[filtername] = filtering
    wx.setStorageSync('dictInfo', app.globalData.dictInfo)
    if (filtering != filtering_past) {
      this.onLoad()
    }
  },
  mayIFiltering: function (filtername) {
    let _this = this
    wx.showModal({
      title: '彻底屏蔽高中单词？',
      content: '部分高中课纲单词在论文中有一些特定用法/释义，您可以选择是否保留它们\r\n您也可以随时通过“调整设置”修改此设定',
      confirmText: "屏蔽",
      cancelText: "保留",
      success (res) {
        if (res.confirm) {
          _this.configFilter(filtername, true)
          dblog.logAction("enable_highschool_filter")
        } else if (res.cancel) {
          _this.configFilter(filtername, false)
          dblog.logAction("disable_highschool_filter")
        }
      }
    })
    this.data.since_touch_setting = 0
    this.setData({
      'setting_opacity': 1
    })
  },

  onConfig: function () {
    this.mayIFiltering('no_high_school')
    dblog.logAction("onConfig")
  },

  onDone: function () {
    dblog.logAction("onDone")
    this.data.dictionary[this.data.index][this.data.chooseStatus] = true // 标记掌握

    // 如果3s内选择掌握、当前单词在高中范围 且 storage中值为undefined而非false则弹窗询问是否屏蔽
    if (this.data.with3s && this.data.dictionary[this.data.index].high_school && (!app.globalData.dictInfo.hasOwnProperty('no_high_school'))) {
      this.mayIFiltering('no_high_school')
    }

    this.onNext()
  },

  onToBeDone: function () {
    dblog.logAction("onToBeDone")
    this.onNext()
  },

  onNext: async function (real_touch=true) {
    clearTimeout(this.data.timer_timeout)
    clearTimeout(this.data.audio_timeout)
    if (this.data.index+1 >= this.data.indexArray.length) {
    //   var dictionary = this.data.dictionary
    //   dictionary.sort((a, b) => {
    //     return Number(Boolean(b[this.data.chooseStatus])) - Number(Boolean(a[this.data.chooseStatus]))
    //   })
    //   //console.log('sortedDict: ', dictionary)
    //   wx.setStorageSync(app.globalData.dictInfo.useDict, dictionary)
      var _this = this
      wx.showToast({
        title: '本词典到底啦\r\n重新翻出尚未掌握的',
        icon: 'none',
        success: function () {
          wx.setStorageSync(app.globalData.dictInfo.useDict, _this.data.dictionary)
          _this.onLoad()
        }
      })
    } else {
      // this.data.index = this.data.index + 1
      // //console.log('word: ', this.data.dictionary[this.data.index]._id, 'chooseStatus: ', this.data.dictionary[this.data.index][this.data.chooseStatus])
      // if (this.data.dictionary[this.data.index][this.data.chooseStatus]) {
      //   return this.onNext()
      // } else {
      //   this.setData({
      //     index: this.data.index,
      //     showChinese: false
      //   })
      // }
      if (this.checkIfDisplay(this.data.index + 1, this.data.dictionary)) {
        let new_index = this.data.index + 1
        dblog.logWord(this.data.dictionary[new_index]._id)
        this.setData({
          index: new_index,
          showChinese: false,
          fontRes: await this.calFontSize(this.data.dictionary[new_index].deris)
        })
        this.data.with3s = true
        var _this = this
        this.data.timer_timeout = setTimeout(function(){_this.data.with3s = false}, 3000)
      } else {
        this.data.index += 1
        return this.onNext(real_touch=false) // 这里  return 仅表示不再向下执行
      }
    }
    
    // 更新“朗读”内容
    if (!this.data.noAudio) {
      this.InnerAudioContext.destroy()
      this.InnerAudioContext = wx.createInnerAudioContext()
      this.setData({
        showPlay: true
      })
      this.InnerAudioContext.src = 'https://dict.youdao.com/dictvoice?audio=' + this.data.dictionary[this.data.index]._id
      this.InnerAudioContext.onEnded(() => {
        this.data.audio_timeout = setTimeout(this.onPlay, 1000)
      })
    }

    if (real_touch) {
      this.data.since_touch_setting += 1
      this.setData({'setting_opacity': Math.max(0.2, 0.8 ** this.data.since_touch_setting)})
    }
  },

  // “朗读”与“暂停”
  onPlay: function () {
    dblog.logAction("onPlay")
    this.InnerAudioContext.play()
    this.setData({
      showPlay: false,
    })
  },
  onPause: function () {
    try {
      clearTimeout(this.data.audio_timeout)
    } catch {
      console.log('')
    }
    this.InnerAudioContext.pause()
    this.setData({
      showPlay: true,
    })
  },

  onMoreDeri: function () {
    this.setData({
      showMoreDeri: !this.data.showMoreDeri
    })
    wx.pageScrollTo({
      duration: 0,
      scrollTop: 0
    }) // 将“更多衍生词”界面滚动条回位
  },

  onDeriDetail: function (event) {
    // 点击衍生词可显示该衍生词释义
    dblog.logAction("onDeriDetail")
    var deri_obj = this.data.dictionary[this.data.index].deris[event.target.id.substr(4,1)]
    wx.showModal({
      title: deri_obj.word,
      content: (Boolean(deri_obj.bing)?deri_obj.bing:"暂无释义") + '\r\n 词频：' + String(deri_obj.count), 
      showCancel: false
    })
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
    this.setData({
      useMode: app.globalData.dictInfo.useMode
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: async function () {
    dblog.reportUserLog()
    wx.setStorageSync(app.globalData.dictInfo.useDict, this.data.dictionary)
    try {
      clearTimeout(this.data.timer_timeout)
    } catch(e) {
      console.log(e)
    }
    try {
      clearTimeout(this.data.audio_timeout)
    } catch(e) {
      console.log(e)
    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: async function () {
    this.InnerAudioContext.destroy()
    await this.onHide()
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
  onShareAppMessage: function (res) {
    return app.onShareAppMessage(res)
  },
})