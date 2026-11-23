# P0-01R 下一阶段：Windows 云端构建只读审查任务

## 已核对事实（2026-11-23）
- 仓库：`WGH777/moyu`；`master` HEAD：`073892913e252b05a9ef1df20f142393bfd38ebc`。
- `AGENTS.md` 仍是既有版本；GitHub `master` 当前未发现 `.github/workflows` 目录。
- 用户报告：仓库已克隆到 `E:\Projects\moyu`；前端安装和构建成功；Tauri 本机启动因未找到 Cargo 而受阻。
- Windows 原生构建、桌宠窗口和性能尚未通过实机验收。

## 任务目标
在不安装本地 Rust/MSVC、不更改业务代码的前提下，为该固定源提交设计最小 GitHub Actions Windows 构建方案，产出可用于 P0-01 Windows 实机验收的安装包/构建产物。

## 只读检查清单
1. 阅读 `AGENTS.md`、`package.json`、`pnpm-lock.yaml`、`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json`。
2. 核实 Tauri CLI 2 的支持打包方式；确定 Windows Runner 上 Rust MSVC、Windows SDK、WebView2 所需条件。
3. 检查 `pnpm` 版本与锁文件兼容性，优先冻结安装，禁止自动依赖升级。
4. 设计工作流：手动触发；只读权限；checkout 固定提交；构建 Windows x64；上传 Actions artifact；记录 Commit、SHA-256、工具版本；不自动发布 Release、不签名、不访问 Secret。
5. 所有第三方 Action 固定审查过的完整 SHA，不用 `@main` 或浮动版本标签。
6. 检查仓库 Actions 运行权限、额度和产物保留期；无法直接确认的事项标记未核实。
7. 列出最小新增文件、风险、验证标准与回退方式，并完成候选资源审查单。

## 暂不授权
- 不得更改 `master`，不创建 CI 工作流，不触发 Actions，不安装本机 Rust/Cargo/MSVC，不运行陌生脚本。
- 实际实施必须另获人工批准。首次运行顺序为：独立分支静态审查 → 人工批准合并默认分支 → 再次人工批准手动触发。下载校验后的产物另行开展 P0-01。

## S1 静态复核（2026-11-23）

拟新增 .github/workflows/windows-test-package.yml；本轮仅设计。上传 Action 的[准入记录](../security/reviews/actions-upload-artifact.md)为 HOLD。

1. 仅 workflow_dispatch，限定获批默认分支，无用户提供的命令、URL 或 ref。公共仓库使用 permissions: {}、固定 HTTPS 地址和匿名 git fetch 固定 40 位提交，在空目录 detached checkout 后逐字符核对 HEAD。记录 workflow_sha 与源码 SHA。禁止 Release、签名、OIDC 或用户 Secret。
2. 官方 windows-2022 镜像清单 20261116.370.1 列出 Node 24.22.3、Rustup 1.29.3、Cargo 1.100.0、NSIS 3.10、VC x86/x64 工具组件 17.14.36510.44 和 SDK 22621/26100 组件。镜像标签会滚动，组件编号并非 cl.exe 版本。首次执行前需锁定/核实 pnpm 11.25.0、rustc 精确版本及 MSVC host/target、cl/link 和实际使用的 SDK；不符即停。仓库允许列表、额度、保留上限和 runner 调度未验证。
3. pnpm.cmd install --frozen-lockfile；拟用 pnpm.cmd exec tauri build --target x86_64-pc-windows-msvc --bundles nsis -- --locked。CLI 2.12.4 build 源码有 bundles 与透传 args；验证实际 cargo 收到 --locked。beforeBuildCommand 运行 pnpm build。前后比较 pnpm-lock.yaml、src-tauri/Cargo.lock 摘要和跟踪树。Windows 实际打包 NOT_TESTED。
4. CLI 对应 bundler 源码指定 NSIS 3.13 和 nsis-tauri-utils 0.5.3 DLL，并有 SHA-1 校验。runner 预装 NSIS 3.10 不足以证明无辅助下载。官方 release API 返回 nsis-3.13.zip 的 SHA-256 为 ba63dffc4410ee89193e1cb5a41989991bd77c61068da17e3156d136b7b0b3d8，DLL 为 5ba143b5db4a87d32d6e7802e033330aae56cbceabe0d1e3ba41948385ad4709。实施前验证下载实物、受控缓存命中和 WebView2 引导器路径及网络行为；异常下载即停止。
5. 只验收唯一 x64 NSIS 测试 EXE。build-info.json 记录文件名、字节数、源码及工作流 SHA、run ID/attempt、工具与镜像版本、锁文件及安装器摘要。SHA256SUMS.txt 校验安装器和 build-info.json。上传后独立记录 artifact ID 和归档摘要，下载后复核文件摘要。保留期拟 7 天，受仓库上限约束。失败不上传，回退经批准停用工作流/删除指定产物，实机安装另行验收。

