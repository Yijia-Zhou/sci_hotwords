// pages/query/query.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isShowResultView: false,
    searchResultArr : [],
    allDictionary :[]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

    console.log("query on load")
    wx.setNavigationBarTitle({title: '词汇查询'})

    var useDictList = wx.getStorageSync('dictInfo').useDictList

    console.log(useDictList)

    var allDictionary = []
    
    for(var useDict in useDictList)
    {
      allDictionary.push.apply(allDictionary, wx.getStorageSync(useDictList[useDict]))
    }

    this.setData({
      allDictionary: allDictionary
    })
  },

  onQuery(e){
    var resultArr = []
    for(var i = 0; i < 5; i++)
    {
      resultArr.push(this.data.allDictionary[i]._id)
    }
    console.log(resultArr)

    this.setData({
      isShowResultView : true,
      searchResultArr : resultArr
    })

    console.log(this.data.isShowResultView)

  },

  onCancel(){
    this.setData({
      isShowResultView : false,
      searchResultArr : []
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
  onShareAppMessage : function (res) {
    return app.onShareAppMessage(res)
  }
})