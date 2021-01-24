---
title: 使用懒加载和 Suspense 提高 React 性能
date: 2019-01-25 23:10:06
categories: React
tags:
  - JavaScript
  - React
---

Lazy loading💤 已经成为被广泛应用于加载提速的优化技术之一。延迟加载的前景有助于将某些 web app 出现程序性能问题的风险降至最低〽。

在本文中，我们将研究如何使用 Lazy loading💤 来优化 React 应用程序中的加载时间。

<!-- more -->

# 什么是 Lazy Loading💤？

懒加载是一种优化技巧 💫 我们通过延迟对象(图片 🎦, 视频 🎬, 网页 🌎, 音乐 🎶, 文档 📋) 加载直到他们被使用。

当用户打开一个页面，所有的内容将一次性下载下来。大多数内容可能永远也不会发生作用或者被用户看见。所以为什么要浪费宝贵的资源和带宽呢？

为了提高我们网站的响应时间，我们选择延迟加载一些应用程序中的非关键部分。当用户需要访问这些部分的时候，再加载这些资源。

# SSR, CSR 和 React

我们有 SSR(server-side rendered / 服务端呈现)应用程序和 CSR(Client side rendered / 客户端呈现)应用程序。

SSR 是使用.HTML 构建的优秀传统页面，可以选择配合 ASP.NEt 或是 PHP 等来使用。每个连接都有一个不同的.HTML 文件需要加载。

```conf
web-app/
 - index.html
 - about.html
 - faq.html
 - careers.html
```

每个页面都要记载不同的 HTML 文件。

随着 JS 框架的出现，网页被浑河成为一个单独的 js 并一次性加载完成。在浏览器中执行时，浏览器 DOM 生成所请求的页面。

在 React 中，假设我们有这样的应用程序：

```js
// index.js
export default () => (
  <Switch>
    <Route path="/about" component={About} />
    <Route path="/faq" component={FAQ} />
    <Route path="/careers" component={Careers} />
  </Switch>
);
// about.js
class About extends Component {
  render() {
    return <div>About page</div>;
  }
}
// faq.js
class FAQ extends Component {
  render() {
    return <div>FAQ page</div>;
  }
}
// careers.js
class Careers extends Component {
  render() {
    return <div>Careers page</div>;
  }
}
```

在打包时，webpack 将所有的 js 文件打包成一个`index.js`

```conf
react-app/
 dist/
  - index.html
  - index.js
```

所有的文件包括 index.js, about.js, faq.js, careers.js 都捆绑在一个文件中。现在，当我们加载 index.html 文件时，它会沿着负载很重的 index.js 被加载。现在，解析 index.js 和渲染中的所有代码所花费的时间 ⏰ 将是漫长的等待。如果每个文件执行所花费的时间如下：

- index.js 2ms
- about.js 10ms
- faq.js 5ms
- careers.js 9ms

打包后:

- index.js 26ms

所以我们会等待`26ms`!!但是如果我们可以将 React 中的文件分开并按需加载它们，我们将在`2ms`内看到程序加载并相应。

因此，我们可以将包拆分成多个小块并在运行时动态加载，而非一次性下载整个代码。

已经有很多技术用于支持将 React apps 做代码拆分了。我们在下一节中有更多的讲解。

# ⏬Dynamic Import

为了将我们的 JS 应用做代码分割，将引入 import()函数，目前它仍是一个提案，尚未成为 JavaScript 标准的一部分。

此功能可以将我们的应用程序拆分成为块并按需加载它们。

The import()接受一个字符串作为参数。字符串是将要加载的 js 文件的路径。

```js
import("./js_file_to_load.js");
```

当 webpack 遇到这种情况时，它就会将文件分别捆绑在不同路径中。

# 💤React.lazy()

React.lazy 是 Reactv16.6 发布时添加到 React 的新特性，它为我们的 React 组件提供了一种简单直接的方法来完成延迟加载和代码分割。

