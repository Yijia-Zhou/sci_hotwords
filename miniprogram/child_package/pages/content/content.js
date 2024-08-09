const app = getApp()
var dblog = require('../../../utils/dblog.js')
var requestDict = require('../../../utils/requestDict.js')
const DictionaryLoader = new requestDict.DictionaryLoader()
import { NormalDictionary} from '../words/dictionary.js'
var display = require('../../sub_utils/display.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    wordList: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad : async function() {
    if (!app.globalData.hasOwnProperty('dictInfo')) {
      return setTimeout(this.onLoad, 50)
    }
    console.log("content on load")
    wx.setNavigationBarTitle({title: app.globalData.dictInfo.useDict+' - 概览'})
    dblog.logAction("onContent")

    this.dictionary = await DictionaryLoader.getDictionarySync(app.globalData.dictInfo.useDict)
    let diff_thresholds = app.globalData.dictInfo.diff_thresholds[app.globalData.dictInfo.useDict]
    if (typeof(diff_thresholds) !== "number") {
      diff_thresholds = 0
    }
    let results = new Array()
    for (let index in this.dictionary) {
      let item = this.dictionary[index]

      let words = this.getWordsStr(item)
      let should_set_opacity = item.difficulty_level < diff_thresholds
      results.push({
        words: words,
        meaning: item.chosen[0],
        word_index: index,
        style: should_set_opacity ? 'opacity: 0.33;' : undefined
      })
    }

    this.markProc(results, diff_thresholds)
    this.setData({
      wordList: results
    })
    wx.showLoading({
      title: '努力加载中~',
    })
    setTimeout(this.checkRenderAndHideLoading, 0)
  },

  async checkRenderAndHideLoading() {
    const systemInfo = await wx.getSystemInfo()
    let windowHeight = systemInfo.windowHeight
    const query = wx.createSelectorQuery()
    query.selectAll('.word-item').boundingClientRect((rects) => {
      const count = rects.length;
      if (count > 50) {
        console.log('rects: ', rects)
        wx.hideLoading()
        // 查找具有特定 data-target_index 的元素
        const query2 = wx.createSelectorQuery()
        query2.select("#proc_marker").boundingClientRect(function(res) {
          // 使用 wx.pageScrollTo 滚动到元素位置
          console.log('res: ', res)
          wx.pageScrollTo({
            scrollTop: res.top + res.height*2 - windowHeight/2,
            duration: 200
          })
        }).exec()
      } else {
        setTimeout(this.checkRenderAndHideLoading, 50)
      }
    }).exec()
  },

  markProc(wordList, diff_thresholds) {
    let dictionary = new NormalDictionary(this.dictionary)
    let useMode = app.globalData.dictInfo.useMode
    if (useMode == '复习模式' || !useMode) {
      useMode = '检验模式'
    }
    dictionary.updateUseMode(useMode)
    dictionary.updateDifficultyFilter(diff_thresholds)
    console.log('useMode: ', useMode)
    console.log('dictionary: ', dictionary)
    let curWord = dictionary.selectFirstWord()
    console.log(curWord)
    let index = wordList.findIndex(element => element.meaning === curWord.chosen[0]); // 查找当前进度词汇组的索引

    if (index !== -1) {
      // 在当前进度词汇组前一位插入进度标记
      let proc_marker = {
        words: '>>>>>   您当前学到这里   <<<<<',
        meaning: '>>> 点击可进入词库继续学习 <<<',
        word_index: 'proc_marker',
        style: "background-color: #07c160;"
      }
      wordList.splice(index, 0, proc_marker);
    }
  },

  getWordsStr(word_item) {
    let deris = word_item.deris
    let words = word_item._id
    for (let ind2 in deris) {
      let deri_item = word_item.deris[ind2]
      let temp = words + ', ' + deri_item.word
      if (display.count_display_length(temp) > 35) {
        words += ', ...'
        break
      } else {
        words = temp
      }
    }
    return words
  },

  onReturn() {
    wx.redirectTo({
      url: '/pages/menu/menu?no_jump=true',
    })
  },

  toResult(e){
    console.log(e.currentTarget)
    let targetIndex = e.currentTarget.id
    if (targetIndex==='proc_marker') {
      wx.navigateTo({
        url: '/child_package/pages/words/words',
      })
      return
    }
    targetIndex = new Number(targetIndex)
    console.log('targetIndex: ', targetIndex)
    let resultWord = this.dictionary[targetIndex]
    resultWord.fromCluster = app.globalData.dictInfo.useCluster
    resultWord.fromDict = app.globalData.dictInfo.useDict
    app.globalData.resultWord = resultWord
    console.log('this.dictionary: ', this.dictionary)
    console.log('this.dictionary[targetIndex]: ', this.dictionary[targetIndex])
    app.globalData.dictInfo.useMode = '识记模式'
    wx.navigateTo({
      url: '../result/result'
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage : function (res) {
    return app.onShareAppMessage(res)
  }
})