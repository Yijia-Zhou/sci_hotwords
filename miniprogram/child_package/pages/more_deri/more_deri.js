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

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage(res) {
    app.onShareAppMessage(res)
  }
})