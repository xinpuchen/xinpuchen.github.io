---
title: 为什么选择Hook而非……?
date: 2019-02-10 23:47:17
categories: React
tags:
  - React
  - Hooks
---

自从第一个关于[React Hooks](https://reactjs.org/hooks)的 alpha 版本发布以来，有一个问题不断出现在讨论中：“为什么是 Hook 而非 _<一些其他的 API>_ ？”

提示一下，以下的这些就*是*Hooks：

- [`useState()`](https://reactjs.org/docs/hooks-reference.html#usestate) 用于声明一个状态变量。
- [`useEffect()`](https://reactjs.org/docs/hooks-reference.html#useeffect) 用于声明一个补充规则(side effect)。
- [`useContext()`](https://reactjs.org/docs/hooks-reference.html#usecontext) 用于读取一些上下文的内容。

<!-- more -->

但是仍有一些其他的 API，例如`React.memo()`和`<Context.Provider>`，它们*不是*Hooks。通常提出的 Hook 版本会建议是*noncompositional*或者*antimodular*。本文将帮助你了解原因。

**提示：这篇文章对那些对 API 讨论感兴趣的人来说是一个深刻的话题，你不需要考虑使用 React 来提升效率！**

---

我们希望 React API 保留两个重要属性：

1. **构成 Composition:** [定制 Hooks](https://reactjs.org/docs/hooks-custom.html)很大程度上是我们对 Hooks API 感到兴奋的原因。我们希望大家可以频繁的构建自己的 Hooks，并且我们需要保证不同人写的 Hooks[不会发生冲突](https://overreacted.io/why-do-hooks-rely-on-call-order/#flaw-4-the-diamond-problem)。（我们大概会被编写清爽且不会相互破坏的组件这样的体验宠坏吧！）
2. **调试 Debugging:** 我们希望随着程序的增长，Bugs[很容易找到](/archives/algorithm/1549245751.html)。React 的最佳特征之一就是——如果你看到呈现出了任何错误，都能够通过结构树找到那个组件的 prop 或 state 导致的错误。

这两个约束放在一起可以告诉我们什么可以或*不可以*使用 Hook。让我们看几个例子。

---

## 使用 Hook：`useState()`

### 构成 Composition

每个调用`useState()`的多个自定义 Hook 都不会冲突：

```js
function useMyCustomHook1() {
  const [value, setValue] = useState(0);
  // What happens here, stays here.
}

function useMyCustomHook2() {
  const [value, setValue] = useState(0);
  // What happens here, stays here.
}

function MyComponent() {
  useMyCustomHook1();
  useMyCustomHook2();
  // ...
}
```

添加一个新的无条件`useState()`调用总是安全的。你不需要了解组件用于声明新状态变量的其他 Hook，也不能通过更新其中一个来破坏其他的状态变量。

**结论：** ✅ `useState()`不会使自定义 Hook 易碎。

### 调试 Debugging

钩子会很有用，因为你可以用过它*传递*值：

```js
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  // ...
  return width;
}

function useTheme(isMobile) {
  // ...
}

function Comment() {
  const width = useWindowWidth();
  const isMobile = width < MOBILE_VIEWPORT;
  const theme = useTheme(isMobile);
  return <section className={theme.comment}>{/* ... */}</section>;
}
```

但是如果我们犯错了呢？该如何调试？

假设我们从`theme.comment`获得的 CSS 类是错误的，我们该如何调试？我们可以在组件的主体中设置断点或几个日志输出。

也许我们会看到`theme`错误但是`width`和`isMobile`是正确的。这会告诉我们问题是`useTheme()`中的。或者也许我们会看到`width`本身就是错的，那我们就应该查看`useWindowWidth()`。

**单独查看中间值会告诉我们顶层的那些 Hook 包含 Bug。**我们不需要查看他们*所有的*实现。

然后我们可以“放大”有 Bug 的部分并尝试复现。

随着自定义 Hook 嵌套的深度增加，这会变得更加重要。想象我们有 3 个级别的自定义 Hook 嵌套，每个级别使用 3 个不同的自定义 Hooks。寻找**3 处**与潜在检查**3 + 3×3 + 3×3×3 = 39 处**之间的[差异](/archives/algorithm/1549245751.html)是巨大的。幸运的是，`useState()`不能神奇的“影响”其他钩子或组件，它返回的错误值会在它后面留下一条痕迹，就像任何变量一样。🐛

**结论：** ✅ `useState()`不会遮掩我们代码中的因果关系，我们可以直接通过痕迹追踪到 Bug。

---

## 不应使用 Hook：`useBailout()`

作为优化，使用 Hooks 的组件可以避免重新渲染。

一种方法是将整个组件周围方式一个[`React.memo()`](https://reactjs.org/blog/2018/10/23/react-v-16-6.html#reactmemo)包装器。如果 props 与我们在上一次渲染的过程中的 props 非常相等，他就会失去重新渲染的效果，这很类似`PureComponent`类。

`React.memo()`接受一个组件并返回一个组件：

```js
function Button(props) {
  // ...
}
export default React.memo(Button);
```

**但是为什么它不仅是个 Hook?**

无论你将它成为`useShouldComponentUpdate()`，`usePure()`，`useSkipRender()`或`useBailout()`，这个体验往往看起来是这样的：

```js
function Button({ color }) {
  // ⚠️ Not a real API
  useBailout(prevColor => prevColor !== color, color);

  return <button className={"button-" + color}>OK</button>;
}
```

还有一些变化（eg：一个简单的`usePure()`标记）但是在广泛的笔划中他们具有相同的缺陷。

### 构成 Composition

假设我们尝试将`useBailout()`放在两个自定义 Hooks 中：

```js
function useFriendStatus(friendID) {
  const [isOnline, setIsOnline] = useState(null);

  // ⚠️ Not a real API  useBailout(prevIsOnline => prevIsOnline !== isOnline, isOnline);
  useEffect(() => {
    const handleStatusChange = status => setIsOnline(status.isOnline);
    ChatAPI.subscribe(friendID, handleStatusChange);
    return () => ChatAPI.unsubscribe(friendID, handleStatusChange);
  });

  return isOnline;
}

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);

  // ⚠️ Not a real API  useBailout(prevWidth => prevWidth !== width, width);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  });

  return width;
}
```

现在如果你在同一个组件使用它们会发生什么？

```js
function ChatThread({ friendID, isTyping }) {
  const width = useWindowWidth();
  const isOnline = useFriendStatus(friendID);
  return (
    <ChatLayout width={width}>
      <FriendStatus isOnline={isOnline} />
      {isTyping && "Typing..."}
    </ChatLayout>
  );
}
```

什么时候重新渲染？

如果每个`useBailout()`调用都有权跳过更新，那么来自`useWindowWidth()`的更新将被`useFriendStatus()`阻塞，反之亦然。**这些 Hook 会相互破坏。**

但是，如果`useBailout()`尽在单个组件内的*所有*调用“同意”阻止更新时才能使用，那么我们的`ChatThread`将无法更新`isTyping`prop 的更改。

更糟糕的是，使用这些语义**任何新添加到 ChatThread 的 Hook 如果没有调用 useBailout()将会损坏**。否则，他们不能“反对”使用`useWindowWidth()`和 `useFriendStatus()`救助。

**结论：** 🔴 `useBailout()`打破了构建方式，将其添加到 Hook 会破坏其他 Hook 的状态更新。我们希望 API 可以具有[防碎性](https://overreacted.io/optimized-for-change/)，而这种行为却背道而驰。

### 调试 Debugging

像`useBailout()`这样的 Hook 如何影响调试？

我们将使用相同的示例：

```js
function ChatThread({ friendID, isTyping }) {
  const width = useWindowWidth();
  const isOnline = useFriendStatus(friendID);
  return (
    <ChatLayout width={width}>
      <FriendStatus isOnline={isOnline} />
      {isTyping && "Typing..."}
    </ChatLayout>
  );
}
```

当我们期望`Typing...`标签不会出现，即便在上层的 prop 正在发生变化。我们该怎么调试？

**通常，在 React 中你自信可以通过查找来给出确切的回答。**如果`ChatThread`没能得到一个新的`isTyping`值，我们可以打开呈现`<ChatThread isTyping={myVar} />`的组件并检查`myVar`，以此类推。在其中一个级别，我们要么找到一个错误的`shouldComponentUpdate()`救助，要么传递不正确的`isTyping`值。一看链中的每个组件通常足以追寻到问题的根源。

但是如果这个`useBailout()`Hook 是真的，你永远也不会知道更新被跳过的原因，知道你检查我们的`ChatThread`及其所有者链中的组件使用的*每个自定义 Hook*（的深度）。由于每个父组件也可以使用自定义 Hook，因此[拓展](/archives/algorithm/1549245751.html)非常糟糕。

就像你在抽屉里寻找一把螺丝刀一样，每个抽绎都有一堆较小的抽屉柜，你不知道兔子洞有多深。

**结论：** 🔴 `useBailout()`Hook 不仅打破了构建，更大大增加了调试步骤和求助所需的认知门槛——在某些情况下，呈指数式增加。

---

我们只看到了一个真正的 Hook，`useState()`，还有一个关于*不该使用*Hook 的常规建议——`useBailout()`。我们通过构建和调试的棱镜对他们进行了比较，讨论了它们中工作与否的原因。

虽然没有`memo()`和`shouldComponentUpdate()`的“Hook 版本”，但 React*会*提供一个 Hook 调用[`useMemo()`](https://reactjs.org/docs/hooks-reference.html#usememo)的方法。它有类似的用途，但它语义不同，并不会遭遇上述陷阱。

`useBailout()`只是一个不该使用 Hook 工作的例子，还有很多类似的——例如：`useProvider()`，`useCatch()`或`useSuspense()`。

你明白为什么吗？

_（小声：组成...调试...）_

[Discuss on Twitter](https://mobile.twitter.com/search?q=https%3A%2F%2Foverreacted.io%2Fwhy-isnt-x-a-hook%2F) • [Edit on GitHub](https://github.com/gaearon/overreacted.io/edit/master/src/pages/why-isnt-x-a-hook/index.md)

原文链接： [Why Isn't X a Hook?](https://overreacted.io/why-isnt-x-a-hook/)
