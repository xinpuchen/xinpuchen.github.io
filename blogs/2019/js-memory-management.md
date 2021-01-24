---
title: JavaScript 内存管理
date: 2019-03-17 16:27:06
categories:
  - 浏览器
  - JavaScript
tags:
  - 浏览器
  - JavaScript
  - 内存
---

## 什么是内存泄漏？

![](/images/js-memory-management-5.png)

当我们决定不再使用某些内存时，由于错误的编码，未能使得 GC(Garbage Collection)正确的将这些内存回收的情况，就是内存泄漏。

<!-- more -->

## 内存的占用

一个对象占用的内存分为直接占用内存(Shallow Size)和占用总内存(Retained Size)，赋值和 New 操作都会涉及到内存的占用。

- 直接占用内存：对象本身占用的内存。典型的 JavaScript 对象都会有保留内存用来描述这个对象和存储它的直接值。一般，只有数组和字符串会有明显的直接占用内存(Shallow Size)。但字符串和数组常常会在渲染器内存中存储主要数据部分，仅仅在 JavaScript 对象栈中暴露一个很小的包装对象。
- 占用总内存：直接占用内存和这个引用的依赖对象所占用的内存。

## 内存的分配

Chrome V8 的垃圾回收（GC）算法基于 Generational Collection，内存被划分为两种，分别称为 Young Generation（YG）和 Old Generation（OG）。

> 所谓 Young 和 Old 是根据他们占用的时间来划分的。内存在 YG 的分配和回收快而频繁，一般存在的时间很短，所以称为 Young；而在 OG 中则慢而少发生，所以称为 Old。

因为在 V8 中，YG 的 GC 过程会阻塞程序，而 OG 的 GC 不会阻塞。所以通常情况下开发者更关心 YG 的细节。

YG 又被平分为两部分空间，分别称为 From 和 To。所有内存从 To 空间被分配出去，当 To 满时，开始触发 GC，接下来细看一下。

某时刻，To 已经分 A、B 和 C 分配了内存，当前它剩下一小块内存未分配出去，而 From 所有的内存都空闲着。

![](/images/js-memory-management-1.png)

此时，一个程序需要为 D 分配内存，但 D 需要的内存大小超出了 To 未分配的内存，如下图。此时，触发 GC，页面停止执行。

![](/images/js-memory-management-2.png)

接着 From 和 To 进行对换，即原来的 To 空间被标志为 From，From 被标志为 To。并且把活的变量值（例如 B）标志出来，而”垃圾“（例如 AC）未被标志，它们将会被清掉。

![](/images/js-memory-management-3.png)

活的 B 会被复制到 To 空间，而「垃圾」AC 则被回收，同时，D 被分配到 To 空间，最后成下图的分布

![](/images/js-memory-management-4.png)

至此，整个 GC 完成，此过程中页面停止执行，所以要尽可能的快。当 YG 中的值存活比较久时，它会被推向 OG，OG 的空间满时，触发 OG 内的 GC，OG 的 GC 时会触发 YG 的 GC。

- 每次分配都使 To 的可用空间减小，程序又更接近 GC
- YG 的 GC 会阻塞程序，所以 GC 时间不宜太长 10ms 以内，因为 16ms 就会出现丢帧；GC 不宜太频繁
- 某个值变成垃圾后，不会立马释放内存，只有在 GC 的时候所占内存才会被回收。

## 内存的回收

GC Root 是内存的根结节，在浏览器中它是 window，在 NodeJS 中则是 global 对象。

![](/images/js-memory-management-5.png)

从 GC Root 开始遍历图，所有能到达的节点称为活节点，如果存在 GC Root 不能到达的节点，那么该节点称为“垃圾”，将会被回收，如图中灰色的节点。

至于根节点的回收，不受用户的控制。

## 导致内存泄漏的原因

### 没有完全切断与 GC root 之间的路径

因为没有完全切断与根节点之间的路径，导致自动 GC 不会回收这部分内存，从而造成内存泄漏。

- 对象之间的相互引用
  ```js
  var a, b;
  a.reference = b;
  b.reference = a;
  ```
- 错误使用了全局变量
  ```js
  a = "1234567";
  相当于;
  window.a = "1234567";
  ```
- DOM 元素清空或删除时，绑定的事件未清除
  ```html
  <div id="myDiv">
    <input type="button" value="Click me" id="myBtn" />
  </div>
  <script type="text/javascript">
    var btn = document.getElementById("myBtn");
    btn.onclick = function() {
      document.getElementById("myDiv").innerHTML = "Processing...";
      /* 清除事件绑定 */
      // btn.onclick = null;
    };
  </script>
  ```
- 闭包引用

  ```js
  function bindEvent() {
    var obj = document.getElementById("xxx");

    obj.onclick = function() {
      /** 空函数*/
    };

    /** delete this reference */
    // obj = null;
  }
  ```

- DOM 元素清空或删除时，子元素存在 JS 引用，导致子元素的所有父元素都不会被删除
  ```js
  // b是a的子dom节点, a是body的子节点
  var aElement = document.getElementById("a");
  var bElement = document.getElementById("b");
  document.body.removeChild(aElement);
  // aElement = null；
  // bElement = null;
  ```

### 过度占用了内存空间

更多的出现在 nodejs 中，例如：

- 无节制的循环
  ```js
  while (1) {
    // do sth
  }
  ```
- 过大的数组
  ```js
  var arr = [];
  for (var i = 0; i < 100000000000; i++) {
    var a = {
      desc: "an object"
    };
    arr.push(a);
  }
  ```

## 参考文献

[《Chrome 开发者工具之 JavaScript 内存分析》](http://www.codeceo.com/article/chrome-javascript-memory.html)
