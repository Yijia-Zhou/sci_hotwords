function reportShareAppInfo(newUserData) {
    const db = wx.cloud.database()
    try
    {
        newUserData.timeStamp = new Date().getTime()
        db.collection('new_user_from').add({
          data : newUserData,
          success: function() {
            console.log('newUserData report success')
          }
        })
    }
    catch(e)
    {
        console.log("failed to report shareAppInfo")
    }
    return 0
}

module.exports.reportShareAppInfo = reportShareAppInfo