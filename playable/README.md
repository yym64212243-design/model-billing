# Playable — AI 钢琴 MVP

把你喜欢的歌，变成你能弹、能看、能跟弹的钢琴版本。

面向普通用户、流行钢琴爱好者、短视频翻奏用户与钢琴学习者的 AI 钢琴产品。支持上传/录音生成钢琴编配、瀑布流可视化跟弹、以及 iPad 琴架跟弹监听模式。

---

## 如何运行

```bash
cd playable
npm install
npm run dev
```

在浏览器打开 [http://localhost:3000](http://localhost:3000)。

### 启用真实音频分析（按录音/上传的音频生成钢琴谱）

1. 安装 Python 3.8+，并安装 aubio：
   ```bash
   pip install -r scripts/requirements-transcribe.txt
   ```
   若报错「aubio not installed」，说明当前终端使用的 Python 与 Next 启动环境不一致，请在**同一环境**下执行上述命令，或设置 `PLAYABLE_PYTHON` 指向已安装 aubio 的 Python。
2. 确保本机可用 `python3`（或设置环境变量 `PLAYABLE_PYTHON` 指向 Python 可执行文件）。
3. 在输入页上传或录制音频后，点击「生成钢琴编配（真实分析音频）」。
4. 若未配置上述环境，请求会失败，页面会提示「aubio 未安装…」并可选择「仍使用演示谱」继续体验。

### 启用 AI 优化编配（可选）

产品支持用 **AI 对分析结果做优化**（更符合难度、更易弹等）。配置后，生成流程为：先 aubio 分析音频 → 再调用 AI 优化音符序列。

1. 复制环境变量示例并填入你的 API Key：
   ```bash
   cp .env.example .env
   # 编辑 .env，填入 OPENAI_API_KEY=sk-xxx
   ```
2. 支持的配置（见 `.env.example`）：
   - `OPENAI_API_KEY` 或 `PLAYABLE_AI_API_KEY`：OpenAI 或兼容接口的 API Key。
   - `OPENAI_BASE_URL`（可选）：兼容 OpenAI 的接口地址，默认 `https://api.openai.com/v1`。
   - `OPENAI_MODEL`（可选）：模型名，默认 `gpt-4o-mini`。
3. 重启 `npm run dev` 后，生成钢琴编配时会自动走 AI 优化（无需改前端）。

- **首页**：产品文案与「上传音频」「直接录音」入口  
- **输入页** `/input`：上传或录音 → 选择难度 → 生成  
- **结果页** `/result`：摘要、乐谱预览、进入瀑布流/跟弹、导出与二次调整  
- **瀑布流页** `/waterfall`：下落式可视化 + 播放控制；`/waterfall?practice=1` 开启跟弹监听模式  

---

## 当前哪些功能是真实实现

| 功能 | 实现方式 |
|------|----------|
| 上传音频 | 浏览器选择文件，读取为 Blob，计算时长，生成 `AudioInput` |
| 直接录音 | `MediaRecorder` + `getUserMedia`，完整流程：开始/停止/试听/删除重录，状态：空闲 / 录音中 / 处理中 / 已完成 |
| 难度选择 | 初级 / 中级 / 高级，参与 mock 编配参数 |
| 生成流程 | **优先调用真实分析 API**（`POST /api/analyze`，需配置 Python + aubio）；若配置了 `OPENAI_API_KEY` 会再用 AI 优化编配；失败时可选「仍使用演示谱」。结果写入 sessionStorage，跳转结果页 |
| 乐谱预览 | 基于编配数据渲染右手/左手音符列表（简化预览结构） |
| 瀑布流可视化 | 真实渲染：方块横向对应键位、长度对应音长、随播放时间下落，底部判定线 + 钢琴键高亮 |
| 播放控制 | 播放/暂停、进度条拖动、速度 0.5x–1.5x、循环段落 |
| 主题切换 | 默认 / 暖色 / 冷色，CSS 变量 |
| 跟弹监听模式 | 开启麦克风 → `AnalyserNode` + 简单 FFT 主频估计 → 与当前应命中音符匹配，命中时键盘与反馈高亮，连续命中计数 |
| 二次调整 | 按钮触发重新 mock 编配（更简单/更丰富/升调/降调/左手更简单/主旋律+简单伴奏） |
| 导出入口 | 按钮与状态结构已预留，当前为「MVP 阶段暂未实现」提示 |

---

## 哪些能力还是 Mock / 可选

- **转谱/编配**：配置 Python + aubio 后，**真实分析**由 `scripts/transcribe_audio.py`（aubio onset + pitch）与 `POST /api/analyze` 完成，谱子来自音频。未配置或 API 失败时仍使用 mock（随机演示谱）。  
- **导出**：PDF / MIDI / MusicXML 仅预留状态与 UI，未生成文件。  
- **实时听音**：使用 FFT 峰值估计主频并映射到 MIDI，单音尚可、和弦与复杂织体为简化逻辑，判定窗口约 ±0.25s，非严苛音游级。

---

## 将来如何接入真实转谱

1. **替换 `src/lib/mockApi.ts` 中的 `mockTranscribe`**  
   - 入参保持 `AudioInput`（或增加 blob/url 上传到后端）。  
   - 返回保持 `TranscribeResult`（tempo、key、melody、chords、sections 等）。  
   - 可对接自建转谱服务或第三方 API（如 Audacity 插件、专业转谱 API），前端仅改调用处，类型不变。

2. **替换 `mockArrange`**  
   - 入参：`TranscribeResult` + `DifficultyLevel` + 可选 `RefineAction`。  
   - 返回：`PianoArrangement`（leftHand / rightHand / measures 等）。  
   - 可接入编曲模型或规则引擎，同样只替换实现，保留类型与页面使用的数据结构。

3. **结果存储**  
   - 当前用 `sessionStorage`（`src/lib/resultStore.ts`）。  
   - 接入真实后端后，可改为「上传音频 → 返回 jobId → 轮询/WebSocket 取 TranscribeResult + PianoArrangement」，再写入 context 或 sessionStorage 供结果页/瀑布流使用。

---

## 将来如何优化实时听音识别

1. **算法**  
   - 当前：`src/modules/liveInputMonitor/pitchDetection.ts` 中 FFT 主频 → MIDI。  
   - 可替换为 YIN、CREPE、或 ML 音高检测，仅替换该模块导出函数，保持「(AnalyserNode, sampleRate) => pitch | chord」的接口。

2. **多音/和弦**  
   - `estimateChordFromAnalyser` 已留扩展点，可实现多峰检测或神经网络多音高估计，返回 `number[]` 与应命中音符做集合匹配。

3. **判定与反馈**  
   - 判定窗口、提前/延后容差、连击逻辑在 `useLiveInputMonitor.ts` 中（`HIT_WINDOW_SEC`、命中条件）。  
   - 可增加难度档位（宽松/标准/严格）、可视化时间偏差、统计命中率等，均在同一模块内扩展。

4. **与 UI 解耦**  
   - 听音逻辑仅在 `useLiveInputMonitor` 与 `pitchDetection` 中，页面只消费 `state` 与 `start/stop`，便于后续替换或 A/B 测试不同识别方案。

---

## 将来如何增强瀑布流动画效果

1. **模块边界**  
   - 瀑布流数据来自 `arrangementToWaterfall()`，组件为 `WaterfallVisualizer` + `PianoKeyboard`。  
   - 动画只依赖 `currentTime`、`speed`、`notes`，不依赖业务 API，便于单独优化。

2. **可增强点**  
   - 使用 CSS `transform` 或 WebGL/Canvas 做大量音符时的性能优化。  
   - 音符进入/离开判定线时的缓动、高亮、粒子等可在 `WaterfallVisualizer` 内用 CSS 或动画库实现。  
   - 轨道/分组颜色、主题色已用 CSS 变量（`--waterfall-left` / `--waterfall-right`），新增主题或皮肤只需改变量。  
   - 横屏/iPad 布局已考虑响应式与触控区域，可再针对 `lg:` 断点做大屏专属布局与字体缩放。

---

## 技术栈与目录结构

- **Next.js 14**（App Router）+ **TypeScript** + **Tailwind CSS**
- **模块划分**  
  - `src/types` — 核心数据类型（与 UI 解耦）  
  - `src/lib` — 工具：转瀑布流、mock API、常量、结果存储  
  - `src/hooks` — 录音 hook  
  - `src/modules/liveInputMonitor` — 实时音高检测与跟弹状态  
  - `src/components` — 可复用 UI 组件  
  - `src/app` — 页面与路由  

---

## 产品说明摘要

- **输入**：上传音频（MP3/WAV/M4A）或浏览器麦克风录音。  
- **流程**：首页 → 输入 → 选择难度 → 生成 → 结果页（摘要、乐谱、瀑布流入口、导出、二次调整、跟弹入口）。  
- **视图**：传统乐谱预览 + 瀑布流可视化（下落方块、键位/音长、主题与速度/进度/循环）。  
- **跟弹**：开启麦克风后实时识别弹下的音并与当前应命中音匹配，命中时键盘与方块同步反馈；MVP 支持单音与简单判定窗口，结构可扩展。

本 MVP 优先保证产品感、演示效果、模块化与后续扩展性，便于接入真实转谱、编配与听音能力。
