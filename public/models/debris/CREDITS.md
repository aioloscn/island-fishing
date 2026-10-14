# 漂流物模型：致谢与许可证说明

所有扫描漂流物资产均来自 [Poly Haven](https://polyhaven.com)，采用 **CC0 1.0（公有领域）**。
虽然无需署名，此处仍记录出处。资产名称保留原文，便于查找。

| 文件 | Poly Haven 资产 | 许可证 | 处理 |
|---|---|---|---|
| `dead_quiver_trunk.glb`, `dead_quiver_trunk_{albedo,normal,arm}.jpg` | [Dead Quiver Trunk](https://polyhaven.com/a/dead_quiver_trunk) | CC0 | Blender 5.2：合并、长轴朝向 +X、居中，减面为 4000／700／160 个三角形的 LOD（原始约 1.8 万）；1K 纹理未修改 |
| `dead_quiver_branch_01.glb`, `dead_quiver_branch_01_{albedo,normal,arm}.jpg` | [Dead Quiver Branch 01](https://polyhaven.com/a/dead_quiver_branch_01) | CC0 | LOD 为 2600／500／120 个三角形（原始约 1.5 万） |
| `dead_quiver_branch_02.glb`, `dead_quiver_branch_02_{albedo,normal,arm}.jpg` | [Dead Quiver Branch 02](https://polyhaven.com/a/dead_quiver_branch_02) | CC0 | LOD 为 2600／500／120 个三角形（原始约 1.4 万） |
| `lambis_shell.glb`, `lambis_shell_{albedo,normal,arm}.jpg` | [Lambis Shell](https://polyhaven.com/a/lambis_shell) | CC0 | LOD 为 1400／300／80 个三角形（原始约 1.25 万） |

纹理格式：基础色（sRGB）、OpenGL 切线空间法线、ARM（R 为环境光遮蔽，G 为粗糙度，B 为金属度），
1024×1024 JPEG。GLB 只包含几何体（网格名为 `LOD0`、`LOD1`、`LOD2`）。
由 `src/world/debris/ScannedDebris.js` 加载并打包为 2×2 纹理图集。
