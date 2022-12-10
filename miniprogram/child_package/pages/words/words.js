const app = getApp()
var dblog = require('../../../utils/dblog.js')

Page({
 
  /**
   * 页面的初始数据
   */
  data: {
    word: new Object(),
    within3s: true,
    showSetting: app.globalData.dictInfo.hasOwnProperty('no_high_school'),
    since_touch_setting: 0,
    setting_opacity: 0.99,
    target_percent: 100*app.globalData.tracer.doneCount/app.globalData.dictInfo.daily_target
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
    wx.setNavigationBarTitle({title: '生命科学 - ' + app.globalData.dictInfo.useDict})

    switch (app.globalData.dictInfo.useMode) {
      case '识记模式':
        this.setData({chooseStatus: 'learnt'})
        break
      case '检验模式':
        this.setData({chooseStatus: 'tested'})
        break
    }

    var dictionary = wx.getStorageSync(app.globalData.dictInfo.useDict)
    if (!dictionary || dictionary.length==0) {
      if (app.globalData.dictInfo.useDict == '我的收藏') {
        wx.showModal({
          title: "暂无收藏",
          content: "在别的词库中收藏一些词汇组后再来吧", 
          confirmText: "好的吧~",
          showCancel: false,
          success () {
            wx.removeStorageSync('我的收藏')//({key: '我的收藏'})
            wx.redirectTo({
              url: '/pages/menu/menu?no_jump=true',
            })
          }
        })
        return
      }
      wx.showLoading({
        title: '获取/更新词库中，请稍候',
      })
      const db = wx.cloud.database()
      let getRes = await db.collection('dictionary').doc(app.globalData.dictInfo.useDict).get()
      const dataTemp = getRes.data.dictionary

      wx.setStorage({
        key: app.globalData.dictInfo.useDict,
        data: dataTemp
      })
      var dictionary = dataTemp
    }
    else if (wx.getStorageSync('dict_need_refresh').includes(app.globalData.dictInfo.useDict) 
          && app.globalData.dictInfo.useDict != "我的收藏") {
      wx.showLoading({
        title: '更新词库中，请稍候',
      })
      const db = wx.cloud.database()
      let getRes = await db.collection('dictionary').doc(app.globalData.dictInfo.useDict).get()
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

    // 选取最靠前的未掌握词组
    this.data.indexArray = Array.from(Array(dictionary.length).keys())
    const revered = this.data.indexArray.reverse()
    for (let i in revered) {
      let indexTemp = revered[i]
      // if (!dictionary[indexTemp][this.data.chooseStatus]) {
      if (this.checkIfDisplay(indexTemp, dictionary)) {
        var index = Number(indexTemp)
      }
    }
    if (typeof(index)!='number' || index >= dictionary.length) {  // alldone
      var _this = this
      switch (app.globalData.dictInfo.useMode) {
        case '识记模式':
          var _this = this
          wx.showModal({
            title: '全部记过一遍啦(^_^) \r\n 要不要试着到检验模式印证一下记忆？',
            confirmText: '这就去',
            cancelText: '先不了',
            success (res) {
              if (res.confirm) {
                app.globalData.dictInfo.useMode = '检验模式'
                dblog.logAction("allDone_begin_test")
                _this.onLoad()
                _this.onShow()
              } else if (res.cancel) {
                dblog.logAction("allDone_and_reset")
              }
            }
          })
          break
        case '检验模式':
          wx.showModal({
            title: '全部掌握啦\r\n正在重置词典',
            showCancel: false,
          })
          break
      }
      for (var w in dictionary) {
        dictionary[w][this.data.chooseStatus] = false
      }
      wx.setStorageSync(app.globalData.dictInfo.useDict, dictionary)
      // index = undefined
      return this.onLoad()
    }

    // 渲染单词卡片
    this.setData({word: {...dictionary[index]}})

    this.data.dictionary = dictionary
    this.data.index = index

    var _this = this
    this.data.timer_timeout = setTimeout(function(){_this.data.within3s = false}, 3000)

    wx.hideLoading()
    
    if (!app.globalData.dictInfo.remind_time) {
      app.globalData.dictInfo.remind_time = '12:25'
    }
  },

  configFilter: function (filtername, filtering) {
    let filtering_past = Boolean(app.globalData.dictInfo[filtername])
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
    this.on_modify_setting()
  },

  on_modify_setting() {
    this.data.since_touch_setting = 0
    this.setData({
      showSetting: true,
      setting_opacity: 1
    })
  },

  onConfig: function () {
    // this.mayIFiltering('no_high_school')
    dblog.logAction("onConfig")
    this.on_modify_setting()
    wx.navigateTo({
      url: '../setting/setting',
    })
  },

  onDone: function () {
    dblog.logAction("onDone")
    this.data.dictionary[this.data.index][this.data.chooseStatus] = true // 标记掌握

    // 如果3s内选择掌握、当前单词在高中范围 且 storage中值为undefined而非false则弹窗询问是否屏蔽
    if (this.data.within3s && this.data.dictionary[this.data.index].high_school && (!app.globalData.dictInfo.hasOwnProperty('no_high_school'))) {
      this.mayIFiltering('no_high_school')
    }

    // 每日任务进度更新
    app.globalData.tracer.doneCount ++
    // this.setData({target_percent: String(100*app.globalData.tracer.doneCount/app.globalData.dictInfo.daily_target)+'%'})
    this.setData({target_percent: 100*app.globalData.tracer.doneCount/app.globalData.dictInfo.daily_target})
    wx.setStorage({key: 'tracer', data: app.globalData.tracer})
    console.log(app.globalData.tracer.doneCount, app.globalData.dictInfo.daily_target)
    if (app.globalData.tracer.doneCount == app.globalData.dictInfo.daily_target) {
      wx.showModal({
        title: "已学习30个词汇组",
        content: "今日份的SCI词汇征服之旅已经完成，合理分配体力才更有可能走完全程哦，明天继续来吧O(∩_∩)O", 
        confirmText: "明天继续",
        showCancel: false,
        success () {
          app.requestReminder()
        }
      })
      this.on_modify_setting()
    }
    this.onNext()
  },

  onToBeDone: async function () {
    dblog.logAction("onToBeDone")
    if (!this.data.word.favored) {
      let _this = this
      wx.showModal({
        title: '是否收藏当前词汇组？',
        content: '收藏后可随时通过“我的收藏”词库进行复习、检验',
        success (res) {
          if (res.confirm) {
            _this.onFavor()
          } else if (res.cancel) {
            _this.onNext()
          }
        }
      })
    } else {
      this.onNext()
    }
  },

  onFavor () {
    dblog.logAction('favor_'+String(!Boolean(this.data.dictionary[this.data.index].favored)))
    // 在“我的收藏”词库中取消收藏
    if (app.globalData.dictInfo.useDict == '我的收藏') {
      // let the_word = {...this.data.dictionary[this.data.index]}
      let the_word = this.data.dictionary.splice(this.data.index, 1)[0]
      wx.setStorage({key: '我的收藏', data: this.data.dictionary})
      this.data.index --
      if (this.data.dictionary.length == 0) {
        this.onLoad()
      } else {
        this.onNext()
      }

      wx.getStorage({ // 同步到源词库
        key: the_word.from,
        success (res) {
          let the_dict = res.data
          for (let i in the_dict) {
            if (the_dict[i]._id == the_word._id) {
              the_dict[i].favored = false
              break
            }
          }
          wx.setStorage({key: the_word.from, data: the_dict})
        }
      })
    } 
    // 在一般词库中取消收藏
    else {
      this.data.dictionary[this.data.index].favored = !this.data.dictionary[this.data.index].favored
      this.setData({
        'word.favored': this.data.dictionary[this.data.index].favored,
        'word.just_favored': this.data.dictionary[this.data.index].favored
      })
      wx.setStorage({key: app.globalData.dictInfo.useDict, data: this.data.dictionary})
      let _this = this  
      if (_this.data.dictionary[_this.data.index].favored) { //新收藏词汇组，加入“我的收藏”词库中
        let favored_dict = new Array()
        wx.getStorage({
          key: '我的收藏',
          success (res) {
            if (res.data.length != 0) {
              favored_dict = res.data
            }
          },
          complete () {
            let temp = {..._this.data.dictionary[_this.data.index]}
            temp.from = app.globalData.dictInfo.useDict
            favored_dict.push({...temp})
            wx.setStorage({key: '我的收藏', data: favored_dict})
          }
        })
      } else { // 一般词库中取消收藏一个词汇组，从“我的收藏”词库中删除
        wx.getStorage({
          key: '我的收藏',
          success (res) {
            let favored_dict = res.data
            const index2del = (element) => {
              return element._id == _this.data.dictionary[_this.data.index]._id && element.from == app.globalData.dictInfo.useDict
            }
            favored_dict.splice(favored_dict.findIndex(index2del), 1)
            wx.setStorage({key: '我的收藏', data: favored_dict})
          }
        })
      }
    }
  },

  onNext: async function (real_touch=true) {
    clearTimeout(this.data.timer_timeout)
    if (real_touch) {
      console.log("real_touch")
      this.data.since_touch_setting += 1
      this.setData({'setting_opacity': Math.max(0.2, 0.8 ** this.data.since_touch_setting)})
    }

    if (this.data.index+1 >= this.data.indexArray.length) {
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
      if (this.checkIfDisplay(this.data.index + 1, this.data.dictionary)) {
        let new_index = this.data.index + 1
        this.setData({
          word: {...this.data.dictionary[new_index]}
        })
        this.data.index = new_index
        this.data.within3s = true
        var _this = this
        this.data.timer_timeout = setTimeout(function(){_this.data.within3s = false}, 3000)
      } else {
        this.data.index += 1
        this.onNext(real_touch=false)
      }
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // this.setData({
    //   useMode: app.globalData.dictInfo.useMode
    // })
    // try{
    //   if (this.checkIfDisplay(this.data.index, this.data.dictionary)) {
    //     this.onNext(real_touch=false)
    //   }
    // } catch(e) {
    //   console.log(e)
    // }
    if (this.data.hasOwnProperty('dictionary') && this.data.hasOwnProperty('index')
     && !this.checkIfDisplay(this.data.index, this.data.dictionary)) {
      let real_touch=false
      this.onNext(real_touch)
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    if (this.data.dictionary) {
      wx.setStorageSync(app.globalData.dictInfo.useDict, this.data.dictionary)
    }
    try {
      clearTimeout(this.data.timer_timeout)
    } catch(e) {
      console.log(e)
    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: async function () {
    await this.onHide()
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (res) {
    return app.onShareAppMessage(res)
  },
})