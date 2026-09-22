# 分号 · 有戏表情馆

独立试用页： https://muzi2023.github.io/jiaozichaxun/emoji-special/

本目录是新的精选场，不修改 `emoji-lab/`、原网站 `index.html` 或 `tts-test/`。

## 内容

- 20 个真实 Animated WebP：12 个 Microsoft Fluent 立体反应，8 个 Party Parrot 搞怪小鸟。
- 8 种网页全屏编排：双侧礼炮、烟花大秀、金色加冕、爱心爆破、星星喷泉、冲刺穿梭、答案暴击、小鸟巡游。
- 3 套原创 ABCD 答题牌，共 12 个：漫画爆炸牌、弹力软糖牌、小人举牌。Lottie JSON 是本页新制作，不是从 GitHub 搜来的现成课堂套装。WebP 副本由浏览器逐帧渲染后生成。
- 点图发到模拟聊天区，收藏独立，支持导出具体素材清单。手机点击会展开聊天面板。

这里没有真实学生、消息服务或直播视频；试播不会向网校发送消息。

## 文件与接入

`assets/` 包含转好的20个WebP、预览PNG、来源清单与上游许可证。20个WebP总计3,013,986字节，原始动画尺寸未人为放大。

`answers/` 由验证工作流生成12个Lottie JSON和12个WebP。可直接使用WebP显示在聊天消息，或用Lottie播放器渲染JSON。

`vendor/` 固定保存 canvas-confetti 1.9.3、fireworks-js 2.10.8 和 lottie-web 5.13.0 及许可证。页面播放使用同站资源，不再运行时请求外部素材目录。

`app.js` 内包含全屏效果编排。全屏特效不是一个可独立下载的Lottie文件；需连同引擎和触发代码接入。所有效果自动结束，并提供手动停止。

收藏导出包含具体ID、地址、原作者来源、许可证、ABCD动画数据或特效配置。收藏只保存于当前浏览器。

## 来源与使用范围

1. Microsoft Fluent Animated: https://github.com/microsoft/fluentui-emoji-animated 。原始APNG转换为WebP，中文展示名为本页新增，保留MIT许可。
2. Party Parrot: https://github.com/jmhobbs/cultofthepartyparrot.com 。选择仓库hd目录，但其本质是复古线条风格，不应宣传成高清3D。素材许可混合，请对具体作品核权；网站代码MIT不等于所有角色图片都MIT。
3. canvas-confetti: https://github.com/catdad/canvas-confetti 。用于礼炮、金片、心形和星形粒子。
4. fireworks-js: https://github.com/crashmax-dev/fireworks-js 。用于真实粒子烟花。
5. ABCD矢量、星轨与圆环是本页新制作的轻量网页动画。ABCD字母直接用路径绘制，不附带任何字体文件。

## 验证

`prepare.py` 校验上游路径，转换全部20个真实多帧动画并写入尺寸、字节、帧数和SHA-256。

`qa.cjs` 检查真实素材显示、聊天、收藏导出、12个答题动画逐帧变化、8个全屏画布非空、390px布局以及发布后的公开网址。实际成功与否请查看GitHub Actions的 Curated emoji browser verification 记录，不以此文档代替测试结果。

旧目录冻结基线：`emoji-lab` tree `d2aa5656fa982622e33b173b815b0f571914db41`。新工作流在运行前验证该目录与原网站根页面没有变化。
