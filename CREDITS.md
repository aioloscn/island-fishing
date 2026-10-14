# 致谢

本仓库代码以 MIT 许可证发布（见 `LICENSE`）。以下第三方资产保留各自的许可证。

## 音频：`public/audio/`

来自 [Freesound](https://freesound.org) 的 42 份实地录音，均采用
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)。虽然不要求署名，
每个文件仍在 [`public/audio/CREDITS.md`](public/audio/CREDITS.md) 中列出作者和来源链接。

录音作者：YevgVerh、straget、Alex_hears_things、chris_dagorne、bruno.auzet、felix.blume、hdfreema、
richardemoore、KaleidacousticsAudio、AugustSandberg、kyles、Pfannkuchn、200221-WeanBekker、florianreichelt、
Nox_Sound、ryansitz、SilentStrikeZ、SecureSubset、tbsounddesigns、qubodup、blaukreuz、wormer2、roboroo、
squashy555、Soojay、coalcon、dubminister、nathankwright、SorenF109、LaScienceMusicale、KEVOY、mikewest、
tosha73、paulprit、Mrthenoronha、mwchristian95、MrFossy、BranndyBottle、JoelMcDaniel、khenshom、ramattahatta、
RatBird 和 Anthousai。

## 扫描海滩漂流物：`public/models/debris/`

来自 [Poly Haven](https://polyhaven.com) 的摄影测量模型，采用
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)：

- Dead Quiver Trunk（枯死箭袋树树干）
- Dead Quiver Branch 01（枯死箭袋树树枝 01）
- Dead Quiver Branch 02（枯死箭袋树树枝 02）
- Lambis Shell（蜘蛛螺壳）

网格已减面为多个细节层级，纹理保持原样。详情见
[`public/models/debris/CREDITS.md`](public/models/debris/CREDITS.md)。

## 商贩摊位：`public/models/props/`

乔的鱼摊和玛尔塔的船具店使用 [Poly Haven](https://polyhaven.com) 的
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) 纹理和模型搭建。
以下保留资产原名以便查找：

- 纹理：Weathered Brown Planks、Weathered Planks、Worn Corrugated Iron、Weathered Peeling Timber。
- 模型：Wooden Crate 01 和 02、Wooden Bucket 01、Fish Knife、Wooden Cutting Board、Lifebuoy、Wooden
  Lantern 01、Fisherman's Hat、Wooden Table 03、Metal Jerrycan（绿色）、Plastic Jerrycan、Life Jacket、Metal
  Toolbox、Wooden Display Shelves 01。

模型通过 `tools/props/` 减面，纹理经过缩小。原始招牌、粉笔价目表和秤盘使用
[Permanent Marker](https://fonts.google.com/specimen/Permanent+Marker)（Apache 2.0）、
[Cabin Sketch](https://fonts.google.com/specimen/Cabin+Sketch)（SIL OFL 1.1）和
[Oswald](https://fonts.google.com/specimen/Oswald)（SIL OFL 1.1）排字；字体和许可证位于
`tools/props/fonts/`。中文招牌由 `tools/props/signs.mjs` 使用本机中文字体生成，
构建时的字体文件不随游戏分发。详情见
[`public/models/props/CREDITS.md`](public/models/props/CREDITS.md)。

## 座头鲸：`public/models/whale/`

这是由项目自有脚本生成的原创程序化模型。比例参考已发表的座头鲸解剖资料；
侧面轮廓临摹自 NOAA Fisheries 的插图，该插图属于美国政府作品，处于公有领域。
建模时使用的参考照片不随仓库提供。

## 角色：`public/models/characters/`

商贩（`joe.glb`、`marta.glb`）分别使用
[Microsoft Rocketbox Avatar Library](https://github.com/microsoft/Microsoft-Rocketbox) 中的
`Wood_Male_01` 和 `Female_Adult_04` 角色及待机、交谈、挥手和耸肩动画
（© Microsoft Corporation，MIT 许可证，原文见 `LICENSE-Rocketbox.md`）。
通过 `tools/characters/` 转换，包含纹理缩放、动画重定向和烘焙。
参考论文：M. Gonzalez-Franco 等，"The Rocketbox Library and the Utility of Freely Available Rigged Avatars"，
Frontiers in Virtual Reality，2020。

## 字体

[Inter](https://rsms.me/inter/) 和 [JetBrains Mono](https://www.jetbrains.com/lp/mono/)
均采用 SIL Open Font License 1.1。它们在运行时从 Google Fonts 加载，不包含在仓库中。
中文界面使用系统字体回退（微软雅黑、苹方、Noto Sans CJK 等），无需额外下载中文字库。

## 库

SMAA 面积与搜索查找纹理（`public/textures/smaa/`）来自 three.js（MIT），
其原始来源是 J. Jimenez 等人的 SMAA 参考实现（MIT）。

[Vite](https://vite.dev)（MIT）作为 npm 依赖使用，没有把库源码复制到仓库。

## 技术与参考资料

以下均为已发表的技术；项目没有包含论文中的代码。论文标题保留原文以便检索。

| 技术 | 来源 |
|---|---|
| FFT 海洋波谱 | J. Tessendorf，*Simulating Ocean Water* |
| 大气 | S. Hillaire，*A Scalable and Production Ready Sky and Atmosphere Rendering Technique*（2020） |
| 体积云建模 | A. Schneider（Guerrilla Games）的 *Nubis* 演讲 |
| 运动模糊 | M. McGuire 等，*A Reconstruction Filter for Plausible Motion Blur*（2012）；J. Jimenez，*Next Generation Post Processing in Call of Duty: Advanced Warfare*（2014） |
| 泛光 | J. Jimenez（2014） |
| 锐化（RCAS） | AMD FidelityFX Super Resolution 1 |
| SMAA／FXAA | J. Jimenez 等，*SMAA: Enhanced Subpixel Morphological Antialiasing*（2012）；T. Lottes，*FXAA*（2009）；从 three.js 的 SMAANode／FXAANode 移植（MIT） |
| 光栅化焦散 | Evan Wallace 的 *WebGL Water* 方法 |
| 破碎浪 | Guerrilla Games，*Horizon Forbidden West* 水体技术（SIGGRAPH 2022） |

云噪声、光照和采样方案（`src/sky/Clouds.js`）改编自 DRG Software Solutions 自有的
*Sky Pro WebGPU*，由版权所有者在本仓库以 MIT 许可证发布。
