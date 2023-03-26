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
    showSetting: app.globalData.dictInfo.hasOwnProperty('no_high_school')
     || app.globalData.dictInfo.dictNames.生命科学 
     || app.globalData.dictInfo.dictNames.生命科学[app.globalData.dictInfo.useDict].hasOwnProperty('diff_threshold'),
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
    if(currentWord != null)
    {
      this.setData({
        word: {...currentWord}
      })
      this.setData({
        'word.favored': this.data.dictionary.isCurrentWordInFavored(currentWord)
      })
    }
  },

  updateUseMode: function(useMode) {
    this.data.dictionary.updateUseMode(useMode)
    //TODO wxml 无法调用类方法？
    let useModeMap = {'识记模式': 'learnt', '检验模式': 'tested'}
    this.setData({
      chooseStatus:useModeMap[useMode]
    })
    app.globalData.dictInfo.useMode = useMode
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
      dataDict.resetDictionary()
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
              _this.updateUseMode('检验模式')
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
    console.log(dataDict)
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
      let myFavoredDict = wx.getStorageSync('我的收藏')
      if(myFavoredDict)
      {
        this.data.dictionary.updateFavorList(myFavoredDict)
      }
    }

    let dataDict = this.data.dictionary
    
    this.updateUseMode(dictInfo.useMode)
    dataDict.updateUseDict(dictInfo.useDict)
    
    if(dataDict.isFilterEnabled() && dictInfo.hasOwnProperty('no_high_school'))
    {
      let filtername = dictInfo.no_high_school == true ? 'no_high_school' : 'none'
      this.configFilter(filtername)
    }
    
    if(dataDict.isFilterEnabled() && dictInfo.dictNames.生命科学[dictInfo.useDict].hasOwnProperty('diff_threshold'))
    {
      let difficultyThreshold = dictInfo.dictNames.生命科学[dictInfo.useDict].diff_threshold
      this.configDifficultyFilter(difficultyThreshold)
    }

    console.log(dictInfo)
    console.log(dataDict)

    this.onReload()
  },

  onReload: function() {
    console.log("words onReload start")
    let dataDict = this.data.dictionary
    // 选取最靠前的未掌握词组
    let curWord = dataDict.selectFirstWord()
    if(curWord){
      this.showWord(curWord)
    }
    else{
      this.on_alldone()
    }
    this.startTimer()

    if(dataDict.showCoreWordNum())
    {
      dataDict.initCoreWordNum()
      let coreNum = this.data.dictionary.getCoreWordNum()
      wx.setNavigationBarTitle({title: dataDict.getUseDict() + ' - 核心' + coreNum + '00词'})
    }
    
    if (!app.globalData.dictInfo.remind_time) {
      app.globalData.dictInfo.remind_time = '12:25'
    }
  },

  configFilter: function (filtername) {
    this.data.dictionary.updateFilter(filtername)
  },

  configDifficultyFilter: function(difficultyThreshold) {
    this.data.dictionary.updateDifficultyFilter(difficultyThreshold)
  },

  on_modify_setting() {
    this.data.since_touch_setting = 0
    this.setData({
      showSetting: true,
      setting_opacity: 1
    })
  },

  onConfig: function () {
    dblog.logAction("onConfig")
    this.on_modify_setting()
    wx.navigateTo({
      url: '../setting/setting',
    })
  },

  onDone: function () {
    dblog.logAction("onDone")

    let dataDict = this.data.dictionary

    dataDict.markWord()//标记掌握
    if(dataDict.showCoreWordNum() && dataDict.isCoreNumUpdated())
    {
      let coreNum = dataDict.getCoreWordNum()
      wx.setNavigationBarTitle({title: '生命科学 - ' + dataDict.getUseDict() + 
                                ' - 核心' + coreNum + '00词'})
      let _this = this
      switch (dataDict.getUseMode()) {
        case '识记模式':
          wx.showModal({
            title: '已在本词库内识记过' + (coreNum - 1) + '00个单词了(^_^) \r\n 要不要试着到检验模式印证一下记忆？',
            confirmText: '这就去',
            cancelText: '先不了',
            success (res) {
              if (res.confirm) {
                dblog.logAction("100_Words_Confirm")
                _this.updateUseMode('检验模式')
                _this.onReload()
                _this.onShow()
                return 
              } else if (res.cancel) {
              }
            }
          })
          break
        case '检验模式':
          wx.showModal({
            title: '已经复习完所有识记过的单词(^_^) \r\n 要不要继续前往识记模式学习？',
            confirmText: '这就去',
            cancelText: '先不了',
            success (res) {
              if (res.confirm) {
                dblog.logAction("all_Words_Confirm")
                _this.updateUseMode('识记模式')
                _this.onReload()
                _this.onShow()
                return 
              } else if (res.cancel) {
                dblog.logAction("all_Words_Cancel")
              }
            }
          })
          break
      }
    }

    //diff_Todo: 如果3s内选择掌握 且 未设定过 难度filter 则弹窗询问是否跳转设置页（取代高中filter弹窗），参考文案：>>>>>>> Stashed changes
      // title: '屏蔽部分低难度单词？',
      // content: '如果您觉得看到的一些单词对于您过于简单，可以设定您希望的难度，之后也可以随时通过“调整设置”修改此设定',
      // confirmText: "调整设置",
      // cancelText: "暂时不了",

    // 每日任务进度更新
    //Todo: this.data.tracer.updateProgress()
    //Todo: if(this.data.tracer.achiveTarget())
    //        this.data.tracer.remindUser()

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
        return
      }
      if(dataDict.getUseDict() == '我的收藏')
      {
        this.onNext()
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

  onNext: async function () {
    clearTimeout(this.data.timer_timeout)
    this.data.since_touch_setting += 1
    this.setData({'setting_opacity': Math.max(0.2, 0.8 ** this.data.since_touch_setting)})

    let nextWord = this.data.dictionary.jumpToNextWord()
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
    console.log("words onShow")
    
    this.setData({
      within3s: true,
      showSetting: app.globalData.dictInfo.hasOwnProperty('no_high_school'),
      target_percent: 100*app.globalData.tracer.doneCount/app.globalData.dictInfo.daily_target
    })
    
    let dictInfo = app.globalData.dictInfo
    let dataDict = this.data.dictionary
    if(dictInfo.hasOwnProperty('no_high_school') 
       && dataDict.hasOwnProperty('dictionary') && dataDict.isFilterEnabled())
    {
      let filtername = dictInfo.no_high_school == true ? 'no_high_school' : 'none'
      this.configFilter(filtername)
    }
    if(dataDict.hasOwnProperty('dictionary') && dataDict.isFilterEnabled())
    {
      let difficultyThreshold = dictInfo.dictNames.生命科学[dictInfo.useDict].diff_threshold
      this.configDifficultyFilter(difficultyThreshold)
    }

    if (app.words_need_reload) {
      this.onReload()
      app.words_need_reload = false
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    if(Object.keys(this.data.dictionary).length != 0)
    {
      this.data.dictionary.commitData()
      wx.setStorage({key: app.globalData.dictInfo.useDict, 
                    data: this.data.dictionary.getDictionary()})
      wx.setStorage({key: '我的收藏', 
                     data: this.data.dictionary.getFavorDict()})
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
    if(Object.keys(this.data.dictionary).length != 0)
    {
      delete this.data.dictionary
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (res) {
    return app.onShareAppMessage(res)
  },
})