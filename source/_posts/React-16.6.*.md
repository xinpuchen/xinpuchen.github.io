---
title: React 16.6 发布，一大波新功带你看未来的 React 开发方式
date: 2019-01-23 10:12:49
categories: React
tags:
  - React
---

最近（其实已经老久了，只是没跟上）`React` 官方发布了 16.6 版本，开放了一堆新的功能，而这其中的一些新功能，代表这未来的 React 开发方式，让我们来一起窥探未来吧。

<!-- more -->

## lazy

最让人期待的功能肯定就是 `lazy` 功能了，配合发布了一个 `Suspense` 组件，也就是最开始命名为 `Placeholder` 的组件，用来配合 `render` 方法内部的异步操作的，让我们先来看一下 `lazy` 的用法

```jsx
import React, { lazy, Suspense } from "react";
const OtherComponent = lazy(() => import("./OtherComponent"));

function MyComponent() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OtherComponent />
    </Suspense>
  );
}
```

做过 `code-splitting` 的同学能闻到熟悉的味道。以前我们要用第三方包或者自己处理异步过程，现在，`React` 原生支持啦，而且你可以把异步的过程直接扔到 `render` 方法里面，就跟写普通组件一样，而且可以方便得通过 `Suspense` 组件来提供 `fallback`

**然而这并不仅仅 Suspense 的唯一用处，事实上这次 React 正式开放 Suspense 组件代表着所有异步的操作都可以在 render 方法里面做了，其实我很意外，我以为正式开放肯定要等到 17 版本**

那么异步操作还能做啥？如果同学们看过年初 Dan 在冰岛的分享，应该就知道，`Suspense` 能够让我们加载数据的操作变得异常简单。没看过的同学可以看[这里](https://link.juejin.im/?target=https%3A%2F%2Freactjs.org%2Fblog%2F2018%2F03%2F01%2Fsneak-peek-beyond-react-16.html)，现在 npm 上也有一个包提供数据加载的功能了，[simple-cache-provider](https://link.juejin.im/?target=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2Fsimple-cache-provider)，但是现在还不要在正式环境使用他哦。

## React.memo

`ClassComponent` 可以通过继承类 `PureComponent` 或者实现 `shouldComponentUpdate` 来主动判断组件是否需要重新渲染，以此来提高性能，但是 `FunctionalComponent` 到目前为止没有类似的功能。

所以今天 `React` 发布了 `React.memo` 方法，来实现类似 `PureComponent` 的功能，即浅比较 `props` 是否有变化，如果没有变化，就不重新渲染当前组件

```jsx
const FunctionalComponent = React.memo(props => {
  // only render if props change
});
```

## static contextType

在 `React16.3` 中提供了我们一个标准的用于替代老的 `context` 的 `API`，也就是 `React.createContext`，然后通过 `context.Provider` 和 `context.Consumer` 来传递值，这种方式消除了老的 `context API` 性能低下的问题，这个问题我在之前也有详细分析，感兴趣的同学可以看这里，而且老的 `API` 代码量很多，所以下个大版本 `React` 会移除老的 `API`。

但是在让生态插件升级到新的 `API` 的过程中，有人提出在 `ClassComponent` 中用新的 `API 很麻烦，所以`React`提供了一种在`ClassComponent`中使用新`API` 的方法

```jsx
import React, { Component } from "react";

const context = React.createContext("defaultValue");

const ProviderComp = ({ children }) => (
  <context.Provider value="provider">{children}</context.Provider>
);

class ConsumerComp extends Component {
  static contextType = context;

  componentDidMount() {
    console.log(this.context);
  }

  render() {
    return <p>{this.context}</p>;
  }
}

class App extends Component {
  render() {
    return (
      <ProviderComp>
        <ConsumerComp />
      </ProviderComp>
    );
  }
}
```

这也是为了提高`React`的整体性能，移除老旧`API`做努力。

## static getDerivedStateFromError()

在发布 `Error Boundaries` 的时候，`React` 提供了一个新的生命周期方法 `componentDidCatch`，在捕获到错误的时候会触发，你可以在里面修改 `state` 以显示错误提醒的 `UI`，或者将错误信息发送给服务端进行 `log` 用于后期分析。但是这里有个问题，就是在捕获到错误的瞬间，`React` 会在这次渲染周期中将这个组件渲染为 `null`，这就有可能导致他的父组件设置他上面的 `ref` 获得 `null` 而导致一些问题，所以现在提供了这个方法。

这个方法跟 `getDerivedStateFromProps` 类似，唯一的区别是他只有在出现错误的时候才触发，他相对于 `componentDidCatch` 的优势是在当前的渲染周期中就可以修改 `state`，以在当前渲染就可以出现错误的 `UI`，而不需要一个 `null` 的中间态。

而这个方法的出现，也意味着以后出现错误的时候，修改 `state` 应该放在这里去做，而后续收集错误信息之类的放到 `componentDidCatch` 里面。

## StrictMode 下的新提醒

`StrictMode` 是用来提醒开发者用了即将被废弃的 `API` 的，像 `componentWillMount` 这些声明周期都会提醒，这次新加了两个 `API` 的提醒，`ReactDOM.findDOMNode()`，和老的 `context api`。

也代表着这两个下个大版本肯定会被移除。所以兄弟们还不赶紧更新！

[原文链接](https://juejin.im/post/5bd68c446fb9a05d25682654)
