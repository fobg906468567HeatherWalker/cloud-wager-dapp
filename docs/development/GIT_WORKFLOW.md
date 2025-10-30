# Git 工作流程指南 | Git Workflow Guide

## ✅ 配置完成 | Configuration Complete

您的 Git 配置已完成：
- ✅ Git 作者信息已配置为 `.env` 文件中的信息
- ✅ 所有历史提交的作者已更新（移除 bot 作者）
- ✅ GitHub 仓库已设置为公开
- ✅ `.env` 文件已被正确排除（不会提交到 GitHub）
- ✅ 自动提交脚本已创建

---

## 🔧 当前配置 | Current Configuration

**Git 作者信息** (来自 `.env`):
```
用户名 Username: chadellis202403011298
邮箱 Email: argent-quiver.0h@icloud.com
```

**GitHub 仓库 Repository**:
```
仓库 Repo: https://github.com/fobg906468567HeatherWalker/cloud-wager-dapp
状态 Status: 公开 (Public) ✅
```

**排除的文件 Excluded Files**:
- `.env` (环境变量，包含密钥)
- `.env.local`
- `.env.*.local`
- `node_modules/`
- `dist/`
- 其他构建产物

---

## 🚀 快速提交方法 | Quick Commit Methods

### 方法 1: 使用自动脚本 (推荐)

```bash
# 方式 A: 提供提交消息
./scripts/git-commit.sh "feat: Add new feature"

# 方式 B: 交互式输入
./scripts/git-commit.sh
# 然后输入提交消息

# 方式 C: 使用 npm 命令
npm run git:commit
```

脚本会自动：
1. 加载 `.env` 中的作者信息
2. 配置 Git 用户
3. 暂存所有更改
4. 创建提交
5. 推送到 GitHub
6. 显示 GitHub 链接

---

### 方法 2: 手动 Git 命令

```bash
# 1. 查看更改
git status

# 2. 暂存所有文件
git add -A

# 3. 提交（作者信息会自动使用 .env 配置）
git commit -m "feat: Your commit message"

# 4. 推送到 GitHub
git push origin main
```

---

## 📝 提交消息规范 | Commit Message Convention

推荐使用 **Conventional Commits** 格式：

```
<type>: <description>

[optional body]
[optional footer]
```

### 常用类型 Common Types:

| 类型 Type | 说明 Description | 示例 Example |
|----------|-----------------|--------------|
| `feat` | 新功能 New feature | `feat: Add weather forecast encryption` |
| `fix` | 修复 Bug Fix | `fix: Resolve network switching issue` |
| `docs` | 文档 Documentation | `docs: Update README with deployment steps` |
| `style` | 代码格式 Code style | `style: Format components with Prettier` |
| `refactor` | 重构 Refactor | `refactor: Simplify FHE initialization logic` |
| `test` | 测试 Tests | `test: Add integration tests for contracts` |
| `chore` | 构建/工具 Build/Tools | `chore: Update dependencies` |

### 示例 Examples:

```bash
# 添加新功能
./scripts/git-commit.sh "feat: Implement multi-signature wallet support"

# 修复 Bug
./scripts/git-commit.sh "fix: Resolve Coinbase wallet connection issue"

# 更新文档
./scripts/git-commit.sh "docs: Add Chinese documentation"

# 优化性能
./scripts/git-commit.sh "perf: Optimize FHE encryption performance"

# 更新依赖
./scripts/git-commit.sh "chore: Update wagmi to v2.14.0"
```

---

## 🔐 安全检查清单 | Security Checklist

在每次提交前，确保：

- [ ] ✅ `.env` 文件未被添加到提交中
- [ ] ✅ 没有私钥或密钥在代码中
- [ ] ✅ API tokens 使用环境变量
- [ ] ✅ 合约地址从 `.env` 读取

### 验证 .env 未被跟踪:

```bash
# 检查 .env 是否在暂存区
git status | grep ".env"

# 应该看到 (如果有更改):
# (use "git add <file>..." to include in what will be committed)
#   .env  <- 这是正常的，不会被提交

# 检查 .env 是否被 Git 跟踪
git ls-files | grep "^.env$"
# 如果没有输出，说明 .env 正确地未被跟踪 ✅
```

---

## 🌿 分支管理 | Branch Management

