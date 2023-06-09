const app = getApp()
var dblog = require('../../../utils/dblog.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    word : {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    console.log("show result on load")
    var resultWord = app.globalData.resultWord
    this.setData({
        word : resultWord
      }
    )
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage : function (res) {
    return app.onShareAppMessage(res)
  }
})