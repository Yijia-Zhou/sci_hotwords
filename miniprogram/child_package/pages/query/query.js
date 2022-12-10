const app = getApp()
var dblog = require('../../../utils/dblog.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isShowResultView: false,
    searchResultArr : [],
    upperBound:100000,
    allDictionary :[]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    if (!app.globalData.hasOwnProperty('dictInfo')) {
      return setTimeout(this.onLoad, 50)
    }
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

  levenshteinDistance:function(str1, str2) {
    const len1 = str1.length
    const len2 = str2.length

    var matrix = []

    for (var i = 0; i <= len1; i++) {
      matrix[i] = new Array()
      for (let j = 0; j <= len2; j++) {
        if (i == 0) {
            matrix[i][j] = j
        } 
        else if (j == 0) {
            matrix[i][j] = i
        } 
        else {
            const temp = matrix[i - 1][j - 1] + (str1[i - 1] != str2[j - 1])
            matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, temp)
        }
      }
    }
    return matrix[len1][len2]
  },

  onQueryResult:function(src, tgt, resArray, index, isDeris){
    var distance1 = this.levenshteinDistance(src, tgt)
    var distance2 = 10000
    if(tgt.length < src.length)
    {
      distance2 = this.levenshteinDistance(src.substr(0, tgt.length), tgt)
    }
    var distance = Math.min(distance1, distance2)
    if(distance < this.data.upperBound)
    {
      var tmp = {word:src, dis:distance, idx:index, isDeris:isDeris}
      resArray.push(tmp)
      resArray.sort(function(a,b){
        return a.dis - b.dis;
      })
      if(resArray.length > 5){
        resArray.pop()
      }
    }
    this.upperBound = resArray[resArray.length - 1].dis
  },

  onQuery(e){
    var resultArr = []
    var target = e.detail.value
    if(target == ""){
      this.setData({
        isShowResultView : false,
        searchResultArr : []
      })
    }
    else{
      for(var source in this.data.allDictionary)
      {
        this.onQueryResult(this.data.allDictionary[source]._id, target, resultArr, source, false)
        for(var derisIdx in this.data.allDictionary[source].deris)
        {
          this.onQueryResult(this.data.allDictionary[source].deris[derisIdx].word, target, resultArr, source, true)
        }
      }
      this.setData({
        isShowResultView : true,
        searchResultArr : resultArr
      })
    }
  },

  onCancel(){
    this.setData({
      isShowResultView : false,
      searchResultArr : [],
      inputValue :""
    })
  },

  toResult(e){
    console.log(e.currentTarget)
    var resultIndex = e.currentTarget.dataset["resultindex"]
    console.log(resultIndex)
    wx.setStorageSync('resultWord', this.data.allDictionary[resultIndex])
    wx.navigateTo({
        url: '../result/result'
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