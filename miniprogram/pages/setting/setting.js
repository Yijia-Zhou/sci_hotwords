var app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    highschool_filter_array: ["保留它们", "屏蔽它们"],
    highschool_filter_index: app.globalData.dictInfo.no_high_school ? 1 : 0,

    daily_target_array: [...Array(100).keys()].slice(5),
    daily_target_index: 25,

    remind_time: app.globalData.dictInfo.hasOwnProperty('remind_time') ? app.globalData.dictInfo.remind_time : '12:25'
  },

  on_high_school_change: function(e) {
    this.setData({highschool_filter_index: e.detail.value})
  },

  on_daily_target_change: function(e) {
    this.setData({daily_target_index: e.detail.value})
  },

  on_remind_time_change: function(e) {
    this.setData({remind_time: e.detail.value})
  },

  onConfirm: function () {
    app.globalData.dictInfo.daily_target = this.data.daily_target_array[this.data.daily_target_index]
    app.globalData.dictInfo.remind_time = this.data.remind_time
    if (app.globalData.dictInfo.hasOwnProperty('no_high_school')) {
      app.globalData.dictInfo.no_high_school = Boolean(this.data.highschool_filter_index)
    }
    else if (this.data.highschool_filter_array[this.data.highschool_filter_index]=="屏蔽它们") {
      app.globalData.dictInfo.no_high_school = true
    }

    wx.setStorageSync('dictInfo', app.globalData.dictInfo)
    wx.navigateBack()
  },

  onCancel: function () {
    wx.navigateBack()
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})