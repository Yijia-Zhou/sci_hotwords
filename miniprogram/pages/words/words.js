const app = getApp()
console.log('app: ', app)

Page({
 
  /**
   * 页面的初始数据
   */
  data: {
    count: function (s) {
      return s.length
    },
    showPlay: true,
    showMoreDeri: false,
    useMode: app.globalData.dictInfo.useMode,
    showChinese: false
  },

  mCount: function (word) {
    // 计算单词中"m"的个数，用于字号修正
    try {
      var lenRes = word.match(/m/g).length
    } catch {
      return 0
    }
    return lenRes
  },

  calFont: function (deris) {
    let fontRes = []
    try {
      // 计算衍生词字号，保证大小一路递减且不会超出 border
      fontRes[0] = Math.min(40, 500/(deris[0].word.length+1+this.mCount(deris[0].word)))
      fontRes[1] = Math.min(fontRes[0]-1, 500/(deris[1].word.length+1+this.mCount(deris[1].word)))
      fontRes[2] = Math.min(fontRes[1]-1, 500/(deris[2].word.length+1+this.mCount(deris[2].word)))
      fontRes[3] = Math.min(fontRes[2]-1, 500/(deris[3].word.length+1+this.mCount(deris[3].word)))
    } catch(err) {
      console.log(err)
    }
    return fontRes
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function () {
    console.log("words onLoad start")
    const useDict = app.globalData.dictInfo.useDict
    switch (app.globalData.dictInfo.useMode) {
      case '识记模式':
        this.data.chooseStatus = 'learnt'
        break
      case '检验模式':
        this.data.chooseStatus = 'tested'
        break
    }
    var dictionary = wx.getStorageSync(useDict)
    //console.log('dictionary: ', dictionary)

    if (!dictionary || dictionary.length==0) {
      wx.showLoading({
        title: '获取词库中',
      })
      const db = wx.cloud.database()
      var getRes = await db.collection('dictionary').doc(app.globalData.dictInfo.useDict).get()
      const dataTemp = getRes.data.dictionary

      wx.setStorageSync(app.globalData.dictInfo.useDict, dataTemp)
      
      const useDict = app.globalData.dictInfo.useDict
      var dictionary = wx.getStorageSync(useDict)
      //console.log('dictionary: ', dictionary)
    }
    
    else if (wx.getStorageSync('dict_need_refresh').includes(app.globalData.dictInfo.useDict)) {
      wx.showLoading({
        title: '更新词库中',
      })
      const db = wx.cloud.database()
      var getRes = await db.collection('dictionary').doc(app.globalData.dictInfo.useDict).get()
      var dataTemp = getRes.data.dictionary
      console.log('更新词库中', dataTemp)
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
      allDone = allDone && dictionary[w][this.data.chooseStatus]
    }
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
    var indexArray = Array.from(Array(dictionary.length).keys())
    const revered = indexArray.reverse()
    for (var i in revered) {
      var indexTemp = revered[i]
      if (!dictionary[indexTemp][this.data.chooseStatus]) {
        var index = Number(indexTemp)
      }
    }
    if (!index) {
      var index = 0
    }

    for (i in dictionary) {
      dictionary[i].len = Math.max.apply(null, dictionary[i]._id.split(' ').map(s => { return s.length }))
    }

    let fontRes = await this.calFont(dictionary[index].deris)
    console.log("fontRes: ", fontRes)

    // 数据加载进渲染模板
    this.setData({
      dictionary: dictionary,
      indexArray: indexArray,
      index: index,
      fontRes: fontRes
    })

    // “朗读”功能
    this.InnerAudioContext = wx.createInnerAudioContext()
    this.InnerAudioContext.src = 'https://dict.youdao.com/dictvoice?audio=' + dictionary[index]._id
    //this.InnerAudioContext.play()
    this.InnerAudioContext.onEnded(() => {
      app.globalData.timeout = setTimeout(this.onPlay, 1000)
    })
  },

  onShowChinese: function () {
    this.setData({showChinese: true})
  },

  onDone: function () {
    this.data.dictionary[this.data.index][this.data.chooseStatus] = true // 标记掌握
    this.onNext()
  },

  onNext: async function () {
    //console.log('index: ', this.data.index)
    //console.log('indexArray[-1]: ', this.data.indexArray.length)
    if (this.data.index+1 >= this.data.indexArray.length) {
      var dictionary = this.data.dictionary
      dictionary.sort((a, b) => {
        return Number(Boolean(b[this.data.chooseStatus])) - Number(Boolean(a[this.data.chooseStatus]))
      })
      //console.log('sortedDict: ', dictionary)
      wx.setStorageSync(app.globalData.dictInfo.useDict, dictionary)
      var _this = this
      wx.showToast({
        title: '本词典到底啦\r\n重新翻出尚未掌握的',
        icon: 'none',
        success: function () {
          // _this.setData({
          //   index: 0,
          //   showChinese: false
          // })
          _this.onLoad()
        }
      })
    } else {
      this.data.index = this.data.index + 1
      console.log('word: ', this.data.dictionary[this.data.index]._id, 'chooseStatus: ', this.data.dictionary[this.data.index][this.data.chooseStatus])
      if (this.data.dictionary[this.data.index][this.data.chooseStatus]) {
        return this.onNext()
      } else {
        this.setData({
          index: this.data.index,
          showChinese: false
        })
      }
    }
    
    // 更新“朗读”内容
    this.InnerAudioContext.destroy()
    this.InnerAudioContext = wx.createInnerAudioContext()
    let fontRes = await this.calFont(this.data.dictionary[this.data.index].deris)
    console.log("fontRes: ", fontRes)
    this.setData({
      showPlay: true,
      fontRes: fontRes
    })
    this.InnerAudioContext.src = 'https://dict.youdao.com/dictvoice?audio=' + this.data.dictionary[this.data.index]._id
    this.InnerAudioContext.onEnded(() => {
      app.globalData.timeout = setTimeout(this.onPlay, 1000)
    })
  },

  // “朗读”与“暂停”
  onPlay: function () {
    this.InnerAudioContext.play()
    this.setData({
      showPlay: false,
    })
  },
  onPause: function () {
    try {
      clearTimeout(app.globalData.timeout)
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
  },

  onDeriDetail: function (event) {
    // 点击衍生词可显示该衍生词释义
    var deri_obj = this.data.dictionary[this.data.index].deris[event.target.id.substr(4,1)]
    wx.showModal({
      title: deri_obj.word,
      content: deri_obj.bing + '\r\n 词频：' + String(deri_obj.count), 
      showCancel: false
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    wx.hideLoading()
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
    wx.setStorageSync(app.globalData.dictInfo.useDict, this.data.dictionary)
    try {
      clearTimeout(app.globalData.timeout)
    } catch {
      console.log('')
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