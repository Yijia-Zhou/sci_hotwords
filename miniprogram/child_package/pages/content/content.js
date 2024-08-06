const app = getApp()
var dblog = require('../../../utils/dblog.js')
var requestDict = require('../../../utils/requestDict.js')
const DictionaryLoader = new requestDict.DictionaryLoader()
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
    wx.setNavigationBarTitle({title: '目录！'})
    dblog.logAction("onContent")

    this.dictionary = await DictionaryLoader.getDictionarySync(app.globalData.dictInfo.useDict)
    let results = new Array()
    for (let index in this.dictionary) {
      let item = this.dictionary[index]
      let words = this.getWordsStr(item)
      
      results.push({
        words: words,
        meaning: item.chosen[0]
      })
    }
    this.setData({
      wordList: results
    })
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
    let targetIndex = new Number(e.currentTarget.dataset["target_index"])
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