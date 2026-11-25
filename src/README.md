# 网页源码（src/）

`app/app.js` 和 `app/pro.js` 是**生成出来的**，不要直接改。改这里的功能文件，然后运行：

    node scripts/build-web.cjs          # 拼出 app/app.js、app/pro.js，并更新 app/sw.js 的缓存版本
    node scripts/build-web.cjs --check  # 只检查不写（打包流水线会跑，对不上就失败）

每个文件夹里的 `NN-名字.js` 按编号顺序拼在 `_open.js` 后面，最后补上 `})();`。
同一个文件夹里的所有文件共用一个作用域：后面的文件可以直接用前面文件声明的变量和函数
（`state`、`render()`、`$()` …），所以**新文件按依赖放在合适的编号位置**。

## src/app（免费版主体，原 app.js）

| 文件 | 内容 |
|---|---|
| 00-core | 常量、存储键、默认分组、工具函数（`$`、`esc`、`newId` …） |
| 01-dates | 日期 |
| 02-validation | 数据校验：本地存档、导入、原生 App 写回都走这一条 |
| 03-lists | 清单渲染 |
| 04-add | 添加面板（手机底部弹出 / 宽屏内嵌），含「+ 新建分组」 |
| 05-edit | 编辑面板 |
| 06-new-day | 新的一天：重复待办复位、昨天完成的移入历史 |
| 07-lock-notification | 网页版的锁屏通知 |
| 08-backup | 备份导出 / 导入 |
| 09-install | 添加到主屏幕的引导 |
| 10-groups | 分组 |
| 11-review | 回顾（周 / 月）和海报 |
| 12-quick-add | 快速输入解析（明天、周五、30分钟、#分组 …） |
| 13-reminders | 定时提醒 |
| 14-search | 搜索 |
| 15-timer | 计时 |
| 16-feel | 手感：震动、滑动 |
| 17-events-and-api | 事件绑定，以及给 Pro、测试和原生外壳用的 `window.suisui` |

## src/pro（Pro，原 pro.js）

| 文件 | 内容 |
|---|---|
| 00-core | 入口常量、价格 |
| 01-themes | 7 套主题的定义 |
| 02-entitlement | 是否已购买 / 试用 |
| 03-pay-platform | 各平台怎么付款 |
| 04-live-purchase | 真实购买（安卓、网页） |
| 05-checkout | 付款页 |
| 06-helpers | 小工具 |
| 07-sound | 完成音效 |
| 08-effects | 完成特效 |
| 09-jar | 碎片罐 |
| 10-weekly-art | 每周碎片画 |
| 11-demo-data | 预览用的示例数据 |
| 12-apply-theme | 把主题应用到 App |
| 13-entries | 各处进入 Pro 的入口 |
| 14-pro-page | Pro 介绍页 |
| 15-showcase | 主题展示 |
| 16-jar-page | 碎片罐页面 |
| 17-countdown | 倒数日 |
| 18-clear-moment | 清空时刻 |
| 19-wiring | 启动与事件 |
