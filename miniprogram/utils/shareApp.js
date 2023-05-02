var app = getApp()

function reportShareAppInfo(openId, scene) {
    const db = wx.cloud.database()
    try
    {
        db.collection('new_user_from').add({
          data : {
            fromOpenId: openId,
            scene:scene
          },
          success: function() {
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