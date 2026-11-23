# actions/upload-artifact 准入审查

2026-11-23（Asia/Shanghai） · P0-01R-S1 · Codex 静态审查 · **HOLD**。未授权引入，隔离运行 NOT_TESTED。

## 来源、用途和许可

仅拟将三个已验收文件上传到本次 Actions run。项目没有该能力。GitHub 官方 actions 组织，v7.0.2，提交 cf430e030ddbb5b0abf93d22962f4752f3646cd9。发行记录包含限流重试修正和 @actions/artifact 6.3.1 升级。该提交 LICENSE 为 MIT，再分发副本须保留版权及许可声明。无角色素材。传递许可未逐项核实。Action 仅在构建机运行，桌宠无新增运行依赖；压缩时间和空间未测。

[发行记录](https://github.com/actions/upload-artifact/releases/tag/v7.0.2) · [固定源码、许可证和锁文件](https://github.com/actions/upload-artifact/tree/cf430e030ddbb5b0abf93d22962f4752f3646cd9)

## 已确认事实

- 按固定 SHA 读取 action.yml、package.json、package-lock.json、src/shared/search.ts、src/upload 的输入与上传逻辑及实际发布入口。Node 24 入口 dist/upload/index.js 为 4452820 字节，SHA-256 为 c0e58b240360573e6d6c82ea1bb22deff4f85883e00211a52bd27822c3a22617。以 PowerShell 7.6.9 阅读和文本检索，未执行或重建入口。
- @actions/glob 0.6.1 配置跟随符号链接、忽略断链，默认排除隐藏文件；使用 stat 判断目录。多个路径可计算公共根。if-no-files-found 默认 warn，error 仅处理总匹配数为零。缺三件中的一件仍可能上传成功。
- 发布入口包含文件读取流、CreateArtifact、上传流及 FinalizeArtifact；取 ACTIONS_RUNTIME_TOKEN 和 ACTIONS_RESULTS_URL，并含代理环境处理及 GITHUB_OUTPUT 写入。上传服务与返回的存储地址构成出站边界。即使 GITHUB_TOKEN 权限为空，作业仍有 artifact 运行时凭据。overwrite 开启时有删除同名 artifact 的路径，应固定 false。
- 发布包含 child_process 引用，字面 eval( 和 new Function 搜索无命中。该检索不能排除动态调用、子进程或未经过上传入口的库代码。未证实正常上传会启动子进程、访问注册表或持久化。
- 按锁文件 packages 排除 dev:true，以 npm 官方 bulk advisory API 查询 128 个运行依赖名称及其锁定版本，仅发送公开依赖名称与版本。返回命中：undici 6.23.0（19 条）、lodash 4.17.23（2）、fast-xml-parser 5.4.1（4）、fast-xml-builder 1.0.0（1）、glob 10.5.0（1）、minimatch 多版本（1）、brace-expansion 多版本（22）。计数为服务返回记录，含不同版本范围，不等于独立漏洞数。包括高严重性报告。锁树命中尚未归因到打包入口中的可达调用。

[文件搜索实现](https://github.com/actions/upload-artifact/blob/cf430e030ddbb5b0abf93d22962f4752f3646cd9/src/shared/search.ts) · [缺件与覆盖分支](https://github.com/actions/upload-artifact/blob/cf430e030ddbb5b0abf93d22962f4752f3646cd9/src/upload/upload-artifact.ts) · [lodash 公告](https://github.com/advisories/GHSA-r5fr-rjxr-66jc) · [undici 公告示例](https://github.com/advisories/GHSA-f269-vfmq-vjvj)

## 限制、验证和回退

采用全新私有暂存目录，复制前检查源路径和每一级祖先；拒绝重解析点、链接、异常硬链接或越界路径。复核目标目录仅有安装器、SHA256SUMS.txt、build-info.json 三个普通非空文件，逐个验证名称、长度、摘要。上传参数列三个固定字面路径，禁通配符，隐藏文件关闭，缺件即失败。白名单限制正常行为，无法约束被篡改的 Action 或并发替换；暂存后禁止其他构建进程写入。隔离验证须另批，覆盖单件缺失、额外文件、链接、空目录和正常下载复核。

官方 REST artifact 管理接口提供查询、下载和删除，未列出可替代 runner 上传的普通创建端点。直接使用 toolkit 仍依赖同一服务和凭据；Release 资产需要不同权限并改变交付渠道。未发现更简单且满足本任务的官方替代。[官方接口](https://docs.github.com/en/rest/actions/artifacts)

未检查完整依赖可达性、所有凭据/子进程调用、打包入口与源码的可复建对应关系、实际网络端点和隔离回归。确认这些事项、处置公告、完成许可复核后再提请人工评审。若上游修复，另选 SHA 重新审查。回退为暂停使用上传步骤，经批准删除受影响的 artifact，保留 run ID 和证据。人工批准人及范围为空。

## S2 可达性复核（2026-11-23）

复核对象仅为 v7.0.2 / cf430e030ddbb5b0abf93d22962f4752f3646cd9。重新查询 npm 公告并读取发布入口中的模块边界和调用点。表中“含有”表示找到模块或实现特征，不能单凭打包注释将库内每个副本归属到锁定版本。

| 依赖 | 锁文件和发布入口证据 | 拟定上传场景的可达性 |
|---|---|---|
| undici 6.23.0 | 19 条公告；入口约 79791 行引用 ncc 模块 6752，HTTP 客户端有 ProxyAgent。 | 正常上传使用 HTTP，但不能把所有 HTTP 调用归为 undici。未见固定上传流程主动发起 WebSocket、EventSource 或传入用户控制的升级参数、Cookie 或 Blob 类型；代理、重试、畸形响应、TLS 与连接复用相关公告仍需逐条对照传输实现和可信服务边界。 |
| lodash 4.17.23 | 2 条公告；入口有 lodash 模块特征和内部数据结构。 | 未在正常链路找到调用模板编译或让外部输入控制 unset/omit/pullAt 路径。尚未证明受影响函数从 ncc 模块图完全移除。 |
| fast-xml-parser 5.4.1 | 4 条公告；入口约 93483–95633 行包含解析与构造模块。 | 三个文件以字节流上传，正常接口数据使用结构化请求，文件正文不传给 XML 解析器。Azure 存储客户端注册了 XML 响应解析，存储返回异常内容时的调用与解析选项仍待核实。 |
| fast-xml-builder 1.0.0 | 1 条属性转义公告；入口约 93030 行起包含构造模块。 | 尚无证据表明常规 ZIP 上传将可控输入作为 XML 属性。须区分 SDK 中存在 XML 构造能力与上传操作实际使用该能力。 |
| glob 10.5.0 | 1 条 AbortSignal 取消公告；入口约 71258 行起有 glob/globSync 实现。 | 上传文件发现调用的是 @actions/glob，尚未找到进入 glob 10.5.0 受影响取消路径的直接调用。工作流整体超时独立于该库。 |
| minimatch 多版本 | 1 条 globparts 放大公告；入口约 129722 行直接绑定 @actions/glob 的 minimatch 副本。 | 匹配路径确实可达；固定短路径和无递归枚举可限制恶意模式输入。仍须确认直接副本的版本映射，及其他副本是否被同一入口调用。 |
| brace-expansion 多版本 | 22 条匹配记录，含同公告的不同版本范围；入口存在多个 braceExpand 实现。 | 匹配可能经过大括号展开。三个字面路径及父目录应排除模式语法，禁止来源可控的路径片段。固定输入无法消除发布包中的其他调用。 |

公告索引：[undici TLS](https://github.com/advisories/GHSA-2m5v-pch6-74hx)、[lodash 模板](https://github.com/advisories/GHSA-r5fr-rjxr-66jc)、[XML 实体展开](https://github.com/advisories/GHSA-8gc5-j5rx-235r)、[XML 属性](https://github.com/advisories/GHSA-5wm8-gmm8-39j9)、[glob 取消](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4)、[minimatch 放大](https://github.com/advisories/GHSA-g3hv-75wg-m249)、[大括号展开](https://github.com/advisories/GHSA-jxxr-4gwj-5jf2)。

### 子进程和产物凭据

静态追踪入口 run → 文件查找 → 创建产物 → ZIP 流或原始文件流 → 签名 URL 上传 → finalize。未发现正常 ZIP 路径调用子进程。入口约 81802 行的 spawn 属于 @actions/exec ToolRunner；约 82097 行的 getWindowsInfo 可调用 PowerShell 查询系统版本和名称，但打包入口中的 getDetails 仅找到定义，未找到正常上传调用。此结论为静态证据，未观察实际进程树。

工具包从 Actions.Results 作用域解析 run/job 后端 ID，以 runner 提供的 ACTIONS_RUNTIME_TOKEN 向 ACTIONS_RESULTS_URL 调用产物服务；创建返回受限签名上传 URL。SDK 还包含按运行上下文查询、下载和删除的路径；实际跨 job 访问能力、过期时间以及服务端拒绝行为未实测。该凭据与 GITHUB_TOKEN 的仓库权限独立。风险控制采用无用户 Secret、无 OIDC、无持久 Git 凭据的托管 runner，仅运行经审批的固定源码；上传使用唯一名称和 overwrite: false，不记录 Token 或签名 URL。若以后拆分上传 job，仍需单独审查产物如何安全交接；同一 job 内的文件白名单不是凭据隔离。

### 三件文件交付边界

在访问构建输出和复制之前，自可信根逐级检查路径及祖先的 ReparsePoint 属性，拒绝符号链接、junction 和非普通文件；对源文件确认无额外硬链接。唯一预期 x64 安装器复制为暂存目录里的 moyu-x64-setup.exe。暂存目录采用受控的全新路径，另有 build-info.json 和 SHA256SUMS.txt。逐个用字面路径检查存在性、类型、规范化路径、正长度与允许上限。首轮上限须按实际产物范围人工确定，未配置则失败。安装器检查 PE 类型，元数据按 UTF-8 解析并核对 schema 和本次 run / SHA；文件名后缀仅用于命名。

Get-FileHash 为 EXE 与 JSON 分别生成 SHA-256 并写入 SHA256SUMS.txt；清单不得自引用。上传前独立重算两项并验证清单只列两个准确文件名，同时精确比对目录枚举为三个普通文件。上传输入用三个无模式符的字面路径，关闭隐藏文件和 overwrite；上传后从可信运行页记录归档摘要，下载解压后再独立比对。路径和文件检查只能管理正常流程的输入；若作业仍有非可信进程可以替换文件，检查与读取之间仍存在竞态。

### 溯源和准入判断

GitHub tag API 返回 v7.0.2 直接指向该 SHA，同一树中包含 action.yml、package.json 版本 7.0.2、源码、锁文件、dist 与 check-dist.yml。包声明用 ncc 构建两个入口，上游工作流存在 npm ci 和 dist 差异验证，证明其定义了核验方式。本轮重算入口摘要与 S1 一致；未独立重建、核验此提交的 dist 检查运行结果或建立完整模块版本映射。

普通 Artifact REST API 仍未见上传端点。官方 toolkit 直接上传沿用同一依赖和运行时凭据，不解决当前风险。Release 资产可交付二进制，但需要写权限及 Release，本阶段排除。仅在 job summary 中发布大小和摘要可以审查构建证据，无法交付安装包。**结论 HOLD**。需解决网络与 XML 路径的剩余公告可达性、完成发布包核验并获人工审批；本轮无候选执行。
