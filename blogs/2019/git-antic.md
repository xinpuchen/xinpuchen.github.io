---
title: git 使用小技巧
date: 2019-01-03 00:04:15
categories: 工具
tags:
  - Git
---

现在代码管理工具基本是 git 的天下了，除了一些很保守的公司还在用 svn，其他基本都是自己搭一个 gitlab，下面总结一下 git 实用技巧。

<!-- more -->

### 本地目录如何关联远程仓库?

```bash
git remote add <主机名> <网址>
git remote add origin git@github.com:wulv/scripts.git
```

### 如何让推送不用每次输密码？

使用 ssh 的方式，在 GitHub 的https://github.com/settings/keys设置一下SSH keys，关于 SSH keys 生成的问题查看https://help.github.com/articles/connecting-to-github-with-ssh/

### 如何回退一个文件？

- 如果还没 git add，使用 ctrl + z 吧，如果想回到没添加文件之前，使用 git clean -df
- 如果已经 git add，还没 commit，使用 git checkout -- files
- 如果已经 git commit，还没有 push，使用 git reset `<commit>` files
- 如果已经 git push 了，使用 git revert `<commit>`，恢复一个指定提交。

### 已经添加到仓库的文件如何忽略不提交？

将文件添加到.gitignore，然后 git rm files

### 当前分支还没开发完，突然需要到另外一个分支修复紧急 bug 如何处理？

首先确认当前分支能否提交，可以提交的直接 commit，但一般代码没写完不好提交，就储藏工作目录与暂存区的状态到堆栈中 git stash，切换到另外一个分支修复 bug 后，切回本分支，git stash pop。

### 仓库依赖另外一个仓库？

比如本博客仓库依赖一个主题，但我想对这个主题进行一些修改，首先我从原作者的主题仓库 fork 一份到我自己仓库，做一些修改，以后原作者有更新我还是想 pull 过来，这样既享受原作者的更新，又可以自己修改一些特殊的需求。将 fork 下来的仓库与原作者的仓库关联起来：git remote add remote-name remote-url，然后更新时拉取指定远程仓库指定分支到本地仓库指定分支：git pull remoterepository branchname[:localbranch]。

在父仓库里添加子仓库：git submodule add repository-url dir，这个时候会出现一个.gitmodules 文件,这是一个配置文件，保存了项目 URL 和你拉取到的本地子目录。如果克隆了一个带子模块的项目，你必须运行两个命令：git submodule init 来初始化你的本地配置文件，git submodule update 来从那个项目拉取所有数据并检出你上层项目里所列的合适的提交。

### 如何查看提交记录？

- git log：查看提交记录
- git log --oneline：查看提交记录，以 oneline 形式显示，只显示一行，显示的内容时提交 hash 的前 7 位与提交消息
- git log -p -times：表示查看最近 times 次提交改变的内容
- git log --author="`<pattern>`"： 查找某位作者的提交记录
- git log --grep="`<pattern>`"：搜索有某字符串的提交记录
- git log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit：图形化显示提交历史

### 比较两次提交或分支的差异？

- git diff：查看工作目录与暂存区的差异
- git diff --cached [`<commit>`]：查看暂存区与指定提交（默认是 HEAD）的差异
- git diff `<commit>`：查看工作目录与指定提交的差异
- git diff `<commit>`：查看工作目录与指定提交的差异
- git diff `<commit>` `<commit>`：查看两次指定提交的差异
- git diff branchname：查看工作目录与指定分支的差异
- git diff branchname branchname：查看两个指定分支间的差异

> 上面的所有操作后面都可以加上-- dir 表示查看该目录下面的差异，在后面加上>patchname.patch 表示将差异生成补丁，patchname 是补丁的名字。

### 有两个稳定版本，将其中一个版本的功能应用到另外一个版本？

比如某仓库有 VIP 版和普通版，分别在两个分支开发，普通版更新了一些功能，VIP 版也希望将更新应用到分支，但又不能直接将普通版的分支 merge 过来，这个时候使用：git cherry-pick `<commit id>`将另一个分支上面的指定提交应用到当前分支上。

### 分支太多，如何批量删除一个星期之前分支？

```bash
#!/bin/bash
#删除一个星期之前的所有本地分支
for k in $(git branch | sed /\*/d); do
  if [ -n "$(git log -1 --before='1 week ago' -s $k)" ]; then
    git branch -D $k
  fi
done
```
