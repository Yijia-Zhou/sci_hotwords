var app = getApp()

 async function loadDictionary(useDict){
    wx.showLoading({
      title: '获取/更新词库中，请稍候',
    })
    const db = wx.cloud.database()
    let reqRes = await db.collection('dictionary').doc(useDict).get()
    const dataTemp = reqRes.data.dictionary

    wx.setStorage({
      key: useDict,
      data: dataTemp
    })
    return dataTemp
  }

  async function updateDictionary(useDict, dictionary){
    wx.showLoading({
      title: '更新词库中，请稍候',
    })
    const db = wx.cloud.database()
    let reqRes = await db.collection('dictionary').doc(useDict).get()
    const dataTemp = reqRes.data.dictionary
    console.log('更新词库中', dataTemp)
    for (var i in dictionary) {
      let theOldItem = dictionary[i]
      let itemIndex = dataTemp.findIndex((item) => item._id.toLowerCase() === theOldItem._id.toLowerCase())
      dataTemp[itemIndex].learnt = theOldItem.learnt
      dataTemp[itemIndex].tested = theOldItem.tested
      // 本地学习过程中在 dictionary 内添加的属性塞进更新过的词典里
    }
    wx.setStorage({
      key: useDict,
      data: dataTemp
    })
    console.log('更新词库完毕~')
    let dict_need_refresh = wx.getStorageSync('dict_need_refresh')
    dict_need_refresh.splice(dict_need_refresh.indexOf(app.globalData.dictInfo.useDict), 1)
    wx.setStorage({
      key: 'dict_need_refresh',
      data: dict_need_refresh
    })
    return dataTemp
  }

  function nothing_favored() {
    wx.showModal({
      title: "暂无收藏",
      content: "在别的词库中收藏一些词汇组后再来吧", 
      confirmText: "好的吧~",
      showCancel: false,
      success () {
        wx.removeStorageSync('我的收藏')//({key: '我的收藏'})
        wx.redirectTo({
          url: '/pages/menu/menu?no_jump=true',
        })
      }
    })
  }
  
  async function requestDictionary(useDict){
    var dictionary = wx.getStorageSync(useDict)
    if (!dictionary || dictionary.length==0)
    {
      if (useDict == '我的收藏') {
        nothing_favored()
        return
      }
      dictionary = await loadDictionary(useDict)
    }
    else if (wx.getStorageSync('dict_need_refresh').includes(useDict) && useDict != "我的收藏")
    {
      dictionary = await updateDictionary(useDict, dictionary)
    }
    wx.hideLoading()
    return dictionary
  }

module.exports.requestDictionary = requestDictionary