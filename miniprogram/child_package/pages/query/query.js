const app = getApp()
var dblog = require('../../../utils/dblog.js')
var requestDict = require('../../../utils/requestDict.js')

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
  onLoad : async function() {
    if (!app.globalData.hasOwnProperty('dictInfo')) {
      return setTimeout(this.onLoad, 50)
    }
    console.log("query on load")
    wx.setNavigationBarTitle({title: '词汇查询'})
    dblog.logAction("onQuery")

    var useDictList = wx.getStorageSync('dictInfo').useDictList

    var allDictionary = []
    
    for(var useDict in useDictList)
    {
      await requestDict.requestDictionary(useDictList[useDict])
      allDictionary.push.apply(allDictionary, wx.getStorageSync(useDictList[useDict]))
    }

    wx.hideLoading()

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

  onQueryResult:function(src, tgt, resArray, index, derisIndex){
    var distance1 = this.levenshteinDistance(src, tgt)
    var distance2 = 10000
    if(tgt.length < src.length)
    {
      distance2 = this.levenshteinDistance(src.substr(0, tgt.length), tgt)
    }
    var distance = Math.min(distance1, distance2)
    if(distance < this.data.upperBound)
    {
      var tmp = {dis:distance, idx:index, derisIdx:derisIndex}
      resArray.push(tmp)
      resArray.sort(function(a,b){
        return a.dis - b.dis;
      })
      if(resArray.length > 8){
        resArray.pop()
      }
    }
    this.upperBound = resArray[resArray.length - 1].dis
  },

  onQuery(e){
    var resultArr = []
    var resultArrWithCN = []
    var target = e.detail.value
    console.log(target)
    if(target == ""){
      this.setData({
        isShowResultView : false,
        searchResultArr : []
      })
    }
    else{
      for(var source in this.data.allDictionary)
      {
        var dictionaryWord = this.data.allDictionary[source]
        this.onQueryResult(dictionaryWord._id, target, resultArr, source, -1)
        for(var derisIdx in dictionaryWord.deris)
        {
          this.onQueryResult(dictionaryWord.deris[derisIdx].word, target, resultArr, source, derisIdx)
        }
      }

      for(var resultIdx in resultArr)
      {
        var resultWordIdx = resultArr[resultIdx].idx
        var resultDerisIdx = resultArr[resultIdx].derisIdx
        var resultWord = this.data.allDictionary[resultWordIdx]
        var word,translation

        if(resultDerisIdx != -1)
        {
          word = resultWord.deris[resultDerisIdx].word
          translation = resultWord.deris[resultDerisIdx].bing
        }
        else
        {
          word = resultWord._id
          translation = resultWord.chosen[0]
        }
        var tmp = {idx:resultWordIdx, derisIdx:resultDerisIdx, word:word, translation:translation}
        resultArrWithCN.push(tmp)
      }

      this.setData({
        isShowResultView : true,
        searchResultArr : resultArrWithCN
      })
    }
  },

  onReturn() {
    wx.redirectTo({
      url: '/pages/menu/menu',
    })
  },

  toResult(e){
    var resultIndex = e.currentTarget.dataset["resultindex"]
    app.globalData.resultWord = this.data.allDictionary[resultIndex]
    app.globalData.dictInfo.useMode = '识记模式'
    wx.navigateTo({
      url: '../result/result'
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage : function (res) {
    return app.onShareAppMessage(res)
  }
})