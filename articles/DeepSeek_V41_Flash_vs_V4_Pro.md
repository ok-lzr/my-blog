# DeepSeek V4.1 Flash 发布，竟然完爆 V4 Pro 正式版？！

前两天刷到 DeepSeek V4.1 Flash 上线的消息，我第一反应是"哦，小杯来了"。名字里带 Flash 的模型，通常意味着更快更便宜，但能力上总要让一让。结果今天早上我把两篇报道和技术报告解读连着读完，发现自己完全判断错了：Artificial Analysis 给它打了 40 分的智能指数，超过了自家参数量大得多的 V4 Pro；更离谱的是，DeepSeek 自己一度宣布要让 V4 Pro 下线、把请求直接路由到 V4.1 Flash，后来又两次改口，最终决定继续提供 V4 Pro 的 API。一个"小杯"把"大杯"逼到这个地步，这事值得单独写一篇。

## 先把事实摆清楚

下面这张表里的数据来自官方技术报告和第三方评测机构 Artificial Analysis，**不是我自己的跑分**。我个人的使用体感放在后面单独说。

| 项目 | V4.1 Flash 的表现 |
| --- | --- |
| 主干 / 附加参数 | 552B 主干 + 196B Engram 参数（多模态 MoE） |
| 激活参数 | prefill 阶段 8B，decode 阶段 16B |
| 原生上下文 | 100 万 token |
| 预训练语料 | 45T token 的多模态语料 |
| 全局 KV 缓存 | 每 token 890 字节，约为 V4-Flash 的 1/4 |
| 持久化 KV 缓存 | 约为 V4-Flash 的 1/8 |
| 单任务成本 | 0.27 美元（按 Artificial Analysis 的 Intelligence Index 测法） |

而它的对手 V4 Pro 是 1.6T 参数。552B 打赢 1.6T，这就是整件事最反直觉的地方。

## 一个"小杯"是怎么把"大杯"逼到墙角的

先把关键事实列一下，全部出自机器之心对技术报告的解读：

- Artificial Analysis 给 V4.1 Flash 的智能指数评分是 **40 分**，超过了 V4 Pro。
- 在 **AutomationBench-AA 上以 69% 排名第一**，与 GPT-6 Astra 持平，略高于 Grok 4.6（67%）。
- 它同时是 AA 测过的**最冗长的模型之一**：每个 Intelligence Index 任务要烧掉 89k token；但因为单价低，每个任务仍然只要 0.27 美元。
- Sebastian Raschka 甚至认为，这次创新之大，应该直接叫它 DeepSeek V5。
- DeepSeek 先是宣布延迟下线 V4 Pro，随后又宣布放弃下线、继续提供 API 服务。

技术报告的标题很直白：**Pushing the Limits of KV Cache Compression**（推进 KV 缓存压缩的极限）。翻完架构章节会发现，几乎所有设计都能回溯到同一个目标——把 KV 缓存压下去。

原因也不难理解。从 V3.2 的 DSA 到 V4 的 CSA，稀疏注意力已经把长序列的**计算**成本削得足够低；而长程 agent 的负载是"输入重"的：一次跑几小时的编码 agent，每次工具调用都产生一次新的 prefill，上下文只增不减，真正要生成的 token 反而是少数。于是当"算"不再是瓶颈，"存"和"搬"就顶了上来——HBM 容量、SSD 与主机内存容量、IO 与互联带宽，三者合起来决定了 agent 服务的吞吐上限和单位成本。

所以 552B 干掉 1.6T 的真正含义不是"小模型更聪明"，而是：**同样一次 agent 调用，它占的显存更少、要从 SSD 搬的数据更少、要重算的 prefill 更少。**

## 黑科技之一：CED，把 prefill 直接砍掉一半

V4.1 Flash 的语言主干是 40 层，但被切成了两半：前 20 层是因果编码器（Causal Encoder），后 20 层是解码器，这个结构叫 **CED（Causal Encoder-Decoder）**。官方发布页上"输入激活 8B、输出激活 16B"的不对称设计就来自这里。