### 创建新分支 Create New Branch:

```bash
# 创建功能分支
git checkout -b feature/your-feature-name

# 创建修复分支
git checkout -b fix/issue-description
```

### 切换分支 Switch Branch:

```bash
# 切换到主分支
git checkout main

# 切换到开发分支
git checkout develop
```

### 合并分支 Merge Branch:

```bash
# 1. 切换到主分支
git checkout main

# 2. 合并功能分支
git merge feature/your-feature-name

# 3. 推送
git push origin main
```

---

## 📊 查看历史 | View History

```bash
# 查看提交历史
git log --oneline

# 查看详细历史
git log --all --graph --decorate --oneline

# 查看特定文件的历史
git log --follow src/lib/fhe.ts

# 查看作者统计
git shortlog -sn
```

---

## 🔄 同步远程仓库 | Sync with Remote

```bash
# 拉取最新更改
git pull origin main

# 查看远程仓库状态
git remote -v

# 查看远程分支
git branch -r
```

---

## 🆘 常见问题解决 | Troubleshooting

### 问题 1: 提交后发现包含了敏感信息

```bash
# 回退最后一次提交（但保留更改）
git reset --soft HEAD~1

# 移除敏感文件
git rm --cached .env

# 重新提交
git commit -m "your message"
```

### 问题 2: 推送失败 (需要强制推送)

```bash
# ⚠️ 谨慎使用！这会覆盖远程历史
git push origin main --force

# 或使用更安全的方式
git push origin main --force-with-lease
```

### 问题 3: 作者信息不正确

```bash
# 检查当前配置
git config user.name
git config user.email

# 重新加载 .env 并配置
source .env
git config user.name "$GITHUB_USERNAME"
git config user.email "$GITHUB_EMAIL"
```

### 问题 4: .env 文件被意外提交

```bash
# 从 Git 历史中移除 .env（但保留本地文件）
git rm --cached .env

# 确保 .gitignore 包含 .env
echo ".env" >> .gitignore

# 提交更改
git add .gitignore
git commit -m "chore: Remove .env from Git tracking"
git push origin main --force-with-lease
```

---

## 📦 NPM 脚本 | NPM Scripts

为方便使用，可以在 `package.json` 中添加：

```json
{
  "scripts": {
    "git:commit": "bash scripts/git-commit.sh",
    "git:status": "git status",
    "git:log": "git log --oneline --graph --decorate",
    "git:push": "git push origin main"
  }
}
```

然后使用：

```bash
npm run git:commit
npm run git:status
npm run git:log
```

---

## 🎯 最佳实践 | Best Practices

1. **频繁提交** Commit Often
   - 每完成一个小功能就提交
   - 不要等到积累大量更改才提交

2. **清晰的消息** Clear Messages
   - 使用有意义的提交消息
   - 遵循 Conventional Commits 规范

3. **保持同步** Stay Synced
   - 开始工作前先 `git pull`
   - 完成工作后及时 `git push`

4. **分支管理** Branch Management
   - 主分支保持稳定
   - 新功能在独立分支开发
   - 测试通过后再合并

5. **代码审查** Code Review
   - 重要更改前先查看 diff
   - 使用 `git diff` 检查更改

6. **保护隐私** Protect Privacy
   - 永远不提交 `.env` 文件
   - 定期检查 `.gitignore`

---

## 🔗 有用的链接 | Useful Links

- **GitHub 仓库**: https://github.com/fobg906468567HeatherWalker/cloud-wager-dapp
- **提交历史**: https://github.com/fobg906468567HeatherWalker/cloud-wager-dapp/commits/main
- **Git 文档**: https://git-scm.com/doc
- **Conventional Commits**: https://www.conventionalcommits.org/

---

## ✨ 快速开始 | Quick Start

1. **修改代码** Make changes
2. **运行脚本** Run script:
   ```bash
   ./scripts/git-commit.sh "feat: Your feature description"
   ```
3. **查看 GitHub** Check GitHub:
   ```
   https://github.com/fobg906468567HeatherWalker/cloud-wager-dapp
   ```

就是这么简单！🎉

---

**作者 Author**: ${GITHUB_USERNAME} <${GITHUB_EMAIL}>
**项目 Project**: WeatherWager - Privacy-Preserving Weather Predictions
**许可 License**: MIT
