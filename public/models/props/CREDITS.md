# 商贩摊位资产：致谢与许可证说明

纹理和模型来自 [Poly Haven](https://polyhaven.com)，采用 **CC0 1.0（公有领域）**。
虽然无需署名，此处仍记录出处。通过 `tools/props/`（fetch.py、decimate.py、build.mjs）构建，
由 `src/game/StallKit.js` 使用（乔的鱼摊、玛尔塔的船具店）。资产名称保留原文，便于查找。

| 文件 | Poly Haven 资产 | 许可证 | 处理 |
|---|---|---|---|
| `s_weathered_brown_planks_{a,n,r}.jpg` | [Weathered Brown Planks](https://polyhaven.com/a/weathered_brown_planks) | CC0 | 1K，未修改 |
| `s_weathered_planks_{a,n,r}.jpg` | [Weathered Planks](https://polyhaven.com/a/weathered_planks) | CC0 | 1K，未修改 |
| `s_worn_corrugated_iron_{a,n,r}.jpg` | [Worn Corrugated Iron](https://polyhaven.com/a/worn_corrugated_iron) | CC0 | 1K，未修改 |
| `s_weathered_peeling_timber_{a,n,r}.jpg` | [Weathered Peeling Timber](https://polyhaven.com/a/weathered_peeling_timber) | CC0 | 1K，未修改 |
| `p_wooden_crate_02_*`（位于 `props.bin`） | [Wooden Crate 02](https://polyhaven.com/a/wooden_crate_02) | CC0 | Blender 减面至 3497 个三角形；512 像素纹理 |
| `p_wooden_crate_01_*`（位于 `props.bin`） | [Wooden Crate 01](https://polyhaven.com/a/wooden_crate_01) | CC0 | Blender 减面至 3497 个三角形；512 像素纹理 |
| `p_wooden_bucket_01_*`（位于 `props.bin`） | [Wooden Bucket 01](https://polyhaven.com/a/wooden_bucket_01) | CC0 | Blender 减面至 2997 个三角形；512 像素纹理 |
| `p_fish_knife_*`（位于 `props.bin`） | [Fish Knife](https://polyhaven.com/a/fish_knife) | CC0 | Blender 减面至 1498 个三角形；512 像素纹理 |
| `p_wooden_cutting_board_*`（位于 `props.bin`） | [Wooden Cutting Board](https://polyhaven.com/a/wooden_cutting_board) | CC0 | Blender 减面至 1499 个三角形；512 像素纹理 |
| `p_lifebuoy_*`（位于 `props.bin`） | [Lifebuoy](https://polyhaven.com/a/lifebuoy) | CC0 | Blender 减面至 3500 个三角形；512 像素纹理 |
| `p_wooden_lantern_01_*`（位于 `props.bin`） | [Wooden Lantern 01](https://polyhaven.com/a/wooden_lantern_01) | CC0 | Blender 减面至 3998 个三角形；512 像素纹理 |
| `p_fishermans_hat_*`（位于 `props.bin`） | [Fisherman's Hat](https://polyhaven.com/a/fishermans_hat) | CC0 | Blender 减面至 3000 个三角形；512 像素纹理 |
| `p_WoodenTable_03_*`（位于 `props.bin`） | [Wooden Table 03](https://polyhaven.com/a/WoodenTable_03) | CC0 | Blender 减面至 2298 个三角形；512 像素纹理 |
| `p_metal_jerrycan_green_*`（位于 `props.bin`） | [Metal Jerrycan Green](https://polyhaven.com/a/metal_jerrycan_green) | CC0 | Blender 减面至 3497 个三角形；512 像素纹理 |
| `p_plastic_jerrycan_*`（位于 `props.bin`） | [Plastic Jerrycan](https://polyhaven.com/a/plastic_jerrycan) | CC0 | Blender 减面至 3000 个三角形；512 像素纹理 |
| `p_life_jacket_*`（位于 `props.bin`） | [Life Jacket](https://polyhaven.com/a/life_jacket) | CC0 | Blender 减面至 4000 个三角形；512 像素纹理 |
| `p_metal_toolbox_*`（位于 `props.bin`） | [Metal Toolbox](https://polyhaven.com/a/metal_toolbox) | CC0 | Blender 减面至 4495 个三角形；512 像素纹理 |
| `p_wooden_display_shelves_01_*`（位于 `props.bin`） | [Wooden Display Shelves 01](https://polyhaven.com/a/wooden_display_shelves_01) | CC0 | Blender 减面至 3174 个三角形；512 像素纹理 |

`signs.png`（摊位招牌、粉笔价目表和秤盘）最初由 `tools/props/build.mjs` 使用 ImageMagick 绘制，
采用 Permanent Marker（Apache 2.0）、Cabin Sketch 和 Oswald（SIL OFL 1.1）字体。
字体文件与许可证原文位于 `tools/props/fonts/`。中文版本由 `tools/props/signs.mjs` 生成，
使用本机中文字体，字体文件不随游戏分发。

纹理格式：基础色（sRGB）、OpenGL 法线、ARM（R 为环境光遮蔽，G 为粗糙度，B 为金属度），JPEG。
