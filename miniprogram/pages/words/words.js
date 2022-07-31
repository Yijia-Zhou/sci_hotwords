const app = getApp()

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
    multiArray: [['生命科学'], ['基础'], ['学习模式']],
    objectMultiArray: [
      [
        {
          id: 0,
          name: '无脊柱动物'
        },
        {
          id: 1,
          name: '脊柱动物'
        }
      ], [
        {
          id: 0,
          name: '扁性动物'
        },
        {
          id: 1,
          name: '线形动物'
        },
        {
          id: 2,
          name: '环节动物'
        },
        {
          id: 3,
          name: '软体动物'
        },
        {
          id: 3,
          name: '节肢动物'
        }
      ], [
        {
          id: 0,
          name: '猪肉绦虫'
        },
        {
          id: 1,
          name: '吸血虫'
        }
      ]
    ],
    multiIndex: [0, 0, 0],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function () {
    console.log("words onLoad start")
    wx.redirectTo({
      url: 'pages/index/index',
    })
    const useDict = app.globalData.dictInfo.useDict
    var dictionary = wx.getStorageSync(useDict)
    //console.log('dictionary: ', dictionary)

    if (!dictionary || dictionary.length==0) {
      wx.showLoading({
        title: '获取词库中',
      })
      const db = wx.cloud.database()
      var getRes = await db.collection('dictionary').doc(app.globalData.dictInfo.useDict).get()
      const dataTemp = getRes.data
      console.log(dataTemp)

      wx.setStorageSync(app.globalData.dictInfo.useDict, dataTemp.dictionary)
      
      const useDict = app.globalData.dictInfo.useDict
      var dictionary = wx.getStorageSync(useDict)
      //console.log('dictionary: ', dictionary)
    }

    var allDone = true
    for (var w in dictionary) {
      allDone = allDone && dictionary[w].done
    }
    if (allDone) {
      wx.showToast({
        title: '全部掌握啦\r\n正在重置词典',
        icon: 'none'
      })
      for (var w in dictionary) {
        dictionary[w].done = false
      }
      wx.setStorageSync(useDict, dictionary)
      this.onLoad()
    }

    var indexArray = Array.from(Array(dictionary.length).keys())
    const revered = indexArray.reverse()
    for (var i in revered) {
      var indexTemp = revered[i]
      if (dictionary[indexTemp].done) {
        var index = Number(indexTemp) + 1
        break
      }
    }
    if (!index) {
      var index = 0
    }

    for (i in dictionary) {
      dictionary[i].len = Math.max.apply(null, dictionary[i]._id.split(' ').map(s => { return s.length }))
    }

    // 计算衍生词字号大小
    var font01 = Math.min(40, 800/(dictionary[index].deris[0].word.length+dictionary[index].deris[1].word.length+5))
    var font23 = Math.min(38, 800/(dictionary[index].deris[2].word.length+dictionary[index].deris[3].word.length+5))

    this.setData({
      dictionary: dictionary,
      indexArray: indexArray,
      index: index,
      font01: font01,
      font23: font23
    })

    this.InnerAudioContext = wx.createInnerAudioContext()
    this.InnerAudioContext.src = 'http://dict.youdao.com/dictvoice?audio=' + dictionary[index]._id
    //this.InnerAudioContext.play()
    this.InnerAudioContext.onEnded(() => {
      app.globalData.timeout = setTimeout(this.onPlay, 1000)
    })
  },

  onDone: function () {
    this.data.dictionary[this.data.index].done = true
    this.onNext()
  },

  onNext: function () {
    //console.log('index: ', this.data.index)
    //console.log('indexArray[-1]: ', this.data.indexArray.length)
    if (this.data.index+1 >= this.data.indexArray.length) {
      var dictionary = this.data.dictionary
      dictionary.sort((a, b) => {
        return Number(Boolean(b.done)) - Number(Boolean(a.done))
      })
      //console.log('sortedDict: ', dictionary)
      wx.setStorageSync('dictionary', dictionary)
      wx.showToast({
        title: '学完一遍啦\r\n正在返回词典菜单',
        icon: 'none',
        success: function () {
          wx.navigateBack({
            delta: 1
          })
        }
      })
    }
    this.setData({
      index: this.data.index + 1
    })
    this.InnerAudioContext.destroy()
    this.InnerAudioContext = wx.createInnerAudioContext()
    this.setData({
      showPlay: true,
    })
    this.InnerAudioContext.src = 'http://dict.youdao.com/dictvoice?audio=' + this.data.dictionary[this.data.index]._id
    this.InnerAudioContext.onEnded(() => {
      app.globalData.timeout = setTimeout(this.onPlay, 1000)
    })
  },

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
    console.log(event.target.id.substr(4,1))
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
    if (res.from === 'button') {
      // 来自页面内转发按钮
      console.log(res.target)
    }
    var title = '植物科学高频英文单词 扫清文献阅读障碍'
    return {
      title: title,
      path: '/pages/index/index',
      imageUrl: 'cloud://botanydict-v1f9h.626f-botanydict-v1f9h-1300672096/photochemical.jpg',
    }
  },
})