const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    clusters: undefined,
    domains: undefined,
    modes: undefined,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad() {
    console.log("menu onLoad start")
    const db = wx.cloud.database()
    const dictInfoRes = await db.collection('dictInfo').doc('content').get()
    const dataTemp = dictInfoRes.data
    app.globalData.dictInfo = wx.getStorageSync('dictInfo')
    if (typeof(app.globalData.dictInfo) == "string") {
      app.globalData.dictInfo = new Object()
    }
    if (!app.globalData.dictInfo.marker || app.globalData.dictInfo.marker_id!=dataTemp.marker) {
      console.log('app.globalData.dictInfo.marker_id: ', app.globalData.dictInfo.marker_id)
      console.log('dataTemp.marker: ', dataTemp.marker)
      wx.setStorageSync('dict_need_refresh', wx.getStorageInfoSync().keys)

      // dictInfo: clusters_and_domains, modes, useDict, marker
      app.globalData.dictInfo.clusters_and_domains = dataTemp.clusters_and_domains
      app.globalData.dictInfo.modes = dataTemp.modes
      app.globalData.dictInfo.marker = dataTemp.marker
      wx.setStorageSync('dictInfo', app.globalData.dictInfo)
    }
    console.log("app.globalData.dictInfo: ", app.globalData.dictInfo)
    if (app.globalData.dictInfo.useDict) {
      wx.navigateTo({
        url: 'pages/words/words',
      })
    }

    this.setData({
      clusters: Object.keys(app.globalData.dictInfo.clusters_and_domains),
      domains: app.globalData.dictInfo.clusters_and_domains.生命科学,
      modes: app.globalData.dictInfo.modes,
    })
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