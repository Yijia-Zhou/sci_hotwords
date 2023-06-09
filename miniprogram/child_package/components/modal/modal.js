// child_package/components/modal/modal.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    showModal: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    preventTouchMove() {

    },

    hideModal() {
      this.setData({
        showModal: false
      })
    },

    onCancel() {
      this.hideModal()
      this.triggerEvent('cancel')
    },

    onConfirm() {
      this.hideModal()
      this.triggerEvent('confirm')
    },
  }
})
