const app = getApp()
var dblog = require('../../../utils/dblog.js')
var requestDict = require('../../../utils/requestDict.js')
const DictionaryLoader = new requestDict.DictionaryLoader()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    isShowResultView: false,
    searchResultArr : [],
    upperBound:100000,
    allDictionary : [],
    dictionaryOrder : []
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

    var useClusterList = Object.keys(wx.getStorageSync('dictInfo').dictNames)

    for(let useCluster in useClusterList)
    {
      var useDictList = Object.keys(wx.getStorageSync('dictInfo').dictNames[useClusterList[useCluster]])
  
      var allDictionary = []
      var dictionaryOrder = []
      let totalLen = 0

      dictionaryOrder[useClusterList[useCluster]] = []
      
      for(let useDict in useDictList)
      {
        allDictionary.push.apply(allDictionary, await DictionaryLoader.getDictionarySync(useDictList[useDict])) 
        totalLen += wx.getStorageSync(useDictList[useDict]).length
        dictionaryOrder[useClusterList[useCluster]][useDictList[useDict]] = totalLen;
      }
    }

    this.data.allDictionary = allDictionary
    this.data.dictionaryOrder = dictionaryOrder
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
    let resultArr = []
    let resultArrWithCN = []
    let target = e.detail.value
    console.log(target)
    if(target == ""){
      this.setData({
        isShowResultView : false,
        searchResultArr : []
      })
    }
    else{
      for(let source in this.data.allDictionary)
      {
        var dictionaryWord = this.data.allDictionary[source]
        this.onQueryResult(dictionaryWord._id, target, resultArr, source, -1)
        for(var derisIdx in dictionaryWord.deris)
        {
          this.onQueryResult(dictionaryWord.deris[derisIdx].word, target, resultArr, source, derisIdx)
        }
      }

      for(let resultIdx in resultArr)
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

        for(let clusterKey in this.data.dictionaryOrder)
        {
          for(let dictKey in this.data.dictionaryOrder[clusterKey])
          {
            if(resultWordIdx < this.data.dictionaryOrder[clusterKey][dictKey])
            {
              let paper_count = app.globalData.dictInfo.dictNames[clusterKey][dictKey].paper_count
              var fre = resultWord.total_count / paper_count
              break
            }
          }
        }

        let tmp = {idx:resultWordIdx, derisIdx:resultDerisIdx, word:word, 
                   translation:translation, fre: fre}
        let isRepeat = false

        resultArrWithCN.forEach(list=>{
          if(list.word == tmp.word)
          {
            isRepeat = true
            if(tmp.fre > list.fre) 
            {
              list.idx = tmp.idx
              list.derisIdx = tmp.derisIdx
              list.word = tmp.word
              list.translation = tmp.translation
              list.fre = tmp.fre
            }
          }
        })

        if(!isRepeat)
        {
          resultArrWithCN.push(tmp)
        }
      }

      this.setData({
        isShowResultView : true,
        searchResultArr : resultArrWithCN
      })
    }
  },

  onReturn() {
    wx.redirectTo({
      url: '/pages/menu/menu?no_jump=true',
    })
  },

  toResult(e){
    let resultIndex = e.currentTarget.dataset["resultindex"]
    let derisIndex = e.currentTarget.dataset["derisindex"]
    app.globalData.resultWord = this.data.allDictionary[resultIndex]
    console.log(this.data.dictionaryOrder)
    for(let clusterKey in this.data.dictionaryOrder)
    {
      for(let dictKey in this.data.dictionaryOrder[clusterKey])
      {
          if(resultIndex < this.data.dictionaryOrder[clusterKey][dictKey])
          {
            app.globalData.resultWord.fromCluster = clusterKey
            app.globalData.resultWord.fromDict = dictKey
            break
          }
      }
    }
    app.globalData.resultWord.derisIndex = derisIndex
    console.log("result word : ", app.globalData.resultWord)
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