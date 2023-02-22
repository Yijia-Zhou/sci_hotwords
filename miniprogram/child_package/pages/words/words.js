const app = getApp()
var dblog = require('../../../utils/dblog.js')
var requestDict = require('../../../utils/requestDict.js')
import { NormalDictionary, FavorDictionary } from './dictionary.js'

Page({
 
  /**
   * 页面的初始数据
   */
  data: {
    word: new Object(),
    dictionary: new Object(),
    within3s: true,
    showSetting: app.globalData.dictInfo.hasOwnProperty('no_high_school'),
    since_touch_setting: 0,
    setting_opacity: 0.99,
    target_percent: 100*app.globalData.tracer.doneCount/app.globalData.dictInfo.daily_target
  },

  startTimer() {
    this.data.within3s = true
    let _this = this
    this.data.timer_timeout = setTimeout(function(){_this.data.within3s = false}, 3000)
  },

  // 渲染单词卡片
  showWord: function(currentWord) {
    this.setData({
      word: {...currentWord}
    })
    this.setData({
      'word.favored': this.data.dictionary.isCurrentWordInFavored(currentWord)
    })
  },

  nothing_favored() {
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
  },

  on_alldone() {
    let dataDict = this.data.dictionary
    let _this = this
    let reset = function() {
      wx.showModal({
        title: '全部掌握啦\r\n正在重置词典',
        showCancel: false,
      })
    }
    switch (dataDict.getUseMode()) {
      case '识记模式':
        wx.showModal({
          title: '全部记过一遍啦(^_^) \r\n 要不要试着到检验模式印证一下记忆？',
          confirmText: '这就去',
          cancelText: '先不了',
          success (res) {
            if (res.confirm) {
              dblog.logAction("allDone_begin_test")
              dataDict.resetDictionary()
              dataDict.updateUseMode('检验模式')
              _this.onReload()
              _this.onShow()
              return 
            } else if (res.cancel) {
              dblog.logAction("allDone_and_reset")
              reset()
            }
          }
        })
        break
      case '检验模式':
        reset()
        break
    }
    dataDict.resetDictionary()
    this.onReload()
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function () {
    let dictInfo = app.globalData.dictInfo
    
    console.log("words onLoad start")
    wx.setNavigationBarTitle({title: '生命科学 - ' + dictInfo.useDict})

    try {
      var dictionary = await requestDict.requestDictionary(dictInfo.useDict)
    } catch(err) {
      if (err=="nothing_favored") {
        console.log(err)
        return
      }
    }

    if(dictInfo.useDict == '我的收藏')
    {
      this.data.dictionary = new FavorDictionary(dictionary)
    }
    else 
    {
      this.data.dictionary = new NormalDictionary(dictionary)
      if(wx.getStorageSync('我的收藏'))
      {
        console.log(wx.getStorageSync('我的收藏'))
        this.data.dictionary.updateFavorList(wx.getStorageSync('我的收藏'))
      }
    }

    let dataDict = this.data.dictionary
    console.log(dataDict)

    dataDict.updateUseMode(dictInfo.useMode)
    dataDict.updateUseDict(dictInfo.useDict)

    //TODO wxml 无法调用类方法？
    let useModeMap = {'识记模式': 'learnt', '检验模式': 'tested'}
    this.setData({
      chooseStatus:useModeMap[dictInfo.useMode]
    })
  
    let filtername = app.globalData.dictInfo.no_high_school == true
               ? 'no_high_school' : 'none'
    dataDict.updateFilter(filtername)

    this.onReload()
  },

  onReload: function() {
    let dataDict = this.data.dictionary
    // 选取最靠前的未掌握词组
    if(dataDict.selectFirstWord())
    {
      // this.on_alldone()
    }

    this.showWord(dataDict.getCurrentWord())
    this.startTimer()
    
    if (!app.globalData.dictInfo.remind_time) {
      app.globalData.dictInfo.remind_time = '12:25'
    }
  },

  configFilter: function (filtername) {
    if (filtername != this.data.dictionary.getFilter()) {
      this.data.dictionary.updateFilter(filtername)
      this.onReload()
    }
  },

  mayIFiltering: function () {
    let _this = this
    wx.showModal({
      title: '彻底屏蔽高中单词？',
      content: '部分高中课纲单词在论文中有一些特定用法/释义，您可以选择是否保留它们\r\n您也可以随时通过“调整设置”修改此设定',
      confirmText: "屏蔽",
      cancelText: "保留",
      success (res) {
        if (res.confirm) {
          _this.configFilter('no_high_school')
          dblog.logAction("enable_highschool_filter")
        } else if (res.cancel) {
          _this.configFilter('none')
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

    this.data.dictionary.markWord()//标记掌握

    // 如果3s内选择掌握、当前无特定filter 且 当前单词在高中范围
    if (this.data.within3s && this.data.dictionary.getFilter() == 'none'
        && !this.data.dictionary.isWordInfilter())
    {
      this.mayIFiltering('no_high_school')
    }

    // 每日任务进度更新
    //Todo: this.data.tracer.updateProgress()
    //Todo: if(this.data.tracer.achiveTarget())
    //        this.data.tracer.remindUser()
    //      this.data.dictionary.onNext() 

    app.globalData.tracer.doneCount ++
    // this.setData({target_percent: String(100*app.globalData.tracer.doneCount/app.globalData.dictInfo.daily_target)+'%'})
    this.setData({target_percent: 100*app.globalData.tracer.doneCount/app.globalData.dictInfo.daily_target})
    wx.setStorage({key: 'tracer', data: app.globalData.tracer})
    this.onNext()
    console.log(app.globalData.tracer.doneCount, app.globalData.dictInfo.daily_target)
    if (app.globalData.tracer.doneCount == app.globalData.dictInfo.daily_target) {
      wx.showModal({
        title: "已学习 "+app.globalData.dictInfo.daily_target+" 个词汇组",
        content: "今日份的SCI词汇征服之旅已经完成，合理分配体力才更有可能走完全程哦，明天继续来吧O(∩_∩)O", 
        confirmText: "明天继续",
        showCancel: false,
        success () {
          app.requestReminder()
        }
      })
      this.on_modify_setting()
    }
  },

  onToBeDone: async function () {
    dblog.logAction("onToBeDone")

    let dataDict = this.data.dictionary

    if (!dataDict.isCurrentWordInFavored(this.data.word)) {
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

  onFavor() {
    let dataDict = this.data.dictionary

    if(dataDict.isCurrentWordInFavored(this.data.word))
    {
      this.setData({
        'word.favored': false
      })
      dataDict.removeFavorWord()
      if(dataDict.isDictionaryEmpty())
      {
        this.nothing_favored()
      }
    }
    else
    {
      dataDict.addFavorWord()
      this.setData({
        'word.favored': true,
        'word.just_favored': true
      })
    }
  },



  onNext: async function (real_touch=true) {
    clearTimeout(this.data.timer_timeout)
    if (real_touch) {
      this.data.since_touch_setting += 1
      this.setData({'setting_opacity': Math.max(0.2, 0.8 ** this.data.since_touch_setting)})
    }

    let nextWord = this.data.dictionary.getNextWord()
    if(nextWord != null)
    {
      this.showWord(nextWord)
      this.startTimer()
    }
    else 
    {
      this.on_alldone()
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.setData({
      within3s: true,
      showSetting: app.globalData.dictInfo.hasOwnProperty('no_high_school'),
      target_percent: 100*app.globalData.tracer.doneCount/app.globalData.dictInfo.daily_target
    })
    
    if (app.words_need_reload) {
      this.configFilter('none')
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
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
    if(Object.keys(this.data.dictionary).length != 0)
    {
      wx.setStorage({key: app.globalData.dictInfo.useDict, 
                    data: this.data.dictionary.getDictionary()})
      wx.setStorage({key: '我的收藏', 
                     data: this.data.dictionary.getFavorDict()})
      delete this.data.dictionary
    }
    await this.onHide()
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (res) {
    return app.onShareAppMessage(res)
  },
})