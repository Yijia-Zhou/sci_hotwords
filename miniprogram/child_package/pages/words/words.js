const app = getApp()
var dblog = require('../../../utils/dblog.js')
var requestDict = require('../../../utils/requestDict.js')
var reminder = require('../../sub_utils/reminder.js')
var display = require('../../sub_utils/display.js')
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
    target_percent: 0,
    showModal: false,
    difficulty: 0,
    coreNum: 0
  },

  on_changing_diff: function(e) {
    this.setData({difficulty: e.detail.value})
  },
  
  setCoreWordsBarTitle: function()
  {
    let globalDictInfo = app.globalData.dictInfo
    let dataDict = this.data.dictionary
    let dailyTgt = globalDictInfo.daily_target
    this.setData({
      coreNum: (Math.floor((dataDict.getMarkedWordNum()) / dailyTgt) + 1) * dailyTgt
    })
    wx.setNavigationBarTitle({title: dataDict.getUseDict() + ' - 核心' + this.data.coreNum + '词'})
  },

  isSameDay(prevDay, curDay){
    return prevDay == curDay
  },

  initGlobalTracer(useDict, date)
  {
    app.globalData.dictInfo.tracer[useDict] = {
      date: date,
      doneCount: 0,
      isTodayFinished: false
    }
  },

  loadTracer: function() {
    let globalDictInfo = app.globalData.dictInfo
    let useDict = this.data.dictionary.getUseDict()
    let curDay = new Date().toLocaleDateString()

    if(!(useDict in globalDictInfo.tracer))
    {
      this.initGlobalTracer(useDict, curDay, 0)
    }

    if (!this.isSameDay(globalDictInfo.tracer[useDict].date, curDay)) {
      this.initGlobalTracer(useDict, curDay, this.data.dictionary.getMarkedWordNum())
    }

    wx.setStorage({
      key: 'dictInfo',
      data: app.globalData.dictInfo
    })

    console.log('getStorage - tracer - complete')
  },

  // 渲染单词卡片
  showWord: function(currentWord) {
    this.data.dictionary.updateWordFrom(currentWord)
    if(currentWord != null)
    {
      let word = {...currentWord}
      word.favored = this.data.dictionary.isWordInFavored(currentWord)
      this.setData({
        word: word
      })
    }
  },

  modalCancel(){
    let dataDict = this.data.dictionary
    app.globalData.dictInfo.diff_thresholds[dataDict.getUseDict()] = 0
    wx.setStorage({
      key: 'dictInfo',
      data: app.globalData.dictInfo
    })
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
      let words = app.globalData.dictInfo.dictNames[dataDict.getUseCluster()][dataDict.getUseDict()].diff_showcase
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
          title: '全部识记过一遍啦(^_^) \r\n 要不要试着到检验模式印证一下记忆？',
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
        wx.showModal({
          title: '全部检验过一遍啦(^_^) \r\n 是否返回选择其它词库？',
          confirmText: '这就去',
          cancelText: '先不了',
          success (res) {
            if (res.confirm) {
              dblog.logAction("allDone_and_return")
              reset()
              _this.updateUseMode('识记模式')
              wx.redirectTo({
                url: '/pages/menu/menu?no_jump=true',
              })
              return 
            } else if (res.cancel) {
              dblog.logAction("allDone_and_reset")
              reset()
            }
          }
        })
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
    dataDict.updateUseCluster(dictInfo.useCluster)
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

    if(dictInfo.useDict != '我的收藏')
    {
      this.loadTracer()
    }

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

    wx.setNavigationBarTitle({title: dictInfo.useDict})

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

    if(dataDict.needTracer())
    {
      dataDict.initMarkedWordNum()
      this.setCoreWordsBarTitle()
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
    let dailyTgt = app.globalData.dictInfo.daily_target
    let globalDictTracer = app.globalData.dictInfo.tracer[dataDict.getUseDict()]

    console.log(dailyTgt, globalDictTracer)

    if(dataDict.needTracer())
    {
      let _this = this
      if(dataDict.getUseMode() == '检验模式' && globalDictTracer.isTodayFinished == false 
         && globalDictTracer.doneCount >= dailyTgt && !dataDict.isNextWordLeant())
      {
        globalDictTracer.isTodayFinished = true
        wx.showModal({
          title: "已检验完所有已学习词汇组",
          content: "今日份的SCI词汇征服之旅已经完成，合理分配体力才更有可能走完全程哦，明天继续来吧O(∩_∩)O", 
          confirmText: "明天继续",
          showCancel: false,
          success () {
            reminder.requestReminder()
            _this.updateUseMode('识记模式')
            _this.onReload()
            _this.onShow()
          }
        })
        this.on_modify_setting()
        return
      }
      if(dataDict.getUseMode() == '识记模式' && globalDictTracer.isTodayFinished == false
         && globalDictTracer.doneCount >= dailyTgt)
      {
        if(globalDictTracer.doneCount > dailyTgt)
        {
          globalDictTracer.isTodayFinished = true
          reminder.requestReminder()
        }
        else
        {
          wx.showModal({
            title: '已达到今日识记目标(^_^) \r\n 试着到检验模式印证一下记忆？',
            confirmText: '这就去',
            cancelText: '先不了',
            success (res) {
              if (res.confirm) {
                _this.updateUseMode('检验模式')
                _this.onReload()
                _this.onShow()
                return 
              } else if (res.cancel) {
                globalDictTracer.isTodayFinished = true
                this.setCoreWordsBarTitle()
                reminder.requestReminder()
              }
            }
          })
        }
      }
    }

    if(dataDict.needTracer() && globalDictTracer.isTodayFinished == true && dataDict.getMarkedWordNum() % dailyTgt == 0)
    {
      this.setCoreWordsBarTitle()

      let _this = this
      switch (dataDict.getUseMode()) {
        case '识记模式':
          wx.showModal({
            title: '又识记了'+ dailyTgt +'个单词，(^_^) \r\n 继续到检验模式印证一下记忆？',
            confirmText: '这就去',
            cancelText: '先不了',
            success (res) {
              if (res.confirm) {
                _this.updateUseMode('检验模式')
                _this.onReload()
                _this.onShow()
                return 
              } 
              else if (res.cancel) {
              }
            }
          })
        break
        case '检验模式':
          if(!dataDict.isNextWordLeant()){
            wx.showModal({
              title: '又检验完了已经识记的词汇(^_^) \r\n 回到识记模式继续学习？',
              confirmText: '这就去',
              cancelText: '先不了',
              success (res) {
                if (res.confirm) {
                  _this.updateUseMode('识记模式')
                  _this.onReload()
                  _this.onShow()
                  return 
                } 
                else if (res.cancel) {
                }
              }
            })
         }
        break
      }
    }

    // dataDict.markWord(true)

    // if(dataDict.needTracer())
    // {
    //   globalDictTracer.doneCount ++
    //   this.setData({target_percent: 100 * globalDictTracer.doneCount/app.globalData.dictInfo.daily_target})
    //   wx.setStorage({key: 'dictInfo', data: app.globalData.dictInfo})
    // }
    // 避免影响每日目标&进度系统，doneCount与markWord相关临时移到onNext

    this.onNext()
  },

  onToBeDone: async function () {
    dblog.logAction("onToBeDone")

    let dataDict = this.data.dictionary
    // dataDict.markWord(false)

    if (!dataDict.isWordInFavored(this.data.word)) {
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

    if(dataDict.isWordInFavored(this.data.word))
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
    
    // 避免影响每日目标&进度系统的临时措施
    let dataDict = this.data.dictionary
    let globalDictTracer = app.globalData.dictInfo.tracer[dataDict.getUseDict()]
    dataDict.markWord(true) 
    if(dataDict.needTracer())
    {
      globalDictTracer.doneCount ++
      this.setData({target_percent: 100 * globalDictTracer.doneCount/app.globalData.dictInfo.daily_target})
      wx.setStorage({key: 'dictInfo', data: app.globalData.dictInfo})
    }

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
      showSetting: app.globalData.dictInfo.hasOwnProperty('no_high_school')
    })
    
    let dictInfo = app.globalData.dictInfo
    let dataDict = this.data.dictionary
    if (!dataDict) {
      this.data.wait_onShow = setTimeout(this.onShow, 50)
      return 
    }

    if(dataDict.needTracer())
    {
      let globalDictTracer = app.globalData.dictInfo.tracer[dataDict.getUseDict()]
      this.setData({
        target_percent: 100 * globalDictTracer.doneCount / app.globalData.dictInfo.daily_target
      })
      this.setCoreWordsBarTitle()
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
    //   console.log('setStorageSync', app.globalData.dictInfo.useDict)
      wx.setStorageSync(app.globalData.dictInfo.useDict, this.data.dictionary.getDictionary())
      wx.setStorageSync('我的收藏', this.data.dictionary.getFavorDict())
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