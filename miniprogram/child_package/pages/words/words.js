const app = getApp()
var dblog = require('../../../utils/dblog.js')
var requestDict = require('../../../utils/requestDict.js')
var reminder = require('../../../utils/reminder.js')
var display = require('../../../utils/display.js')
import { NormalDictionary, FavorDictionary } from './dictionary.js'
const DictionaryLoader = new requestDict.DictionaryLoader()

Page({
 
  /**
   * 页面的初始数据
   */
  data: {
    word: new Object(),
    dictionary: undefined,
    showSetting: app.globalData.dictInfo.hasOwnProperty('no_high_school')
     || (
        app.globalData.dictInfo.dictNames[app.globalData.dictInfo.useCluster]
        && app.globalData.dictInfo.dictNames[app.globalData.dictInfo.useCluster][app.globalData.dictInfo.useDict]
        && app.globalData.dictInfo.diff_thresholds.hasOwnProperty(app.globalData.dictInfo.useDict)
       ),
    since_touch_setting: 0,
    setting_opacity: 0.99,
    target_percent: 100*app.globalData.tracer.doneCount/app.globalData.dictInfo.daily_target,
    showModal: false,
    difficulty: 0
  },

  on_changing_diff: function(e) {
    this.setData({difficulty: e.detail.value})
  },

  // 渲染单词卡片
  showWord: function(currentWord) {
    this.data.dictionary.updateWordFrom(currentWord)
    if(currentWord != null)
    {
      let word = {...currentWord}
      word.favored = this.data.dictionary.isCurrentWordInFavored(currentWord)
      this.setData({
        word: word
      })
    }
  },

  modalCancel(){
  },

  modalConfirm(){
    let difficultyThreshold = this.data.difficulty / 100
    if(difficultyThreshold != 0)
    {
      this.configDifficultyFilter(difficultyThreshold)
      dblog.logAction("configDifficultyFilter", difficultyThreshold)
      this.onReload()
      let dataDict = this.data.dictionary
      app.globalData.dictInfo.diff_thresholds[dataDict.getUseDict()] = difficultyThreshold
      wx.setStorage({
        key: 'dictInfo',
        data: app.globalData.dictInfo
      })
    }
  },

  initialSetting: function()
  {
    //未设定过难度filter 则弹窗询问是否跳转设置页
    let dataDict = this.data.dictionary
    if(dataDict.isFilterEnabled() && !app.globalData.dictInfo.diff_thresholds.hasOwnProperty(dataDict.getUseDict()))
    {
      app.globalData.dictInfo.diff_thresholds[dataDict.getUseDict()] = 0
      // 加载难度示例
      let cal_font_size = function (word) {
        let len = display.count_display_length(word)
        return Math.min(40, 500/(len+1))
      }
      let diff_showcase_here = new Array()
      let words = app.globalData.dictInfo.dictNames.生命科学[dataDict.getUseDict()].diff_showcase
      for (let i in words) {
        diff_showcase_here.push({
          word: words[i],
          font: cal_font_size(words[i])
        })
      }
      this.setData({
        showModal: true,
        diff_showcase_here: diff_showcase_here
      })
      console.log("initialSetting done")
    }
  },

  updateUseMode: function(useMode) {
    this.data.dictionary.updateUseMode(useMode)
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
    console.log("All word done!")
    let dataDict = this.data.dictionary
    console.log(dataDict)
    let _this = this
    let reset = function() {
      wx.showModal({
        title: '全部掌握啦\r\n正在重置词典',
        showCancel: false,
      })
      dataDict.resetDictionary()
      _this.onReload()
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
  },

  async initialDictionary(dictInfo)
  {
    var dictionary = await DictionaryLoader.getDictionarySync(dictInfo.useDict)

    if(dictInfo.useDict == '我的收藏')
    {
      if(!dictionary || dictionary.length == 0)
      {
        this.nothing_favored()
        return
      }
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
    if(dataDict.isFilterEnabled() && dictInfo.diff_thresholds.hasOwnProperty(dictInfo.useDict))
    {
      let difficultyThreshold = dictInfo.diff_thresholds[dictInfo.useDict]
      this.configDifficultyFilter(difficultyThreshold)
    }

    console.log(dataDict)
    dblog.logAction("initialDictionary", dictInfo.useDict)
    this.initialSetting()
    this.onReload()
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    let dictInfo = app.globalData.dictInfo
    
    console.log("words onLoad start")
    console.log(dictInfo)

    wx.setNavigationBarTitle({title: '生命科学 - ' + dictInfo.useDict})

    this.initialDictionary(dictInfo)
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

    dataDict.markWord(true)//标记掌握
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
          reminder.requestReminder()
        }
      })
      this.on_modify_setting()
    }
  },

  onToBeDone: async function () {
    dblog.logAction("onToBeDone")

    let dataDict = this.data.dictionary
    dataDict.markWord(false)

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
      showSetting: app.globalData.dictInfo.hasOwnProperty('no_high_school'),
      target_percent: 100*app.globalData.tracer.doneCount/app.globalData.dictInfo.daily_target
    })
    
    let dictInfo = app.globalData.dictInfo
    let dataDict = this.data.dictionary
    if (!dataDict) {
      this.data.wait_onShow = setTimeout(this.onShow, 50)
      return 
    }

    if(dictInfo.hasOwnProperty('no_high_school') 
       && dataDict.hasOwnProperty('dictionary') && dataDict.isFilterEnabled())
    {
      let filtername = dictInfo.no_high_school == true ? 'no_high_school' : 'none'
      this.configFilter(filtername)
    }
    if(dataDict.isFilterEnabled() && dictInfo.diff_thresholds.hasOwnProperty(dictInfo.useDict)
      && dataDict.hasOwnProperty('dictionary'))
    {
      let difficultyThreshold = dictInfo.diff_thresholds[dictInfo.useDict]
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
    console.log("words - onHide")
    try {
      clearTimeout(this.data.timer_timeout)
    } catch(e) {
      console.log(e)
    }
    try {
      clearTimeout(this.data.wait_onShow)
    } catch(e) {
      console.log(e)
    }
    if(this.data.dictionary && Object.keys(this.data.dictionary).length != 0)
    {
      this.data.dictionary.commitData()
      wx.setStorage({key: app.globalData.dictInfo.useDict, 
                    data: this.data.dictionary.getDictionary()})
      wx.setStorage({key: '我的收藏', 
                     data: this.data.dictionary.getFavorDict()})
    }
    DictionaryLoader.removeDictionary(app.globalData.dictInfo.useDict)
    DictionaryLoader.removeDictionary('我的收藏')
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: async function () {
    await this.onHide()
    if(this.data.dictionary && Object.keys(this.data.dictionary).length != 0)
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