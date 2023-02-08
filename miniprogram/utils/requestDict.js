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
      // 目前因为基本不会改动词库中词的数目，所以是把旧词库各词组属性存入新词库同一个 index 中，但有空可以改成用 word 作为 key 更好
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

  async function requestDictionary(useDict){
    var dictionary = wx.getStorageSync(useDict)
    if (!dictionary || dictionary.length==0)
    {
      dictionary = await loadDictionary(useDict)
    }
    else if (wx.getStorageSync('dict_need_refresh').includes(useDict))
    {
      dictionary = await updateDictionary(useDict, dictionary)
    }
    wx.hideLoading()
    return dictionary
  }

module.exports.requestDictionary = requestDictionary