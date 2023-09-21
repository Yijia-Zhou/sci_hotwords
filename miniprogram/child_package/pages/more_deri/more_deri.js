var app = getApp()
var display = require('../../sub_utils/display.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    deris: []
  },

  onReturn() {
    wx.navigateBack()
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    wx.pageScrollTo({
      duration: 0,
      scrollTop: 0
    })
  },

  onShow() {
    let deris = app.globalData.current_word_obj.deris
    for (let i in deris) {
      deris[i].fontSize = this.calSingleFontSize(deris[i].word)
    }
    this.setData({
      deris: deris
    })
  },

  calSingleFontSize: function (word) {
    let display_length = display.count_display_length(word)
    let fontRes = Math.min(32, 400/(display_length+1))
    return fontRes
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage(res) {
    app.onShareAppMessage(res)
  }
})