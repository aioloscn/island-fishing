# 音频构建（钓鱼音效）

从 Freesound 的 CC0 预览音频重新构建 `public/audio/` 中的钓鱼音效。需要 Node.js 和
支持 libopus 的 ffmpeg。所有声音都来自真实录音，没有合成音效；来源和许可证见
`public/audio/CREDITS.md`。

```sh
cd tools/audio
node search.mjs "fishing reel"          # 仅搜索 CC0：输出 id:用户名、时长、下载量、标题
node dl.mjs 509902:tosha73 507070:paulprit 450849:kyles 371313:Mrthenoronha 725426:mwchristian95 \
  523282:MrFossy 464697:BranndyBottle 849752:JoelMcDaniel 537084:khenshom 507094:paulprit \
  507093:paulprit 649003:ramattahatta 570208:RatBird 336585:Anthousai
                                         # 生成 raw/<id>.ogg 和 raw/<id>.json；打印许可证，请检查为 CC0
node build-fishing.mjs                   # 生成 out/*.ogg 和 fishing-bank.json
cp out/*.ogg ../../public/audio/         # 然后把 fishing-bank.json 的条目复制到 src/audio/soundBank.js
```

- 循环音频（`reel_wind`、`reel_drag`、`line_strain`）：截取片段，在循环点做等功率交叉淡化，
  综合响度归一化到 −23 LUFS；音效库中的 `lufs` 是瞬时响度的中位数。
- 音频精灵（其余音效）：切片的峰值归一化到 −1 dBFS；`lufs` 是各切片的最大瞬时响度。
- 混音器（`src/audio/SoundScape.js` 中的 `MIX`）根据这些测量值把目标响度换算为增益。

`raw/`、`work/` 和 `out/` 是构建临时目录，不提交到仓库。
