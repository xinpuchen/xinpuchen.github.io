---
title: git 的原理与使用技巧
date: 2021-02-22 18:51:24
categories: 工具
tags:
  - git
  - git-hooks
  - gerrit
  - git-flow
---

![git-compose](/images/git-compose.png)

## 什么是版本控制系统

**版本控制系统** 是一种记录一个或若干文件内容变化，以便将来查阅特定版本修订情况的系统

<!-- more -->

### 版本控制系统的特征

1. 存储内容
2. 跟踪内容更改
3. 与协作者分发内容和历史记录

三大特征分别对应以下三大功能：

1. 数据备份
2. 版本存储
3. 协同合作

### 版本控制系统发展史

- 手动 `copy diff` 打 `patch`
- 引入写入互斥锁的多人合作模式的 `RCS`
- 引入 `branch` 概念采用 `复制-修改-合并` 模式的 `CVS`
- 实现原子操作级别合并的集中式版本控制系统 `SVN`
- 分布式版本控制系统 `git`

> [版本管理三国志 (CVS, Subversion, git))](http://www.cnblogs.com/vamei/archive/2013/02/21/2918069.html)

## 为什么选择 git

### 集中式代表 SVN

![svn](/images/svn.png)

工作模型

1. 主工程师搭好项目框架
2. 在公司服务器创建一个远程仓库，并提交代码
3. 其他人拉取代码，并行开发
4. 每个人独立负责一个功能，开发完成提交代码
5. 其他人随时拉取代码，保持同步

优点：

- 管理方便，逻辑明确，符合一般人思维习惯
- 易于管理，集中式服务器更能保证安全性
- 代码一致性非常高
- 适合人数不多的项目开发

缺点：

- 服务器压力太大，数据库容量暴增
- 如果不能连接到服务器上，就不能提交，还原，对比等一系列工作
- 不适合开源项目开发人数较多的情况（但可以利用权限管理机制，通过将项目分块，管理分级实现分层管理，从而很好的解决开发人数众多的问题）

### 分布式代表 Git

![git](/images/git.png)

工作模型

1. 主工程师搭好项目框架 ，并提交代码到本地仓库
2. 在公司服务器创建一个远程仓库，并将提交推送到远程仓库
3. 其他人把远程仓库所有内容克隆到本地，拥有了各自的本地仓库，开始并行开发
4. 每个人独立负责一个功能，可以把每一个小改动提交到本地（由于本地提交无需立即上传到远程仓库，所以每一步提交不必是一个完整功能，而可以是功能中的一个步骤或块）
5. 功能开发完毕，将和这个功能相关的所有提交从本地推送到远程仓库
6. 每次当有人把新的提交推送到远程仓库的时候，其他人就可以选择把这些提交同步到自己的机器上，并把它们和自己的本地代码合并

优点：

- 适合分布式开发，强调个体
- 公共服务器压力和数据量都不会太大
- 速度快、灵活
- 任意两个开发者之间可以很容易的解决冲突
- 离线工作

缺点：

- 不符合常规思维
- 学习周期相对而言比较长
- 代码权限管理划分粒度不够，一旦开发者把整个库克隆下来就可以完全公开所有代码和版本信息（但可以通过项目拆分和开发者角色来管理项目）

### 结论

**SVN 更偏向于项目管理， Git 更适用于代码管理**

> [SVN与Git比较的优缺点差异](https://www.cnblogs.com/Sungeek/p/9152223.html#sg3)

## Git 原理

### 仓库结构
```sh
└── .git
    ├── COMMIT_EDITMSG    # 保存最新的commit message
    ├── config            # 仓库的配置文件
    ├── description       # 仓库的描述信息，主要给 gitweb 使用
    ├── HEAD              # 指向当前分支
    ├── hooks             # 存放一些 shell 脚本，可以设置特定的 git 命令后触发相应的脚本
    ├── index             # 二进制暂存区（stage）
    ├── info              # 仓库的其他信息
    │   └── exclude       # 本地的排除文件规则，功能和 .gitignore 类似
    ├── logs              # 保存所有更新操作的引用记录，主要用于git reflog 等
    ├── objects           # 所有文件的存储对象
    └── refs              # 具体的引用，主要存储分支和标签的引用
```

### 数据流向

![git-compose](/images/git-compose.png)

1. 在工作目录中添加、修改文件
2. 将需要进行版本管理的文件放入暂存区
3. 将暂存区的文件提交到仓库区

因此，git 中的文件有三种状态：

1. `modified` - 已修改
2. `staged` - 已暂存
3. `committed` - 已提交

### 数据结构

`git` 的核心是它的对象数据库，保存着 `git` 的对象，其中最重要的是 `blob` 对象、`tree`对象和 `commit` 对象

- `blob 对象`：存储文件的内容（表示一个不可变、原始数据的类文件对象），实现了对文件内容的记录
- `tree 对象`：存储一个目录结构，以及子文件或子文件夹的权限、类型、对应的身份证（`SHA-1` 值）、文件名，实现了对文件夹的记录
- `commit 对象`：存储一个提交信息，包括对应目录结构的快照 `tree 对象` 的哈希值、上一个提交的哈希值、提交的作者、提交的时间以及提交的具体信息，实现了对提交信息的记录

![git-structure](/images/git-structure.png)

这三类对象，完美实现了 `git` 的基础功能 **对版本状态的记录**

运行 `git add` 和 `git commit` 命令时， `git` 所做的实质工作是将被改写的文件保存为数据对象，更新暂存区，记录树对象，最后创建一个指明了顶层树对象和父提交的提交对象，数据对象、树对象、提交对象，最初均以单独文件的形式保存在 `.git/objects/` 目录下

`git` 存储的是以文件的内容、目录结构、`commit` 信息等信息作为值，以要存储的数据和一个头部信息作 `SHA-1` 校验运算得到的校验和为 `key`，以 `key-value` 键值对的形式存储的数据库结合默克尔树形成的有向无环图（`DAG`）

以上，`git` 解决了版本状态记录的问题，在此基础上还实现了版本切换、差异比较、分支管理、分布式协作等炫酷功能

**git 底层命令**

- `git hash-object`: 用于向Git数据库中写入数据
- `git cat-file`: 用于查看Git数据库中数据
- `git update-index`: 用于创建暂存区
- `git ls-files`: 用于查看暂存区内容
- `git write-tree`: 用于将暂存区内容写入一个树对象
- `git commit-tree`: 用于创建提交对象
- `git update-ref`: 用于创建或修改引用文件

## Git hooks

在重要动作发生时触发的脚本，可以由任何可执行脚本组成，如 `Shell、Ruby、Python` 脚本，可以看成生命周期执行函数。（例如前端 `MVVM` 框架的生命周期函数）

钩子分两种，客户端钩子 和 服务端钩子

**客户端钩子**：由诸如提交和合并这样的操作所调用

- `pre-commit`: 在键入提交信息前运行。 它用于检查即将提交的快照，例如，检查是否有所遗漏，确保测试运行，以及核查代码
- `prepare-commit-msg`: 在启动提交信息编辑器之前，默认信息被创建之后运行，它允许你编辑提交者所看到的默认信息
- `commit-msg`: 接收一个参数，此参数即上文提到的，存有当前提交信息的临时文件的路径
- `post-commit`: 在整个提交过程完成后运行
- `pre-rebase`: 运行于变基之前，以非零值退出可以中止变基的过程
- `post-rewrite`: 被那些会替换提交记录的命令调用，比如 `git commit --amend` 和 `git rebase`
- `post-checkout`: 在 `git checkout` 成功运行后会被调用
- `post-merge`: 在 `git merge` 成功运行后会被调用
- `pre-push`: 钩子会在 `git push` 运行期间，更新了远程引用但尚未传送对象时被调用

**服务端钩子**：用于诸如接收被推送的提交这样的联网操作

- `pre-receive`: 处理来自客户端的推送操作时调用
- `update`: update 脚本和 pre-receive 脚本十分类似，不同之处在于它会为每一个准备更新的分支各运行一次
- `post-receive`: 在整个过程完结以后运行，可以用来更新其他系统服务或者通知用户

## Gerrit

`Gerrit` 是基于 `SSH` 协议实现的一套 `Git` 服务器，这样就可以对 Git 数据推送进行更为精确的控制，为强制审核的实现建立了基础。其默认端口是 `29418`

`Gerrit` 的 Git 服务器禁止用户直接向 `refs/heads` 命名空间下的引用执行推送（除非特别的授权），而是建立 `refs/for/<branch-name>` 和 `refs/changes/nn/<task-id>/m` 的特殊引用，向 `refs/for/<branch-name>` 命名空间下推送并不会在其中创建引用，而是为新的提交分配一个 ID，称为 `task-id`，并为该 `task-id` 的访问建立 `refs/changes/nn/<task-id>/m` 格式的引用，其中：

- `task-id` 为 Gerrit 为评审任务顺序分配的全局唯一的号码
- `nn` 为 task-id 的后两位数，位数不足用零补齐。即 nn 为 task-id 除以 100 的余数
- `m` 为修订号，该 task-id 的首次提交修订号为 1，如果该修订被打回，重新提交修订号会自增

为了保证已提交审核的修订通过审核入库后，被别的分支 `cherry-pick` 后再推送至服务器时不会产生新的重复的评审任务，Gerrit 设计了一套方法，即：

- 要求每个提交包含唯一的 `Change-Id`，Change-Id 包含在提交日志的 `footer` 中，当执行 `cherry-pick` 时也会保留
- 为了实现 Git 提交中包含唯一的 Change-Id，Gerrit 使用了 `hooks/commit-msg` 钩子，钩子脚本在提交时自动在提交信息中添加 `Change-Id: I...`
- 当 Gerrit 获取到用户向 `refs/for/<branch-name>` 推送的提交中包含 `Change-Id: I...` 时，如果该 `Change-Id` 之前没有见过，会创建一个新的评审任务并分配新的 `task-id`，并在 Gerrit 的数据库中保存 `Change-Id` 和 `Task-Id` 的关联，如果包含了已经处理过的 `Change-Id`，就不再创建新的评审任务和 `task-id`，而直接将提交入库
- 如果用户的提交需要修改，建议开发者保持提交信息中的 `Change-Id: I...` 部分以避免创建新的评审任务，只需选择一个新的修订号

> [Gerrit 代码审核服务器的工作流和原理](https://www.worldhello.net/2010/11/10/2059.html)

## Git Flow

一个好的开发模式，可以提高团队的开发效率，同时提高团队的代码质量

![git-flow](/images/git-flow.png)

![git-assist](/images/git-assist.png)

### 长期分支

- `master` 仓库默认创建分支，可执行版本记录分支，上面的每个节点都是发布到线上的一个版本，具体的版本号【[语义化版本 2.0.0](https://semver.org/)】由 `tag` 确定
- `develop` 代码开发分支，基于远程 `master` 分支创建，保有当前即将发布或是已经发布的代码，是确定的下一次将要通过 `release` 分支合并到 `master` 上的分支

### 短期分支

- `feature` 详细功能分支，每个功能分支应该尽可能的小，开发完成之后尽快移入仓库中
- `release` 测试版本发布分支，同时接收该版本的 `bugfix`，直到稳定之后再发布到 `master`，同时并合并到 `develop` 分支
- `hotfix` 紧急修复线上 `bug` 分支，直接从 `master` 的版本分出，同时最小版本号加 1，修复完成后发布一个最新版本，同时合并到 `develop` 分支

> 符合项目和团队的 `git` 开发模式，才是真正意义上的 `git-flow`

## 实用技巧

- 你每一行命令，你都知道你在干什么，仓库的数据流向是什么
- `git commit` 之前先 `git status` 检查一下有没有无意间改动了其他文件
- `git commit --amend` 修改最近一次 `commit`
- 写好 `commit message`，推荐规范 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/v1.0.0-beta.4/)
- 提交之后结合界面工具，进一步确认，等需要部署的时候再 `merge` 代码
- 不要使用 `git push -f`，除非是个人项目或个人分支（自认倒霉吧）
- 对比两个分支不同文件的统计 `git diff --stat origin/<branch-name>`
- 对比两个分支的不同提交 `git log <branch-name>..origin/<branch-name>`
- `git reset` 撤销代码的各种情况
- 不要在公共的远程分支中使用 `rebase`、`reset`等会修改这条分支已经存在的 `commit object` 的命令
- `git rebase -i` 交互式的妙用，可对提交记录进行修改
- `git reflog`的妙用，`ref` 的 `log`，也可以理解成**版本控制的版本控制**
- `git bisect` 二分查找出现问题的变更节点

## 提效

- 安装 `iTerm2 & zsh & oh-my-zsh`，[推荐主题 Starship](https://starship.rs/)，强大的命令提示和 `alias`
- 多使用 `Tab` 键，快速提示的前提下，还能检测已输入的命令有没有错误
- 常用 `IDE` 配置合理插件，命令行操作搭配 `IDE` 解决冲突和代码校验更高效
- 推荐 `git` 上手游戏 [learnGitBranching](https://github.com/pcottle/learnGitBranching)
