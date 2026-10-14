# 将 Tidewater 从 three.js／TSL 移植到原生 WebGPU + WGSL

分支为 `webgpu-native`。目标是 `src/` 中不再导入 `three`，同时保持与 `main` 相同的外观和行为。
three.js 版本（位于 `main` 和 `../threejs-water-claude`）作为参考：移植前阅读原文件，
保留结构、名称、常量和注释，忠实地把 TSL 转换为 WGSL，不要删减效果。
无法一比一移植时，应在文件中说明原因。

## 引擎（src/engine）

CPU 侧兼容 three（`import * as THREE from '../engine/index.js'` 可临时使用，但优先采用具名导入）：
数学类型包括 Vector2/3/4、Matrix3/4、Quaternion、Euler、Color、Box3、Sphere、Plane、Frustum、Ray、
Spherical、MathUtils、CatmullRomCurve3、ShapeUtils、Timer 和 DataUtils；
场景类型包括 Object3D、Group、Scene、Mesh、InstancedMesh、PerspectiveCamera、OrthographicCamera 和 Layers；
几何类型包括 BufferGeometry、所有属性类，以及 Plane/Box/Sphere/Cylinder/Cone/Circle/Torus/Lathe/
Icosahedron/Tube/RoundedBox 几何体和 mergeGeometries/mergeVertices。
相机采用反向 Z 的 WebGPU 投影：近裁剪面深度为 1，远裁剪面为 0。

GPU 侧入口为 `src/engine/webgpu.js`：

