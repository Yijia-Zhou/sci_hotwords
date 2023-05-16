var app = getApp()

  function updateDictInfoStatus(useDict, status)
  {
    app.globalData.dictStatus.生命科学[useDict].status = status
  }

  async function loadDictionary(useDict){
    updateDictInfoStatus(useDict, 'loading')
    const db = wx.cloud.database()
    let reqRes = await db.collection('dictionary').doc(useDict).get()
    const dataTemp = reqRes.data.dictionary

    wx.setStorage({
      key: useDict,
      data: dataTemp
    })
    updateDictInfoStatus(useDict, 'loaded')
    return dataTemp
  }

  function syncDictionary(dictionary){
    var baseDict = wx.getStorageSync('基础词库')
    if(baseDict && baseDict.length != 0)
    {
      console.log("Sync dictionary")
      for (var i in dictionary) {
        let syncItem = dictionary[i]
        let itemIndex = baseDict.findIndex((item) => item._id.toLowerCase().trim() === syncItem._id.toLowerCase().trim())
        if (itemIndex != -1) {
          if(baseDict[itemIndex].hasOwnProperty('learnt')){
            syncItem.learnt = baseDict[itemIndex].learnt
          }
          if(baseDict[itemIndex].hasOwnProperty('tested')){
            syncItem.tested = baseDict[itemIndex].tested
          }
        }
      }
    }
  }

  async function updateDictionary(useDict, dictionary){
    updateDictInfoStatus(useDict, 'loading')
    const db = wx.cloud.database()
    let reqRes = await db.collection('dictionary').doc(useDict).get()
    const dataTemp = reqRes.data.dictionary
    console.log('更新词库中', dataTemp)
    for (var i in dictionary) {
      let theOldItem = dictionary[i]
      let itemIndex = dataTemp.findIndex((item) => item._id.toLowerCase().trim() === theOldItem._id.toLowerCase().trim())
      if (itemIndex != -1) {
        dataTemp[itemIndex].learnt = theOldItem.learnt
        dataTemp[itemIndex].tested = theOldItem.tested
      }
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
    updateDictInfoStatus(useDict, 'loaded')
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
    throw "nothing_favored"
  }

  async function requestDictionary(useDict){
    var dictionary = wx.getStorageSync(useDict)
    if (!dictionary || dictionary.length==0)
    {
      wx.showLoading({ title: '获取/更新词库中，请稍候' })
      dictionary = await loadDictionary(useDict)
      syncDictionary(dictionary)
    }
    else if (wx.getStorageSync('dict_need_refresh').includes(useDict) && useDict != "我的收藏")
    {
      wx.showLoading({ title: '更新词库中，请稍候' })
      dictionary = await updateDictionary(useDict, dictionary)
    }
    wx.hideLoading()
    return dictionary
  }

  const delay = (n) => new Promise( r => setTimeout(r, n));

  async function getLocalDictionary(useDict)
  {
    var dictionary
    if(useDict != '我的收藏')
    {
      let dict = app.globalData.dictStatus.生命科学[useDict]
      while(!dict.hasOwnProperty('status') || dict.status != 'loaded')
      {
        wx.showLoading({ title: '获取/更新词库中，请稍候' })
        await delay(50)
      }
      wx.hideLoading()
    }
    return wx.getStorageSync(useDict)
  }

  async function preloadDictionary(useDict)
  {
    let dict = app.globalData.dictStatus.生命科学[useDict]
    if(dict.hasOwnProperty('status') && dict.status == 'loading')
    {
      return
    }
    var dictionary = wx.getStorageSync(useDict)
    if (!dictionary || dictionary.length == 0)
    {
      console.log("start preload loading", useDict)
      loadDictionary(useDict)
      syncDictionary(dictionary)
    }
    else if (wx.getStorageSync('dict_need_refresh').includes(useDict))
    {
      console.log("start preload updating", useDict)
      updateDictionary(useDict, dictionary)
    }
  }

module.exports.requestDictionary = requestDictionary
module.exports.preloadDictionary = preloadDictionary
module.exports.getLocalDictionary = getLocalDictionary