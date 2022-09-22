# README

### 宗旨

- 碎片时间即可随手点开识记一些专业领域内英文论文高频词汇

### 小程序试用
![小程序码题图](https://user-images.githubusercontent.com/22675861/191650369-bf00e3e4-36a1-4f21-ba81-952290b3091c.png)


### 页面（已有2个，可能再添加1个）

1. 目录选择

    - 三列picker, 选择词库与使用模式
        ![image](https://user-images.githubusercontent.com/22675861/191643546-4ed67ef1-81b6-4e9d-bcbd-e4fdaf91bb59.png)


        - 识记模式即为普通模式

        - 检验模式目前只是单纯开始不显示释义、点一下后才显示，之后可能会重新设计但还完全没有具体想法和计划

    - 之后可能添加一个进入查词页面的按钮，考虑做成脚踏板状放在最底下

2. 词库识记
    ![image](https://user-images.githubusercontent.com/22675861/191644756-dd430427-d9c5-45f4-92a2-dc73e7627f19.png)


    - 词频前四高的衍生词会被显示在衍生词框中

        - 点击单个衍生词则弹出其单独释义

        - 如衍生词超过4个则显示“更多衍生词”按钮，点击后进入所有衍生词列表界面

    - 点击“我记住了”将当前词组在本词库、本模式中标记为“已掌握”( `word.js` 中的 `onDone`), “还要努力”则单纯暂时切换至下一个词组

    - 之后的计划们

        - [ ] 首次进入词库几秒后跳出弹窗，询问是否屏蔽高中/大四/大六等水平的单词
        - [ ] 连续n次选择“记住了”则跳出一个弹窗，询问是否直接向后跳转一段
        - [ ] 选择暂不则边角生成一个按钮，可随时选择跳转，一段时间不选择则可考虑让其消失
          - 按钮设计：脚踏板状？
            - 一个设置屏蔽等级（高中/大四/大六等，图标为禁止符）
            - 一个进行向后跳跃（图标为快进）；向后跳跃过的也可加入一个跳跃回来的按钮（图标为快退）
              - 具体连续几个记住后询问以及跳转多远可实验确定，跳转多远也可做成拨轮供选择
        - [ ] 共勉小挂牌
          - 参考微信读书进度提示样式：“有??% 学习者本次也……”
            - 后续补个图（逃

3. 之后考虑添加一个查询页面

    - （仅有初步想法）输入待查词，在各专业词库中查询，显示最符合的单词（包含衍生词），然后显示其所在词组卡片及其单独释义
