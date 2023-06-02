var app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    deris: app.globalData.deris_array
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
    let deris = app.globalData.deris_array
    for (let i in deris) {
      deris[i].fontSize = this.calSingleFontSize(deris[i].word)
    }
    this.setData({
      deris: deris
    })
  },

  calSingleFontSize: function (word) {
    let display_length = app.count_display_length(word)
    let fontRes = Math.min(36, 555/(display_length+1))
    return fontRes
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage(res) {
    app.onShareAppMessage(res)
  }
})