# 商贩摊位资产

从 Poly Haven 的 CC0 下载素材构建 `public/models/props/`，供乔的鱼摊和玛尔塔的船具店使用
（见 `src/game/StallKit.js`）。

```sh
python3 tools/props/fetch.py                                             # 下载到 tools/props/.raw（Git 忽略）
/Applications/Blender.app/Contents/MacOS/Blender -b -P tools/props/decimate.py   # 减面后的副本放在 .raw/dec
node tools/props/build.mjs                                               # 需要 ImageMagick（magick）
```

`build.mjs` 把所有模型打包到 `props.bin`／`props.json`（每个顶点含位置、法线、UV 和纹理层），
写出 512 像素道具纹理和 1K 表面纹理，并生成 `signs.png`（招牌、粉笔价目表和秤盘）。
原版使用的字体保留在 `fonts/`，采用 Apache 2.0／SIL OFL 1.1 许可证，许可证原文随文件提供。

添加道具时，在 `fetch.py` 的 `MOD`、`build.mjs` 的 `MODELS` 和 `decimate.py` 的 `BUDGET`
中加入对应的 Poly Haven ID，重新构建后用 `KitBuilder.prop( name, matrix )` 放置。

## 中文招牌

`signs.mjs` 单独生成 2048×1024 的透明招牌图集，不需要重新下载或转换模型。
使用 `SIGN_FONT_FAMILY` 指定本机安装的中文字体名称（例如微软雅黑、苹方或 Noto Sans CJK SC）；
字体只在构建时使用，不复制进仓库。默认字体回退依次为微软雅黑、苹方、
Noto Sans CJK SC 和 sans-serif。生成器需要 ImageMagick（`magick`）。

```sh
node tools/props/signs.mjs
# 自定义字体示例（POSIX shell）：
SIGN_FONT_FAMILY="Noto Sans CJK SC" node tools/props/signs.mjs
```