关键在于解码器那 20 层的全局 KV 是怎么来的。常规 Transformer 里每层的 K、V 都从本层隐藏状态算出来，所以处理一段提示词必须把 40 层全部跑完。CED 不这么做：**解码器各层的 KV 条目直接由第 20 层（编码器最后一层）的隐藏状态经各自的投影矩阵映射得到**。也就是说 prefill 阶段只需要跑前 20 层，上半部分的全局 KV 就已经以极低代价拿到手了，序列长度远大于窗口时，prefill 复杂度从 O(NL) 降到大约 O(NL/2)，接近对半砍。

这个思路继承自微软的 YoCo（You Only Cache Once），但 CED 做了结构加厚：YoCo 是让上半部分共享同一份 KV 缓存，CED 则为每一层配置独立投影权重，在"只算一半"的前提下扩大 KV 的有效容量和生成深度。

代价出现在滑动窗口注意力上：SWA 仍然逐层计算，prefill 时解码器还要额外处理 n_win × L/2 个 token 来补齐 SWA 状态。DeepSeek 的处理方式是"接受近似"——既然已有研究表明 SWA 的实际有效感受野远小于理论值，那就只回放提示词最后的 n_win 个 token（配置里 n_win = 128）。

## 黑科技之二：CSA2，把 KV 压缩的三个维度一次吃满

CED 管计算，**CSA2**（Compressed Sparse Attention 2）管存储。

报告把 KV 缓存的压缩空间归纳成三个互相相乘的维度：**条目大小**（GQA 减少 KV 头数、MLA 让各头共享一个小 latent）、**序列维度**（每 m 个 token 压成一条）、**层维度**（让部分层复用其他层的缓存和选择结果）。此前的 IndexCache、YOIO、HySparse 各自只覆盖了一部分，CSA2 想做的是一次吃满三个维度。

做法是给每个 CSA2 层静态分配三种模式之一：

1. **Full 模式**：自己算 main KV 和索引器 Q，跑完整索引流程，产出新鲜的 Top-K 索引。
2. **Reindex 模式**：复用前面某层的 main KV 和索引器 K，但用自己的索引器 Q 重新打分，选出属于自己的 Top-K——缓存共享，选择仍是自己的。
3. **Reuse 模式**：最省，main KV 和 Top-K 索引全部沿用，直接做稀疏注意力，连索引器 Q 都不算。

三种模式的共同点是每层仍保留自己的全局 Q 和 SWA KV，所以层与层之间的表达能力没有被抹平。效果是：占绝大多数的 Reuse 模式层，prefill 时只需执行 15 个 kernel，decode 时只需 11 个。

## 黑科技之三：FP4 与 Bounded Replay，把 SWA 缓存赶出 SSD

架构之外还有两刀。

第一刀在**精度**上。V4 已经对索引器的 Q、K 做了 FP4 量化感知训练，V4.1 Flash 把 FP4 推进到了 main KV 缓存，格式是 E2M1 配每 16 通道一个 E4M3 缩放因子，接近 NVFP4 但省掉了它的二级全局缩放。

第二刀在**部署**上，就是前面提到的 SWA Bounded Replay。问题的背景是：在 V4 的部署里，SWA KV 占了持久化缓存近一半容量，而它的访问模式和持久化缓存的长留存策略根本不匹配——全局 KV 有长尾复用价值，SWA KV 却只在一个活跃会话内的分钟级窗口里有意义，会话一结束就是死数据。

于是 V4.1 Flash 干脆把 SWA KV 整个移出持久化缓存，改放进由每台机器 10% 主机 DRAM 组成的分布式内存池，TTL 只有几分钟，靠高周转服务绝大多数并发会话；全局 KV 继续留在 SSD 上，保证至少 72 小时的生命周期。偶尔出现"全局 KV 命中、SWA KV 未命中"的请求，就用 bounded replay 重算 n_win 个 token 兜底。

