const app = getApp()
import { FavorDictionary } from '../words/dictionary.js'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    word : {},
    dictionary : {},
    favoredIdx : -1
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    console.log("show result on load")
    let resultWord = app.globalData.resultWord

    this.data.dictionary = wx.getStorageSync('我的收藏')
    if(!this.data.dictionary)
    {
      this.data.dictionary = new Array()
    }

    let word = {...resultWord}
    word.favored = this.isWordInFavored(word)
    this.setData({
      word: word
    })
    console.log(this.data.word)
  },

  isWordInFavored(word)
  {
    let dataDict = this.data.dictionary
    for (var w in dataDict) {
        if(dataDict[w]._id == word._id)
        {
          this.data.favoredIdx = w
          return true
        }
    }
    return false
  },

  onFavor()
  {
    let word = this.data.word
    word.favored = !word.favored
    if(word.hasOwnProperty('derisIndex'))
    {
      delete word['derisIndex']
    }
    this.setData({
      word: word
    })
  },

  onUnload: function () {
    let word = this.data.word
    if(word.hasOwnProperty('derisIndex'))
    {
      delete word['derisIndex']
    }
    let dataDict = this.data.dictionary
    if(this.data.favoredIdx > -1 && !word.favored)
    {
      dataDict.splice(this.data.favoredIdx, 1);
    }
    else if(this.data.favoredIdx == -1 && word.favored)
    {
      dataDict.push({...word})
    }
    console.log(dataDict)
    wx.setStorageSync('我的收藏', dataDict)
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage : function (res) {
    return app.onShareAppMessage(res)
  }
})