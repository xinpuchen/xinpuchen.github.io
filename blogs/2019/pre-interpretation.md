---
title: JavaScript 预解释是一种毫无节操的机制
date: 2019-01-14 11:15:17
categories: JavaScript
tags:
  - JavaScript
---

![](/images/pre-interpretation-1.png)

## 什么是预解释

js 代码执行之前，浏览器首先会默认的把所有带 var 和 function 的进行提前的声明或者定义

<!-- more -->

### 理解声明和定义

声明(declare):如 var num;=>告诉浏览器在全局作用域中有一个 num 的变量了；如果一个变量只是声明了但是没有赋值，默认的值是 undefined

定义(defined):如 num=12;=>给我们的变量进行赋值。

### 对于带 var 和 function 关键字的在预解释的时候操作不一样的

var =>在预解释的时候只是提前的声明

function =>在预解释的时候提前的声明+定义都完成了

### 预解释只发生在当前的作用域下。

例如：开始只对 window 下的进行预解释，只有函数执行的时候才会对函数中的进行预解释

## 作用域链与闭包

### 如何区分私有变量和全局变量？

- **在全局作用域下声明（预解释的时候）的变量是全局变量**
- **只有函数执行会产生私有的作用域,比如 for(){}、if(){}和 switch(){}都不会产生私有作用域**
- **在"私有作用域中声明的变量(var 声明)"和"函数的形参"都是私有的变量**。在私有作用域中，代码执行的时保遇到了一个变量，首先我们需要确定它是否为私有的变量，如果是私有的变量，那么和外面的没有在何的关系；如果不是私有的，则往当前作用域的上级作用域进行查找，如果上级作用域也没有则继续查找，一直找到 window 为止，这就是作用域链。

我们举个例子来区别私有变量和全局变量：

```js
//=>变量提升：var a；var b；var c；test=AAAFFF111；
var a=10,b=11,c=12;
function test(a){
  //=>私有作用域：a=10 var b；
  a=1;//=>私有变量a=1
  var b=2；//=>私有变量b=2
  c=3;//=>全局变量c=3
}
test(10）；
console.log(a);//10
console.log(b)://11
console.log(c);//3
```

**判断是否是私有变量一个标准就是是否是在函数中 var 声明的变量和函数的形参都是私有的变量**。本道题目在 test 函数中 a 是形参和 var b 定义的变量 b 都是私有变量。

### 闭包

**闭包是一种机制，函数执行时形成一个新的私有的作用域保护了里面的私有变量不受外界的干扰（外面修改不了私有的，私有的也修改不了外面的）**

- 这是因为当函数执行的时候,首先会形成一个新的私有的作用域，然后按照如下的步骤执行：如果有形参，先给形参赋值
- 进行私有作用域中的预解释
- 私有作用域中的代码从上到下执行

我们来看一道例题

```js
var total=0;
function fn(num1,num2){
  console.log(total);//->undefined 外面修改不了私有的
  var total=num1 +num2；
  console.log(total);//->300
}
fn(100,200);
console.log(total);//->0 私有的也修改不了外面的
```

### JS 中内存的分类

栈内存：用来提供一个供 JS 代码执行的环境，即作用域（全局作用域/私有的作用域）
堆内存：用来存储引用数据类型的值。对象存储的是属性名和属性值，函数存储的是代码字符串。

## var num=12 与 num=12 有啥区别？

我们先来看以下两个例子：

```js
//例题1
console.log(num); //->undefined
var num = 12;
//例题2
console.log(num2); //->Uncaught ReferenceError:num2 is not defined
num2 = 12; //不能预解释
```

当你看到 var num=12 时，可能会认为这是个声明。但**JavaScript 实际上会将其看成两个声明：var num;和 num=12;第一个定义声明是在预解释阶段进行的。第二个赋值声明会被留在原地等待执行阶段。**

**最大区别：带 var 的可以进行预解释，所以在赋值的前面执行不会报错；不带 var 的是不能进行预解释的，在前面执行会报错；**