> *React.lazy 函数允许你将动态导入的组件按常规呈现。 —* [_React blog_](http://reactjs.org/docs/code-splitting.html)

React.lazy 可以轻松创建和渲染组件并动态的导入它们。React.lazy 将函数作为参数：

```js
React.lazy(() => {});
// or
function cb() {}
React.lazy(cb);
```

这个回调函数必须使用动态`import()`语法来加载组件的文件：

```js
// MyComponent.js
class MyComponent extends Component {
  render() {
    return <div>MyComponent</div>;
  }
}
const MyComponent = React.lazy(() => {
  import("./MyComponent.js");
});
function AppComponent() {
  return (
    <div>
      <MyComponent />
    </div>
  );
}
// or
function cb() {
  return import("./MyComponent.js");
}
const MyComponent = React.lazy(cb);
function AppComponent() {
  return (
    <div>
      <MyComponent />
    </div>
  );
}
```

React.lazy 的回调函数会通过`import()`的调用返回一个 Promise 对象。如果模块加载成功则 Promise 对象 resolve，如果由于网络故障，路径解析错误，找不到文件等原因加载模块时出错，则 Promise 对象 reject。

当 webpack 遍历我们的代码进行编译打包的时候，它会在遇到`React.lazy()`和`import()`时，创建一个单独的捆绑包。我们的应用程序将如下显示：

```conf
react-app
 dist/
  - index.html
  - main.b1234.js (contains Appcomponent and bootstrap code)
  - mycomponent.bc4567.js (contains MyComponent)
/** index.html **/
<head>
    <div id="root"></div>
    <script src="main.b1234.js"></script>
</head>
```

现在，我们的应用程序分为多个捆绑包。当 AppComponent 被渲染的时候，mycomponent.bc4567.js 文件将被加载并在 DOM 上的显示包含 MyComponent。

> 译者注：目前 React.lazy 还不支持服务端使用，目前官方推荐使用[Loadable Components](https://github.com/smooth-code/loadable-components)，它有很棒的[服务端渲染指南](https://github.com/smooth-code/loadable-components/blob/master/packages/server/README.md)。或者你也可以尝试使用[react-loadable](https://github.com/jamiebuilds/react-loadable)，这是一个小型库，用于加载具有动态导入组件的高阶组件，使用它你可以完成错误超时状态配置、避免加载闪烁、加载多个资源、预加载、服务端渲染等功能。

# 🚦React Suspense

现在，当文件 mycomponent.bc4567.js 被加载时会发生什么，从加载到 MyComponent 被渲染必定会有一个时间延迟。用户会看到什么呢？

显然，你的应用程序似乎会冻结一段时间。这将是个糟糕的用户体验。我们需要让用户指导正在发生或加载的事情。为了做到这一点，添加了与 React.lazy 相关联的新特性，他就是`Suspense`组件。

Suspense 组件用于包装延迟组件，以在加载惰性组件时显示一些备用信息。

```js
const Lazycomponent = React.lazy(() => import("./lazy.component.js"));
function AppComponent() {
  return (
    <div>
      <Suspense fallback={<div>loading ...</div>}>
        <LazyComponent />
      </Suspense>
    </div>
  );
}
```

正在延迟加载的组件将插入到 Suspense 组件的标记内。向用户展示的内容告诉他们正在进行的内容放在 Suspense 组件标记的 fallback prop 中。

组件也可以用于 fallback prop：

```js
// ...
function LoadingIndicator() {
  return <div>loading ...</div>;
}
function AppComponent() {
  return (
    <div>
      <Suspense fallback={<LoadingIndicator />}>
        <LazyComponent />
      </Suspense>
    </div>
  );
}
```

可以再 Suspense 标记中放置多个惰性组件。

```js
const Lazycomponent1 = React.lazy(() => import("./lazy.component1.js"));
const Lazycomponent2 = React.lazy(() => import("./lazy.component2.js"));
const Lazycomponent3 = React.lazy(() => import("./lazy.component3.js"));
const Lazycomponent4 = React.lazy(() => import("./lazy.component4.js"));
function AppComponent() {
  return;
  <div>
    <Suspense fallback={<div>loading ...</div>}>
      <LazyComponent1 />
      <LazyComponent2 />
      <LazyComponent3 />
      <LazyComponent4 />
    </Suspense>
  </div>;
}
```

# 👮 捕获加载错误

在我们使用 React.lazy 时，我们提到 import()函数会返回一个 Promise 对象，可能会由于某些原因在 reject 中返回加载错误：

- 网络故障
- 文件未找到
- 文件路径错误

现在，我们不希望我们的应用程序因为这些悲惨地发生错误。我们希望荣耀的有尊严地错误。为了在失败时展现出良好的用户体验，我们将在惰性组件上放置一个错误边界。

```js
const Lazycomponent1 = React.lazy(()=>import('./lazy.component1.js'))
const Lazycomponent2 = React.lazy(()=>import('./lazy.component2.js'))
const Lazycomponent3 = React.lazy(()=>import('./lazy.component3.js'))
const Lazycomponent4 = React.lazy(()=>import('./lazy.component4.js'))
import ErrorBoundary from './error.boundary.js'
function AppComponent() {
    return
    <div>
        <ErrorBoundary>
            <Suspense fallback={<div>loading ...</div>}>
                <LazyComponent1 />
                <LazyComponent2 />
                <LazyComponent3 />
                <LazyComponent4 />
            </Suspense>
        <ErrorBoundary/>
    </div>
}
```

# ✂ 基于路由（route-based）的代码拆分

如何拆分代码是个棘手的问题。有两种最常用的方法是基于路由（`route-based`）拆分和基于组件（`component-based`）拆分。

> _基于路由的代码拆分将应用程序分解为每个路由对应的块。_

基于路由的代码拆分是将代码拆分为与应用程序路由相关的包。在 SPA（single page web application，单页面应用）中，所有的 route 或 path 都是在 DOM 上完成的。当你点击超链接时，DOM 捕获事件并通过 SPA 框架运行它，在 DOM 中将销毁当前视图当组件附加请求路径创建并呈现的时候。

所有的这些组件都捆绑在一个文件中被传递。现在，通过基于路由的分块，我们可以将代码分成块。每个块只与特定路由有关。

```js
// index,js
// ...
const App = () => (
  <Switch>
    <Route path="/about" component={About} />
    <Route path="/faq" component={FAQ} />
    <Route path="/careers" component={Careers} />
  </Switch>
);
```

当我们使用基于路由的方法拆分次应用程序时，我们将看到：

```conf
react-app/
 - index.html
 - index.bacd0123.js (contains App)
 - about.1234.js (contains About component)
 - faq.5678.js (contains FAQ component)
 - careers.9012.js (contains Careers component)
/** index.html **/
<head>
    <div id="root"></div>
    <script src="index.bacd0123.js"></script>
</head>
```

当我们加载我们的 app 路径`/`时，应用仅呈现该页面。现在，如果我们导航到`/faq`，那么 faq.5678.js 文件将通过网络获取并加载，包括组件 FAQ 将被渲染。

因此，我们将看到的代码是根据我们定义的路由进行拆分的。这并没有 100%优化我们的应用程序，有一些缺点，但至少我们从我们的应用程序中减少了相当大的延迟时间。这个与代码分割相关的另一种优化技术被称为 prefetching，但这将在另一篇文章中。

# 🔪 基于组件（Component-based）的代码拆分

在 Web 应用程序中，有如下许多小部件：

- 模型（modals）
- tabs
- 折叠面板（accordion）
- 进度条（progressbars）
- 侧边菜单（sidenav）
- footer
- header
- 面板（panel）
- 等等

这些小部件或组件为我们的用户提供了丰富的体验。

```js
function ModalComponent() {
  return <modal>Modal shows!!!</modal>;
}
function Mycomponent() {
  this.display = false;
  return;
  <div>
    <ModalComponent display={this.dispaly} />
    <button onclick={(this.display = true)}>Open Modal</button>
    <button onclick={(this.display = false)}>Close Modal</button>
  </div>;
}
react - app / dist / -index.html - index.js;
```

尽管他们提供了很多好东西，但他们也会导致我们的应用程序性能不佳。大多数组件隐藏，指导用户完成相关操作时才会显现。在用户滚动到底部或按侧边按钮之前，你不会看到 footer 和 sidenev。大多数情况下，用户甚至可能不会与其中任意一个进行交互。

所有这些都加载到我们的应用程序中，并在加载时构成时间延迟。当用户试图与他们交互时，加载并展现他们不会更好么？

在这种情况下，基于组件的拆分有很大的帮助。所有的小部件或组件都将单独打包。每个捆绑包上一个小部件，Web 开发人员需要采用捆绑技术，但更重要的是按需加载这些部件。

```js
// modalcomponent.js
function ModalComponent() {
    return <modal>Modal shows!!!</modal>
}
// mycomponent.js
const ModalComponent = React.lazy(import('./modalcomponent.js'))
function MyComponent() {
    this.display = false;
    return
    <div>
        <Suspense fallback={<div>loading ...</div>}>
            <ModalComponent display={this.display} />
        </Suspense>
        <button onclick={this.display = true}>Open Modal</button>
        <button onclick={this.display = false}>Close Modal</button>
    </div>
}
// index.js
const MyComponent = React.lazy(()=>import('./mycomponent.js'))
import ErrorBoundary from './error.boundary.js'
function AppComponent() {
    return
    <div>
        <ErrorBoundary>
            <Suspense fallback={<div>loading ...</div>}>
                <MyComponent />
            </Suspense>
        <ErrorBoundary/>
    </div>
}
react-app/
 dist/
  - index.html
  - index.js
  - mycomponent.js
  - modalcomponent.js (contains the ModalComponent)
```

我们看到最初没有加载 ModalComponent，他在用户单击`Open Modal`按钮时，才会触发加载。

# 🔚 结论

在这篇文章中，我们看到了如何通过代码分割和延迟加载来改进 🚀React 应用程序的性能。首先我们介绍了动态 import()函数；然后，我们看到了还可以使用不同的技术方案，如 React 的新特性 💤`React.lazy()`和 🚦`Suspense`。

通过我们在这篇文章中学到的这些不同的优化技巧，我们可以生成高性能高质量的 React 应用。

如果你对此有任何问题，或者我有任何遗漏，请随时在下面发表评论或向我询问任何问题！👏 你也可以在[Twitter](https://twitter.con/@ngarchangel), [Facebook](https://facebook.com/philip.david.5011)和这里找到我。

蟹蟹 !!!💯

# 💞Credits

- [✅Reactjs Blog](https://gist.github.com/philipszdavido/reactjs.org/docs/code-splitting.html)

原文链接： [Improve React Performance using Lazy Loading💤 and Suspense](https://blog.bitsrc.io/improve-react-performance-using-lazy-loading-and-suspense-933903171954)

[转载链接](https://zakarycode.github.io/archives/front-end/frame/React/1546835543.html)