[镜像清单](https://github.com/actions/runner-images/blob/main/images/windows/Windows2022-Readme.md) · [CLI 参数源码](https://github.com/tauri-apps/tauri/blob/tauri-cli-v2.12.4/crates/tauri-cli/src/build.rs) · [NSIS 下载实现](https://github.com/tauri-apps/tauri/blob/tauri-cli-v2.12.4/crates/tauri-bundler/src/bundle/windows/nsis/mod.rs) · [手动触发条件](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)

## S2 静态审查草案（2026-11-23）

状态：可审查构建设计，产物上传 HOLD。以下是审查步骤，当前无可运行的工作流文件。

- 入口仅 workflow_dispatch，批准后先让定义进入默认分支，再人工触发。permissions: {}。只用 windows-2022 标准 x64 托管 runner，不读用户 Secret、不给 OIDC。GitHub 公共仓库的标准 runner 计算通常免费；账号、策略、实际可调度性、保留上限和其他计费用量未确认，首次执行前以仓库及账户实际设置为准。[计费说明](https://docs.github.com/en/actions/concepts/billing-and-usage)
- 使用空目录中的匿名 HTTPS Git fetch，远端限定 WGH777/moyu，源码身份逐字符检查为 073892913e252b05a9ef1df20f142393bfd38ebc。记录 workflow_sha 与运行镜像号；不使用来自触发输入的 ref、命令或 URL。
- 前置检查记录 Node 24.22.3、pnpm 11.25.0、rustc/cargo 的精确版本和 MSVC target、MSVC cl/link 及实际 Windows SDK。Node/pnpm 为本机前端已用版本，pnpm 在 runner 的供应方式待核验。windows-2022 清单可作候选证据，镜像滚动且并非执行证据。固定并核验需下载的工具版本与摘要；拒绝不匹配。
- pnpm.cmd install --frozen-lockfile。Tauri CLI 2.12.4 锁定，候选调用 pnpm.cmd exec tauri build --target x86_64-pc-windows-msvc --bundles nsis -- --locked，当前仅静态源码佐证透传。直接核对锁文件、实际 Cargo 调用、构建结果与跟踪树。
- NSIS 3.13 与 nsis-tauri-utils DLL 0.5.3 使用 S1 列出的上游 URL 和发行资产 SHA-256，实际二进制校验、缓存完整性和额外出站尚未验证。固定源码未选 WebView2 策略，Tauri 默认 downloadBootstrapper，安装主机缺运行时时可产生 Microsoft 下载。首次实机采用已预装并记录版本的 WebView2；联网安装路径须独立验收。没有预装时记录未测并停止该用例。[WebView2 安装模式](https://v2.tauri.app/distribute/windows-installer/#webview2-installation-options)
- 安装器、build-info.json、SHA256SUMS.txt 按审查记录逐件预检。记录两份锁文件摘要、源码和执行定义 SHA、工具版本、文件大小、run ID 和 attempt。计划上传后的信息含独立归档摘要，下载后再次复算。保留拟 7 天并服从账号设置。发现问题时经授权停用工作流、留存 run ID 并撤回受影响产物。上传仍为 HOLD，本草案无 uses 引用。

可静态审阅的范围为触发、权限、源码检出、工具与构建参数及产物校验。待批准的实施前置为上传准入、runner/账户核验、安全下载及匹配的工具版本。构建、上传与安装均为 NOT_TESTED。

## S3A 编译工作流复核（2026-11-23）

本节对应 .github/workflows/windows-build-smoke.yml。静态评审 PASS，执行 HOLD。该工作流只编译 EXE 并输出名称、大小、摘要。安装器、产物上传和发布均在本阶段之外。

- 解析和规则：PyYAML 6.0.3 SafeLoader 保留 Actions 的 on 键拼写并拒绝重复映射键。jsonschema 4.25.1 使用 SchemaStore 固定 af26ac7e94ec248966b90cd5bb6dee8b1ff59bce 的 draft-07 schema 校验完整结构。另断言事件、仓库、分支、runner、空权限和唯一 run 步骤，PowerShell AST 确认 HOLD 是两条错误处理赋值后的无条件 throw。在默认分支出现工作流定义后才具备手动触发条件。
- 版本边界：源码 SHA、Node 24.22.3 x64、pnpm 11.25.0 与 SHA-512、Tauri CLI 2.12.4、Rust/Cargo 1.100.0 MSVC host 及 SDK 10.0.26100.0 严格核对。Git for Windows 2.x 至少 2.56.1、rustup 1.x 至少 1.29.3，MSVC 采用 14.44 家族且验证实际 Hostx64/x64 cl/link 路径，记录实测版本。这些兼容范围用于滚动镜像上的辅助或系统工具。镜像调度及实机工具匹配未测。
- Windows CLI 实证：在固定提交的临时副本，以现有 pnpm 11.25.0 执行离线、冻结、禁用脚本的依赖安装。先因缺少离线公告元数据失败，指定 S3 原有 E 盘缓存后通过供应链检查，复用了 54 个包。实际 pnpm.cmd exec tauri --version 返回 tauri-cli 2.12.4，确认该 Windows x64 环境的原生 CLI 无需安装脚本即可运行。托管 runner 的全新在线安装未测。
- Cargo 透传实证：在同一临时副本，用自编写的参数记录替身代替 Cargo，伪造 metadata、提供最小 dist，并在临时配置移除前端钩子。实际 CLI 收到 build --no-bundle --target x86_64-pc-windows-msvc -- --frozen 后，子进程记录 cargo build --frozen --bins --features tauri/custom-protocol --release --target x86_64-pc-windows-msvc。替身故意返回非零，CLI 也失败。此实验没有运行真实 Cargo 或 Rust 构建，也没有运行工作流。
- 网络、文件与凭据：Git 配置与凭据助手已隔离，源码检出到全新目录。固定 pnpm tarball 校验后解压，依赖下载及公告查询联系 npm，Cargo fetch --locked 访问 crates.io 索引和锁定的发布包来源。Cargo --frozen 同时要求锁定和离线，约束 Cargo 自己的依赖解析，不能阻止 build.rs、proc macro、前端脚本或编译工具自行访问网络。预期写入临时源码、pnpm 存储、Cargo 缓存和 target、前端 dist。已限定 VS 环境读取、移除已知 npm/Cargo 配置及产物 Token 环境项，并将跟踪文件比较设为静默。runner 仍具有进程文件系统及出站权限，第三方子进程的实际读写、环境访问及日志尚未测。需复核项目及锁定依赖的构建脚本和异常下载，不能把这些设置视作沙箱。
- NSIS、DLL、WebView2 安装组件不在 no-bundle 路径。Action 上传仍为 HOLD 且无工作流引用。首次真实编译前完成脚本和出站风险审查，并取得单独人工授权。

[GitHub 手动触发文档](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow) · [固定 SchemaStore schema](https://github.com/SchemaStore/schemastore/blob/af26ac7e94ec248966b90cd5bb6dee8b1ff59bce/src/schemas/json/github-workflow.json) · [Cargo fetch 文档](https://doc.rust-lang.org/cargo/commands/cargo-fetch.html)