除此之外，num2=12; 相当于给 window 增加了一个叫做 num2 的属性名，属性值是 12,而 var num=12; 首先它相当于给全局作用域增加了一个全局变量 num，它也相当于给 window 增加了一个属性名 num，属性值是 12。

接下来我们举例说明：

```js
//例题1
var total=0;
function fn(){
  console.log(total);//undefined
  var total=100;
}
fn();
console.log(total);//0
//例题2
var total=0;
function fn(){
  console.log(total);//0
  total=100；
}
fn();
console.log(total);//100
```

例题 1 中带 var 变量在私有作用域中可以预解释，所以第一个 console 打出来的值为 undefined。**私有作用域中出现的一个变量不是私有的，则往上级作用域进行查找，上级没有则继续向上查找，一直找到 window 为止**，例题 2 中不带 var 变量不是私有的，所以往上级找

## 预解释五大毫无节操的表现

**1、预解释的时候不管你的条件是否成立，都要把带 var 的进行提前的声明。**

请看下面这道例题：

```js
if（!("num" in  window)){
  var num=12；//这句话会被提到大括号之外的全局作用域：var num;->window.num；
}
console.log(num);//undefined
```

**2、预解释的时候只预解释”=”左边的，右边的值，不参与预解释**

请看下面这道例题：

```js
fn(); //报错
var fn = function() {
  //window下的预解释：var fn；
  console.log("ok");
};
```

**3、自执行函数：定义和执行一起完成了。**

自执行函数定义的那个 function 在全局作用域下不进行预解释，当代码执行到这个位置的时候定义和执行一起完成了。常见有以下几种形式：

```js
(function(num){})(10);
~function(num){}(10);
+function(num){}(10);
-function(num){}(10);
！function(num){}(10);
```

**4、函数体中 return 下面的代码虽然不再执行了，但是需要进行预解释；return 后面跟着的都是我们返回的值，所以不进行预解释；**

```js
function fn(){
  //预解释：var num；
  console.log(num）;//->undefined
  return function(){
}
var num=100;
```

**5、函数声明和变量声明都会被提升。但是一个值得注意的细节（这个细节可以出现在有多个“重复”声明的代码中）是函数会首先被提升，然后才是变量。在预解释的时候，如果名字已经声明过了，不需要从新的声明，但是需要重新的赋值；**

我们先来看下两个简单的例子：

```js
//例题1
function a() {}
var a;
console.log(typeof a); //'function'
//例题2
var c = 1;
function c(c) {
  console.log(c);
  var c = 3;
}
c(2); //Uncaught TypeError: c is not a function
```

当遇到存在函数声明和变量声明都会被提升的情况，函数声明优先级比较高，最后变量声明会被函数声明所覆盖，但是可以重新赋值,所以上个例子可以等价为

```js
function c(c) {
  console.log(c);
  var c = 3;
}
c = 1;
c(2);
```

接下来我们看下两道比较复杂的题目:

```js
//例题3
fn();
function fn() {
  console.log(1);
}
fn();
var fn = 10;
fn();
function fn() {
  console.log(2);
}
fn();
```

> - 一开始预解释，函数声明和赋值一起来，fn 就是 function fn(){console.log(1);}；遇到 var fn=10;不会重新再声明，但是遇到 function fn(){console.log(2);}就会从重新赋值，所以一开始 fn()的值就是 2

- 再执行 fn();值不变还是 2
- fn 重新赋值为 10，所以运行 fn()时报错，接下去的语句就没再执行。

```js
//例题4
alert(a);
a();
var a = 3;
function a() {
  alert(10);
}
alert(a);
a = 6;
a();
```

> - 函数声明优先于变量声明，预解释时候，函数声明和赋值一起来，a 就是 function a(){alert(10)} ，后面遇到 var a=3，也无需再重复声明，所以先弹出 function a(){alert(10)}

- a()，执行函数，然后弹出 10
- 接着执行了 var a=3; 所以 alert(a)就是显示 3
- 由于 a 不是一个函数了，所以往下在执行到 a()的时候， 报错。

[原文链接](https://github.com/ljianshu/Blog/issues/3)