| three / TSL | 引擎 |
|---|---|
| `renderer`, `renderer.backend.device` | `GPU` 单例： `GPU.device`, `GPU.queue`, `GPU.getEncoder()`, `GPU.submit()` |
| `uniform( v )`, `uniformArray` | `UniformBlock( 'StructName', { name: [ 'vec3f', value ], arr: [ 'vec4f[8]', [...] ] } )`; `block.fields.name.value` 是 three 风格的 `{ value }` 句柄 |
| `G.*` (core/Globals.js) | `G` 来自 `render/Frame.js`，名称相同；WGSL 中使用 `frame.sunDir`, `frame.time`, … |
| 相机节点 (`cameraPosition`, `cameraProjectionMatrix`, …) | `frame.cameraPos`, `frame.view`, `frame.proj`, `frame.viewProj` （带抖动）, `frame.viewProjNoJitter`, `frame.prevViewProjNoJitter`, `frame.invViewProj`, `frame.near`, `frame.far`, `frame.resolution` |
| `instancedArray`, `StorageBufferAttribute` | `StorageBuffer( { count, type: 'vec4f' } )` |
| `DataTexture`, `StorageTexture`, `StorageArrayTexture`, `Data3DTexture`, `RenderTarget` | `Texture( { width, height, depth, dimension, format, mips, usage: [ 'sample', 'storage', 'render', 'copySrc', 'copyDst' ], data } )`, `RenderTarget( w, h, { colors, depth } )` |
| `Fn( … )().compute( n )`, `renderer.compute()` | `ComputeKernel( { modules, bindings, code, workgroupSize } )`, `kernel.dispatch( groups )` （记录到当前帧编码器） |
| 系统间共享的 TSL 辅助函数 | `ShaderModule( { name, deps, code, bindings, uniforms } )` （见下文） |
| `NodeMaterial` / `MeshStandardNodeMaterial` / `SceneMaterial` / `MeshBasicNodeMaterial` | `Material( { vertex, surface, output, uniforms, textures, storage, varyings, attributes, … } )` — 见文件头部说明： `render/Material.js` |
| `positionNode` （局部空间） | `vertex` 代码片段： `v.position`, `v.normal`, `v.worldOffset`，或 `v.useWorld = true; v.worldPos = …` |
| `colorNode`, `roughnessNode`, `normalNode`, `aoNode`, `emissiveNode`, `opacityNode`, `maskNode` | `surface` 代码片段写入 `s.albedo`, `s.roughness`, `s.normal` （世界空间！）, `s.ao`, `s.emissive`, `s.alpha` (+ `alphaTest`) |
| `outputNode`, `mrtNode` | `output` 代码片段： `r.color`, `r.velocity`, `r.mask` |
| `material.translucencyNode` | `s.translucency` （vec3，与光源颜色相乘） |
| `SceneLighting.directModulation` 等 | `SceneLighting.set( 'directModulation', module )` 使用 `fn hookDirectModulation( P, N ) -> vec3f` — 见 `render/wgsl/lighting.js` |
| `material.underwaterLighting`, `appliesHillShadow`, `localLightsCheap` | 相同的材质选项；钩子将其读取为宏定义 `UNDERWATER_LIGHTING` (0/1/2), `HILL_SHADOW_SELF`, `LOCAL_LIGHTS_CHEAP` |
| `useStaticVelocity( obj )` | `obj.staticVelocity = true` （逐对象设置；上一帧模型矩阵等于当前矩阵） |
| CSM / `SoftCSMShadowNode` | `SunShadows` (render/Shadows.js)；接收阴影的对象在 `shadeSurface` 中自动采样 `sunShadow( P, N, pixel )` |
| 后期处理通道 (`rtt`, `pass`, QuadMesh) | `FullscreenPass( { code, bindings, colorFormats } )`，或计算内核 |
| `renderer.render( scene, camera )` 渲染到目标 | `meshRenderer.render( scene, { camera, kind: 'color', colorViews, colorFormats, depthView, … } )` |
| `GLTFLoader` + `SkinnedMesh` / `AnimationMixer` | `loadGLB( url )` (engine/loaders/GLTF.js) + `SkinnedModel.create( gltf )` (engine/render/Skinning.js): `model.group`, `model.play( clip, { fade, loop, speed } )`, `model.update( dt )`；在材质顶点钩子中进行 GPU 蒙皮（属性 `skinIndex` 为 vec4u，`skinWeight` 为 vec4f；骨骼存于存储缓冲区，同时保存上一帧骨骼用于运动向量），阴影使用相同蒙皮方式 |
| 异步回读 (`getArrayBufferAsync`) | `Readback` （暂存缓冲区环）, `readBuffer` / `readTexture` 用于单次读取 |
| `mx_noise_float`, `mx_fractal_noise_float`, `mx_worley_noise_vec2`, `mx_cell_noise_float`, `hash`, `interleavedGradientNoise`, `vogelDiskSample`, `luminance`, `perturbNormal` | `commonModule` (render/wgsl/common.js): `mx_noise_float3/2`, `mx_fractal_noise_float3`, `mx_worley_noise_vec2_3/2`, `mx_cell_noise_float3/2`, `hash11/21/31/22/33`, `interleavedGradientNoise`, `vogelDiskSample`, `luminance`, `perturbNormalByHeight`, `perturbNormalByMap`, 深度辅助函数 `viewDepth`, `worldFromDepth`, `projectToUv` |

绑定组：第 0 组是 `frame` 与共享采样器（`smpLinearRepeat`、`smpLinearClamp`、`smpLinearMirror`、
`smpAnisoRepeat`、`smpAnisoClamp`、`smpNearestClamp`、`smpNearestRepeat`、`smpShadow`），
应使用这些共享采样器，而不是为每个纹理单独创建。第 1 组是模块与材质资源，自动组合；第 2 组是逐次绘制资源。

速度约定（`sceneRT.textures[1]`）：xy 表示 UV 空间运动，即当前位置减去上一帧位置（UV 的 y 轴向下）。

深度采用反向 Z、`depth32float`，清除值为 0；天空像素深度为 0。
线性距离通过 `viewDepth( d )` 获取。

## 系统间共享 WGSL：ShaderModule 命名

系统原先向其他系统提供 TSL 函数（`terrainGPU.heightAt( xz )`、`clouds.shadow( xz )`、
`shoreSim.sample( xz )` 等），现在通过实例的 `this.module`（`ShaderModule`）暴露。
WGSL 函数采用下表前缀，命名为 `<prefix><Method>`；结构体命名为 `<Prefix><Name>`，
绑定与 uniform 块使用相同前缀（每个着色器的绑定共享一个命名空间）。
TSL 返回对象的地方应改为返回结构体，例如 `shore.evaluate` 对应 `fn shoreEvaluate( … ) -> ShoreSample`。
在文件头部注释中记录模块提供的函数。

