var app = getApp()

function reportShareAppInfo(openId) {
    const db = wx.cloud.database()
    try
    {
        db.collection('new_user_from').add({
          data : {
            fromOpenId: openId,
            type:'user shared'
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