所有这些叠加起来的效果是：**上下文从 4K 拉到 1M、放大 256 倍，单 token decode FLOPs 只增加了 1/4。**

## reasoning effort：max / high / low 其实是同一份权重的三档

后训练章节里，DeepSeek 很坦率：这一版没有引入新的后训练算法，流程就是标准的 SFT + RL + on-policy 蒸馏，所有改动都在数据管线上。

但有一个对使用者直接可见的设计：**reasoning effort**。训练时把一个 1 到 100 的标量 effort 显式写进系统提示，同一 effort 下的多个采样构成一个子组、组内做奖励中心化，长度惩罚系数随 effort 指数衰减。这样一来，同一份权重就能在成本-质量曲线上自由滑动。API 暴露的 max、high、low 三档，对应的正是 b = 100、75、50。

这也顺带解释了 AA 那句"最冗长的模型之一"——它测的是 max 档，而 max 在设计上就是这条曲线最右端的点。报告给出的数据是：

| effort 从 25 提到 100 | 提升 |
| --- | --- |
| 八个推理密集型基准平均 Pass@1 | 67.1% → 76.3% |
| DeepSWE v1.1 | 66.0% → 74.2% |
| Terminal-Bench 2.1 | 82.4% → 90.6% |
| 代价 | 约 2.5 倍输出 token |

报告自己的建议是：60 到 80 这一档已经能用不到一半的 token 预算拿到接近满档的准确率，而从 80 走到 100 会让 agent 轨迹再长 1.6 到 1.8 倍，换来的只是边际提升——**把 max 留给最难的任务**。

## 我自己的一点评判

第一，**"参数量崇拜"该退场了**。这次真正被比较的，是"一次调用的总成本"：显存占用、IO 搬运、prefill 重算。谁把这三样压下去，谁就赢了，参数量只是其中一个变量。

第二，**对做 agent 的人是真利好**。百万上下文、前缀复用率提升、缓存未命中从"灾难"降级成"廉价重算"，这些都是长程 agent 最疼的地方。成本降到 0.27 美元一个任务，很多原来"想想就算了"的玩法现在可以真的跑起来。

第三，**V4 Pro 该不该下线，我觉得不该**。DeepSeek 两次改口本身也说明了问题：模型下线不是纯技术决策，还牵扯存量用户的稳定性、迁移成本和企业的合规要求。让 Flash 承接新流量、给 Pro 留一条稳定的老路，是更体面的做法。

第四，**名字叫 Flash 有点误导**。按它的定位，叫 V5 或者 Pro 都不算过分，"Flash"这个名字反而会让不少人（包括我）第一时间低估它。

最后说明一下：技术报告我读的是媒体解读版，具体数字和细节请以官方报告为准（链接在下面）。我这几天也在把手上几个 agent 流程切到 V4.1 Flash 上跑，等样本多一点再写一篇实测。

## 参考资料

- [DeepSeek V4.1 Flash 技术报告（Hugging Face）](https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/DeepSeek_V41_Tech_Report.pdf)
- [DeepSeek V4.1 Flash 用了哪些黑科技？竟让 Flash（差点）逼退 Pro（机器之心 / 36氪）](https://www.36kr.com/p/3980013761182466)
- [DeepSeek V4.1 Flash promises frontier performance at a fraction of the cost（4sysops）](https://4sysops.com/archives/deepseek-v4-1-flash-promises-frontier-performance-at-a-fraction-of-the-cost/)
- [DeepSeek V4.1 Flash 初体验：又快又稳，V4 这次真跟不上了（网易科技）](https://m.163.com/tech/article/L6D9G3RR00097U7T.html)
- [DeepSeek 正式发布 V4 API：Flash / Pro 双版本齐发，百万上下文成标配（搜狐）](https://www.sohu.com/a/1013940180_413980)
- [deepseek-recipe](https://github.com/deepseek-ai/deepseek-recipe) · [DeepJIT](https://github.com/deepseek-ai/DeepJIT) · [DeepSelect](https://github.com/deepseek-ai/DeepSelect)
