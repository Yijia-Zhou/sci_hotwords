# README

### 宗旨

- 碎片时间即可随手点开识记一些专业领域内英文论文高频词汇

### 面向用户
![小程序码题图](https://user-images.githubusercontent.com/22675861/191650369-bf00e3e4-36a1-4f21-ba81-952290b3091c.png)

- [一些介绍和推广什么的](https://github.com/Yijia-Zhou/sci_hotwords/issues/14)

### 页面（已有2个，可能再添加1个）

1. 目录选择

    - ![image](https://user-images.githubusercontent.com/22675861/191643546-4ed67ef1-81b6-4e9d-bcbd-e4fdaf91bb59.png)
  
    - 三列picker, 选择词库与使用模式
        
        - 识记模式即为普通模式

        - 检验模式目前只是单纯开始不显示释义、点一下后才显示，之后可能会重新设计但还完全没有具体想法和计划
         
        - js 中的逻辑代码单纯都是为了让这个 picker 正常运行起来

    - 之后可能添加一个进入查词页面的按钮，考虑做成脚踏板状放在最底下

2. 词库识记

    - ![image](https://user-images.githubusercontent.com/22675861/191644756-dd430427-d9c5-45f4-92a2-dc73e7627f19.png)

    - 核心逻辑链条？
      1. `onLoad` 方法将词库数据从数据库/本地Storage中加载、预处理并渲染至页面中（指进行`this.setData()`）
      2. `onDone` 和 `onNext` 根据用户选择对词库数据进行更新
         - 更新词库 index 指向（让页面渲染下一个要识记的词汇组）
         - 记录掌握情况（`.learnt` & `.tested`）
      3. `onHide` 将相关数据写入 Storage 中进行持久化

    - 词频前四高的衍生词会被显示在衍生词框中

      - 点击单个衍生词则弹出其单独释义

      - 如衍生词超过4个则显示“更多衍生词”按钮，点击后进入所有衍生词列表界面

    - 点击“我记住了”将当前词组在本词库、本模式中标记为“已掌握”( `word.js` 中的 `onDone`), “还要努力”则单纯暂时切换至下一个词组（`onNext`）

3. 之后考虑添加一个查询页面

    - （仅有初步想法）输入待查词，在各专业词库中查询，显示最符合的单词（包含衍生词），然后显示其所在词组卡片及其单独释义

### "贡献流程？"与待开发需求

- 现在各种打算开发的想法都列到了 issue 里并打上了 ToDo 标签
  - [所有有效的 ToDo issues 清单](https://github.com/Yijia-Zhou/sci_hotwords/issues?q=is%3Aissue+is%3Aopen+label%3AToDo)
- 有各种相关想法都可以随时新建/回复 issue 讨论，尤其是打了“有待完善的想法”标签的←_←
- 可以随时认领感兴趣的 issue - 指 assign 给自己
  
  ![image](https://user-images.githubusercontent.com/22675861/191906009-5bfb6d6d-0b60-469a-82fa-36816d816d52.png)

- 具体开发时从dev进行分支，在开发者工具中测试完成后可向dev分支提 Pull Request, dev分支尽量与当前体验版同步，体验版在一些代表性机型上测试无明显问题后发布至正式版，正式版发布后将相关内容合并至master
  - 在微信开发者工具中“上传”会设为体验版，可通过下面二维码打开体验版测试

    ![image](https://user-images.githubusercontent.com/22675861/191907196-cd995282-6080-44fc-a6c5-8b297d1b674c.png)
  - 此为初步尝试流程（x
  - PR 最好在侧边栏 *Development* 处链接一下对应的 issue

    ![image](https://user-images.githubusercontent.com/22675861/192129289-4805ec64-39f2-41d5-b182-4a4ae4901d67.png)