| 实例 | 前缀 | 示例 |
|---|---|---|
| TerrainGPU | `terrain` | `terrainHeightAt( xz: vec2f ) -> f32`, `terrainSunShadowAt( P: vec3f ) -> f32`, `terrainNormalAt`, `terrainNormalRock`, `terrainShoreSample`, `terrainUvOf` |
| OceanFFT | `ocean` | 绑定 `oceanDisplacement`, `oceanDerivatives` (texture_2d_array), uniform 参数 `oceanParams` |
| WaterSurface | `waterSurface` | `waterSurfaceCascadeAttenuation( c: i32, depth: f32 ) -> f32`, `waterSurfaceVertex` |
| ShoreWaves | `shore` | `shoreEvaluate`, `shorePhaseAt`, `shoreShape`, `shoreDirAt`, … |
| ShoreSim | `shoreSim` | `shoreSimSample( xz ) -> vec4f`, `shoreSimInside`, `shoreSimUvOf`, `shoreSimSandFoam` |
| SurfFoam | `surfFoam` | `surfFoamShading` |
| Caustics | `caustics` | `causticsSample` |
| SeaDetail | `seaDetail` | `seaDetailSample` |
| WakeSim | `wake` | `wakeDisplacement` |
| WaterQuery | `waterQuery` | `waterQueryCameraState() -> vec4f`, `waterQueryHeightAt( slot: u32 ) -> f32` |
| Spray | `spray` | `sprayEmit…` （供其他内核使用的 GPU 发射器） |
| Atmosphere | `atmosphere` | `atmosphereSkyLuminance`, transmittance / sky-view LUT 绑定 |
| Sky | `sky` | `skyRadianceWithClouds( dir: vec3f, withSun: bool ) -> vec3f`, `skyReflectionRadiance` |
| Clouds | `clouds` | `cloudsShadow( xz: vec2f ) -> f32`, `cloudsSample`, `cloudsSampleView` |
| Underwater | `underwater` | |
| LocalLights | `localLights` | 安装 `localLights` 钩子 |

使用另一个尚未完成移植的开发分工所拥有的模块时，按上述名称调用，并在测试框架中提供桩实现。
保留每个类的构造器签名和公开 CPU 方法，使 App.js 只需调整导入即可完成移植。

## WGSL 注意事项

- 导数（`dpdx`、未指定 `Level` 的 `textureSample`）只能用于一致控制流：
  在依据逐像素数据分支之前计算；分支内部使用 `textureSampleLevel`／`textureSampleGrad`。
- uniform 数组需要 16 字节元素步长：使用 `vec4f[N]`，通过 `.x` 取值。
- `queue.writeBuffer` 的数据在整帧命令缓冲执行前写入；同一缓冲区一帧内写两次会保留最后的值。
  需要不同值的通道应各自使用独立的块，例如 `createViewUniforms`。
- `r32float`／`rgba32float` 仅在 `GPU.hasFloat32Filterable` 时支持过滤；
  优先使用 `rgba16float`，32 位数据则可使用 `textureLoad`。
- 存储纹理可使用 `rgba16float`、`rgba32float`、`r32float`、`rgba8unorm`、`r32uint` 等；
  `rg16float` 作为存储纹理不属于核心 WebGPU 功能。
- 每个材质的采样纹理数量尽量少于约 16 个（项目申请的上限为 32 个，但数量越少越快）。

## 测试

无界面 WebGPU（Dawn）：测试中先 `import './headless.mjs'`（见 `test/engine-smoke.mjs`），
再调用 `GPU.init( { headless: true } )`；通过 `writePNG` 输出图片并检查。
测试脚本放在 `test/`，按开发分工命名。与 three.js 版本对照时，可以从
`../threejs-water-claude` 以相同方式无界面渲染参考应用（见该项目的记忆笔记），或阅读其着色器。
不要在 5188 端口启动开发服务器，也不要修改 `../threejs-water-claude`（用户正在使用的应用）。
