# 测试地图：哪个功能由哪组测试管

一键全跑：`npm test`（自己起服务器，逐组串行跑，最后跑穿模检查）。
只跑一部分：`npm test -- 名字里的词`，例如 `npm test -- pro pay`。

| 功能 | 源码（src/…） | 测试组（npm test 里的名字 → 文件） |
|---|---|---|
| 添加、完成、撤销、编辑、置顶、导出、锁屏卡片 | app/03-lists、04-add、05-edit | core → verify.cjs |
| 完成后的排序、滚动、碎裂动画、恢复 | app/03-lists、16-feel | completion → verify-completion.cjs |
| 导入合并/替换、备份往返、新的一天、重复、历史、网页锁屏通知 | app/06-new-day、07-lock-notification、08-backup | beta → verify-beta.cjs |
| 编辑面板、日期（以后/逾期）、每周重复、自定义分组、隐私 | app/05-edit、10-groups | v1-review → verify-v1.cjs |
| 时长与计时、完成记录、周/月回顾、海报 | app/11-review、15-timer | v2-timer-review → verify-v2.cjs |
| 配色、重复标记、日期/时间选择 | app/00-core、04-add | v17-palette → verify-v17.cjs |
| 玻璃/纸墨/夜光、英文界面 | app/00-core、i18n.js | v19-looks → verify-v19.cjs |
| 备份提醒、添加面板默认值、动效、图标动画 | app/08-backup、04-add、motion.js | v116-motion → verify-v116.cjs |
| 1.18 的修正 | 多处 | v118 → verify-v118.cjs |
| 每个外观 × 每个画面都放得下、对比度 | CSS | layout → verify-layout.cjs |
| Pro 主题、特效、碎片罐、每周碎片画、倒数日、清空时刻 | pro/* | pro → verify-pro.cjs |
| 付款流程（连本地订单服务器） | pro/03-pay-platform、04-live-purchase、05-checkout | pay → verify-pay.cjs |
| 订单 / 授权服务器 | server/ | server → verify-server.cjs |
| iPhone 外壳的桥接 | ios/App/WebShell.swift、app/17-events-and-api | ios-bridge → verify-ios-bridge.cjs |
| 安卓外壳的桥接 | android/、app/17-events-and-api | android-bridge → verify-android-bridge.cjs |
| 离线、更新提示 | sw.js、pwa.js | pwa → verify-pwa.cjs（自带服务器） |
| 穿模：文字互压、角标/选中框压字、截断、装饰溢出 | CSS | overlap → verify-overlap.cjs |

## 改 CSS 之前

    npm run visual:save       # 先存基准图（11 个外观 × 12 个画面 × 手机/iPad 竖/横）
    …改…
    npm run visual:compare    # 和基准逐像素比，列出所有变了的画面，变化处标红存在 test-results/visual/

只想看一部分：`SIZES=phone LOOKS=glass,dawn SCREENS=home,add npm run visual:compare`。
