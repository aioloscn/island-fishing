# 音频来源与致谢

本目录所有音效均为来自 [Freesound](https://freesound.org) 的真实录音，采用
**Creative Commons 0**（公有领域贡献，无需署名；此处仍记录来源）。没有合成音效。
素材来源为各音效在 Freesound 上的高质量预览。

处理流程（临时构建脚本）：截取、部分音频高通、裁剪、淡入淡出、循环点等功率交叉淡化、
响度归一化（循环音频综合响度约 −23 LUFS；单次切片峰值为 −1 dBFS），以 Ogg 封装 Opus（64 kb/s）。
海浪切片根据检测到的波浪起点、峰值和低谷截取。单次音效文件为音频精灵，
切片表位于 `src/audio/soundBank.js`。来源标题与作者保留原文，便于溯源。

| 文件 | 用途 | 来源 | 作者 | 许可证 |
|---|---|---|---|---|
| `surf_crash.ogg` | 7 段破碎浪（撞击／闷响），用于沙滩与岩岸，在每道浪的破碎位置播放 | [Ocean_coast_04_092025_0659AM](https://freesound.org/people/YevgVerh/sounds/827530/), [Big waves hit land.wav](https://freesound.org/people/straget/sounds/412308/) | YevgVerh, straget | CC0 1.0, CC0 1.0 |
| `surf_wash.ogg` | 6 段上冲流（海水冲上沙滩），近距离录音 | [Gentle small waves lapping on shore.wav](https://freesound.org/people/Alex_hears_things/sounds/352356/) | Alex_hears_things | CC0 1.0 |
| `surf_backwash.ogg` | 6 段回流（沙粒嘶响），近距离录音 | [Gentle small waves lapping on shore.wav](https://freesound.org/people/Alex_hears_things/sounds/352356/) | Alex_hears_things | CC0 1.0 |
| `surf_far.ogg` | 远处的海浪轰鸣（崖顶录音），循环 | [11ft waves breaking on sandy beach in the distance from the top of the cliff](https://freesound.org/people/chris_dagorne/sounds/426074/) | chris_dagorne | CC0 1.0 |
| `wind.ogg` | 穿过海岸灌木的风声，循环并随阵风调制 | [strong wind on coastal path.wav](https://freesound.org/people/bruno.auzet/sounds/706471/) | bruno.auzet | CC0 1.0 |
| `palms.ogg` | 棕榈树中的风声和白天虫鸣，循环并随阵风调制 | [Wind through the palm trees and some crickets chirping in the day (Gran Sabana, Venezuela)](https://freesound.org/people/felix.blume/sounds/384550/) | felix.blume | CC0 1.0 |
| `crickets.ogg` | 夜间蟋蟀鸣叫，循环 | [Night Crickets Back Porch.aiff](https://freesound.org/people/hdfreema/sounds/333221/) | hdfreema | CC0 1.0 |
| `pier_lap.ogg` | 拍打码头的水声，循环 | [WavesOnTheShore.wav](https://freesound.org/people/richardemoore/sounds/260263/) | richardemoore | CC0 1.0 |
| `under_reef.ogg` | 海湾水听器录音：鼓虾爆裂声和低沉轰鸣，循环 | [Underwater crackling sounds_Hydrophone.wav](https://freesound.org/people/KaleidacousticsAudio/sounds/630436/) | KaleidacousticsAudio | CC0 1.0 |
| `boat_engine.ogg` | Volvo Penta MD22 船用柴油引擎，循环，音高随转速变化 | [Marine diesel engine](https://freesound.org/people/AugustSandberg/sounds/264864/) | AugustSandberg | CC0 1.0 |
| `boat_lap.ogg` | 水拍打玻璃纤维船身，循环 | [boat knocks fiberglass water laps on hull.flac](https://freesound.org/people/kyles/sounds/637206/) | kyles | CC0 1.0 |
| `hull_slap.ogg` | 5 段水撞击船身的声音 | [boat knocks fiberglass water laps on hull.flac](https://freesound.org/people/kyles/sounds/637206/) | kyles | CC0 1.0 |
| `boat_rush.ogg` | 船首浪／流过船身的水声，循环 | [Sailing boat, bow wave (close perspective)](https://freesound.org/people/Pfannkuchn/sounds/360631/) | Pfannkuchn | CC0 1.0 |
| `step_sand.ogg` | 5 段松软干沙脚步声（拟音，不含海浪） | [Soft sand steps.wav](https://freesound.org/people/200221-WeanBekker/sounds/543714/) | 200221-WeanBekker | CC0 1.0 |
| `step_wetsand.ogg` | 5 段湿粗沙脚步声，近距离录音 | [footsteps in wet coarse sand.wav](https://freesound.org/people/bruno.auzet/sounds/539175/) | bruno.auzet | CC0 1.0 |
| `step_wood.ogg` | 5 段空心木板脚步声 | [Footsteps on hollow wood](https://freesound.org/people/florianreichelt/sounds/459970/) | florianreichelt | CC0 1.0 |
| `step_water.ogg` | 5 段涉水声，选用起音最慢的片段 | [Footsteps_Walk.wav](https://freesound.org/people/Nox_Sound/sounds/490951/), [Wading in Shallow Water.wav](https://freesound.org/people/ryansitz/sounds/342932/) | Nox_Sound, ryansitz | CC0 1.0, CC0 1.0 |
| `step_grass.ogg` | 5 段草地脚步声 | [Footsteps_Grass_1.wav](https://freesound.org/people/SilentStrikeZ/sounds/389625/) | SilentStrikeZ | CC0 1.0 |
| `step_rock.ogg` | 5 段石地脚步声 | [Footsteps - Stone, Rock, Concrete, Cement](https://freesound.org/people/SecureSubset/sounds/813622/) | SecureSubset | CC0 1.0 |
| `swim.ogg` | 4 段水面游泳划水声 | [POOL SWIMMING R-L](https://freesound.org/people/tbsounddesigns/sounds/530158/) | tbsounddesigns | CC0 1.0 |
| `uw_swim.ogg` | 4 段水下手臂运动声，水听器录音 | [Underwater recording of aquatic movement, bubbles and drops.](https://freesound.org/people/felix.blume/sounds/384218/) | felix.blume | CC0 1.0 |
| `submerge.ogg` | 2 段短促水下涌流声，水听器录音 | [Underwater recording of aquatic movement, bubbles and drops.](https://freesound.org/people/felix.blume/sounds/384218/) | felix.blume | CC0 1.0 |
| `emerge.ogg` | 短促的水流平息／滴水声 | [Water Splash](https://freesound.org/people/felix.blume/sounds/434978/) | felix.blume | CC0 1.0 |
| `splash.ogg` | 4 段人体入水飞溅声 | [SPLASH (by blaukreuz)](https://freesound.org/people/qubodup/sounds/212143/), [Foley_Natural_Water_Jump_Mono.wav](https://freesound.org/people/Nox_Sound/sounds/585744/) | qubodup, Nox_Sound | CC0 1.0, CC0 1.0 |
| `gull.ogg` | 6 段海鸥叫声 | [Seagull on beach](https://freesound.org/people/squashy555/sounds/353416/), [Seagulls / gaviotas clean wildtrack.WAV](https://freesound.org/people/Soojay/sounds/462462/) | squashy555, Soojay | CC0 1.0, CC0 1.0 |
| `bird_forest.ogg` | 13 段鸣禽叫声／短鸣唱（1.1 kHz 高通），用于树上栖点间歇鸣叫 | [Birds in Rainforest - Volcanoes National Park (Hawaii) 2](https://freesound.org/people/coalcon/sounds/636071/), [Birds in Rainforest - Volcanoes National Park (Hawaii) 1](https://freesound.org/people/coalcon/sounds/636072/), [Tropical Birds.wav](https://freesound.org/people/dubminister/sounds/214676/) | coalcon, coalcon, dubminister | CC0 1.0, CC0 1.0, CC0 1.0 |
| `bird_dove.ogg` | 5 段鸠鸽咕咕声 | [mourning_dove _2017-06-06.wav](https://freesound.org/people/nathankwright/sounds/456930/) | nathankwright | CC0 1.0 |
| `birds_dawn.ogg` | 黎明鸟鸣合唱（夏威夷 Waikoloa 清晨），循环 | [Birds at Dusk on Hawaii.wav](https://freesound.org/people/SorenF109/sounds/678859/) | SorenF109 | CC0 1.0 |
| `tern.ogg` | 6 段普通燕鸥叫声（2 kHz 高通） | [LAC_DES_CHANTERAINES_Sternespierregarin_m32bitsfloat_192kHz.wav](https://freesound.org/people/LaScienceMusicale/sounds/648386/) | LaScienceMusicale | CC0 1.0 |
| `whale_song.ogg` | 潜水录到的座头鲸歌（法属波利尼西亚），2.6 kHz 低通抑制潜水调节器嘶声，循环 | [Diving with whales.wav](https://freesound.org/people/KEVOY/sounds/82325/) | KEVOY | CC0 1.0 |
| `whale_blow.ogg` | 3 段鲸类呼吸（猛烈呼气和吸气），降调后用作座头鲸喷气 | [ORCA.wav](https://freesound.org/people/mikewest/sounds/198937/) | mikewest | CC0 1.0 |
| `big_splash.ogg` | 2 段大型飞溅声（鲸鱼跃起、入水和甩尾，降调） | [Big Water Splash](https://freesound.org/people/qubodup/sounds/442773/), [Large Splash](https://freesound.org/people/roboroo/sounds/436792/) | qubodup, roboroo | CC0 1.0, CC0 1.0 |
| `reel_wind.ogg` | 纺车式卷线器匀速摇动声（齿轮咔嗒），循环，速率随摇柄变化 | [Spinning reel.wav](https://freesound.org/people/tosha73/sounds/509902/) | tosha73 | CC0 1.0 |
| `reel_drag.ogg` | 鱼逆着泄力拉出鱼线时的卷线器棘轮声，循环 | [Angel Fly Fish Reel Fast Pull_1.wav](https://freesound.org/people/paulprit/sounds/507070/) | paulprit | CC0 1.0 |
| `line_strain.ogg` | 尼龙线受力声（接近断裂时的吱响），循环 | [nylon rope string fishing line handling tying tie tense friction](https://freesound.org/people/kyles/sounds/450849/) | kyles | CC0 1.0 |
| `rod_swish.ogg` | 5 段挥竿声，用于抛竿 | [Fishing Rod Swish Swoosh.wav](https://freesound.org/people/Mrthenoronha/sounds/371313/), [Fishing Rod Cast - Swoosh](https://freesound.org/people/mwchristian95/sounds/725426/) | Mrthenoronha, mwchristian95 | CC0 1.0, CC0 1.0 |
| `bail_click.ogg` | 4 段弹簧金属咔嗒声，用于导线环打开／扣回 | [Foley_TapeMeasure_ClickLock.wav](https://freesound.org/people/MrFossy/sounds/523282/) | MrFossy | CC0 1.0 |
| `line_out.ogg` | 抛竿时卷线器出线声 | [fishingreel_throw.wav](https://freesound.org/people/BranndyBottle/sounds/464697/) | BranndyBottle | CC0 1.0 |
| `plop.ogg` | 2 段浮漂／铅坠落水声 | [Fishing Lure-Sinker Hitting water](https://freesound.org/people/JoelMcDaniel/sounds/849752/), [fishingreel_throw.wav](https://freesound.org/people/BranndyBottle/sounds/464697/) | JoelMcDaniel, BranndyBottle | CC0 1.0, CC0 1.0 |
| `line_snap.ogg` | 4 段受力断弦声，用于鱼线断裂 | [Guitar string snap or breaks - various sounds](https://freesound.org/people/khenshom/sounds/537084/) | khenshom | CC0 1.0 |
| `fish_splash.ogg` | 5 段鱼在水面飞溅／挣扎声 | [Fish Splashing Release 1.wav](https://freesound.org/people/paulprit/sounds/507094/), [Fish Splashing Release 2.wav](https://freesound.org/people/paulprit/sounds/507093/) | paulprit | CC0 1.0 |
| `fish_flop.ogg` | 钓上岸的鱼拍尾／扑腾声 | [FishFlappingTail.wav](https://freesound.org/people/ramattahatta/sounds/649003/), [Fish Flopping.wav](https://freesound.org/people/RatBird/sounds/570208/) | ramattahatta, RatBird | CC0 1.0, CC0 1.0 |
| `coins.ogg` | 硬币落入碗中的声音，用于卖鱼 | [coins - in paper bowl 05.wav](https://freesound.org/people/Anthousai/sounds/336585/) | Anthousai | CC0 1.0 |

说明：`under_reef.ogg` 使用 630436 预览的前约 200 秒，已陷波滤除狭窄的 1.7 kHz 音调。

说明：`splash.ogg` 的第 1 个切片是 qubodup 对 blaukreuz 的
"130723_Brela_HarborJump_F_4824.wav" 的清理版本，原音频同样采用 CC0。

说明：`big_splash.ogg` 的第 1 个切片是 qubodup 混合的 CC0 音效，
包括 wormer2 的 415669／415670、roboroo 的 436792 等，均为 CC0。

钓鱼音效通过 `tools/audio/` 重新构建，见该目录的 README。
