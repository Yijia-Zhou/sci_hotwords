var app = getApp()
var display = require('../../../utils/display.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    detail_content: app.globalData.detail_content
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
    let detail_content = app.globalData.detail_content_array
    for (let i in detail_content) {
      detail_content[i].fontSize = this.calSingleFontSize(detail_content[i].word)
    }
    this.setData({
      detail_content: detail_content
    })
  },

  calSingleFontSize: function (word) {
    let display_length = display.count_display_length(word)
    let fontRes = Math.min(32, 555/(display_length+1))
    return fontRes
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage(res) {
    app.onShareAppMessage(res)
  }
})