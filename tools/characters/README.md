# 角色

商贩（鱼摊的乔和船具店的玛尔塔）来自
[Microsoft Rocketbox](https://github.com/microsoft/Microsoft-Rocketbox) 角色库，采用 MIT
许可证（`public/models/characters/LICENSE-Rocketbox.md`）。每个角色离线转换为一个 GLB
（`public/models/characters/joe.glb`、`marta.glb`），包含约 7500 个三角形的网格、
80 根骨骼的 Bip01 蒙皮、1024² 纹理及下列动画片段。

```sh
tools/characters/build.sh [workdir]      # 下载 → 处理纹理 → Blender → public/models/characters/
```

- `fetch.sh`：从 Rocketbox 仓库下载单个文件，优先使用 Git LFS 媒体地址，回退到原始文件地址。
- `textures.sh`：把 2048² TGA 贴图转换为 1024² JPEG／PNG；高光贴图转换为 ORM 纹理的粗糙度通道
  （R 为 1，G 为粗糙度 = 0.92 − 0.6 × 高光，B 为金属度 0）；透明贴图（头发、睫毛）保留 alpha。
- `convert.py`（需要 Blender 4.2+，已在 5.2 测试，后台运行）：导入角色，建立可导出为 glTF
  的材质（`body`、`head`、`opacity`），逐个导入动画 FBX，并按骨骼名称在世界空间重定向。
  动画骨架的静止姿态是双臂下垂，角色则是 T 字姿态，因此不能直接复制局部旋转。
  每根角色骨骼复制对应动画骨骼的世界旋转（骨盆还复制位置），随后烘焙结果。
  每个动画片段使用一条 NLA 轨道，导出为 glTF 动画。

动画片段采用原地播放的 `motextr_static` 版本，男性前缀为 `m_`，女性前缀为 `f_`：
`idle_neutral_01`、`idle_breathe_01`、`idle_look_around_01`、`gestic_talk_neutral_01`、
`gestic_talk_relaxed_01`、`wave_01`、`gestic_shrug_01`。

运行时由 `engine/loaders/GLTF.js`（`loadGLB`）和 `engine/render/Skinning.js`
（`SkinnedModel`：动画交叉淡化、GPU 蒙皮、运动向量和阴影）处理；
`game/Vendor.js` 在角色加载完成后替换占位人物。
`test/character-smoke.mjs <glb> <out.png> [clip]` 可以无界面渲染单个角色。
