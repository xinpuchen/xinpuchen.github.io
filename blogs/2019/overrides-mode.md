---
title: 覆盖模式-提高 React 组件的复用率
date: 2019-02-24 14:44:53
categories:
  - React
tags:
  - Web
  - JavaScript
  - React
  - Component
  - CSS-In-JS
---

# 引言

如果你在过去几年中一直在关注 React 生态系统，那么在众多用于开发人员在构建应用程序时可以使用的[开源可重用组件库](https://hackernoon.com/23-best-react-ui-component-libraries-and-frameworks-250a81b2ac42)中，你至少曾尝试或听说过一个。这些库使我们不必再为每个应用程序反复构建相同的模态，菜单和表单控件。

<!-- more -->

那些曾经使用过其中一个库的人可能也遇到过一个组件不太适合你需要的场景，也许是组件的设计和你需要的不要一样，并且那些组件没有暴露出可以配置样式的 API；又或许是你只是想要一个样式自定义的复选框。

这在我们优步是一个很常见的情绪了，由于团队经常被迫开始构建一个新的组件，这导致了很多无谓的浪费。因此，当我们最近着手改造我们心爱（但老旧）的组件库的时候，我们调查了数十位工程师，以便更好地了解他们在复用现有的组件时遇到的障碍。有几点很明确：

- **Styles:** 开发者需要能够配置组件及其内部组件的样式。这对于 global CSS 或许很容易，但是在 CSS-in-JS 的世界中，每个元素都可以有任意类封装在组件之中，想要实现就变得十分的困难了。
- **Props:** 有时候你只是需要改变传递给内部组件的 props。例如给元素添加一个`aria-label`属性，或者是在集成测试中将`className`传递给指定的目标。
- **Render:** 在很多情况下，人们只是希望能够完全覆盖某些内部的渲染或行为——例如，想添加到日期选择器添加一个快捷选择的选项（如：“过去 30 天”）。

我们当然不是第一个试图去解决这些问题的人。在 React 社区中推广的[render props](https://reactjs.org/docs/render-props.html)模式是一种允许更多方法控制一个组件渲染方式的策略。Paypal 的[downshift](https://github.com/paypal/downshift) 也是一个很好的例子，这使你可以明确如果使用 render props 可以达成的效果。

但是 render props 对于许多情况来说都是一个很好的工具，如果你只是想覆盖一个样式或者改变一些内部元素的 props，这样做可能就有点沉重了。类似的，组件作者有时候会提供像是*getFooStyle*或*getFooProps*这样的 props 来定制一些内部元素，但是这些很少以一致的方式提供给所有的内部组件。

我们希望在我们的组件中提供一个统一的 API，它提供了渲染所有的灵活方式，但同时有可以有捷径，适用于只需要覆盖一些内部样式或 props 非常频繁的场景。

我们提出的解决方案称之为“Overrides”模式（覆盖模式）。它仍在不断发展，但到目前为止，我们对开发人员使用它的方法感到印象深刻。我们希望与更广泛的社区分享，希望它能激发其他组件库作者的兴趣，或者至少提高对组件复用性当前缺陷的认识。下面将展示它是如何实现的。

# 覆盖公共的 API

下面的代码片段演示了覆盖模式在可复用 Autocomplete 组件的具体实现：

```jsx
// App.js
render() {
  <Autocomplete
    options={this.props.products}
    overrides={{
      Root: {
        props: {'aria-label': 'Select an option'},
        style: ({$isOpen}) => ({borderColor: $isOpen ? 'blue' : 'grey'}),
      },
      Option: {
        component: CustomOption
      }
    }}
  />
}

// CustomOption.js
export default function CustomOption({onClick, $option}) {
  return (
    <div onClick={onClick}>
      <h4>{$option.name}</h4>
      <small>{$option.price}</small>
    </div>
  );
}

// https://gist.github.com/schnerd/045ee729696f0352bb106b186eb50855#file-overrides-example-public-js
```

这里有很多内容，让我们来看看一些关键的变化：

- 每一个内部元素都有一个开发者可以定位的标识符。这里我们使用的是*Root*和*Option*。你几乎可以将这些视为类名（但没有 CSS 级联和全局命名空间的缺点）
- 对于每个内部元素，你都可以覆盖**props**，**style**，和**component**.
- 覆盖 props 非常直接，你指定的对象将使用默认道具传递，并优先于它们。在这种情况下，你可以看到我们正在使用它在 Root 元素上来添加`aria-label`。
- 当覆盖**style**时，你可以传递一个样式对象或者接受与组件当前内部状态相关的一些道具的函数，允许你更具组件状态动态地更改样式，如`isError`或`isSelected`。函数返回的样式对象与默认元素样式深度合并。
- 当覆盖**component**时，可以传入无状态功能组件或 React 组件类，你可以在其中以供自己的渲染逻辑，也可以选择添加其他处理程序或行为。这实际上是依赖注入，并解锁了更多可能性。

通过一个统一的`overrides`支柱提供所有这些功能，为开发人员提供了一个一致的方法定制所需内容。

# 覆盖组件行为

为了让你了解我们团队如何使用此功能，以下是优步货运团队的一个示例：

他们想要使用同一个 API、键盘控制和事件为一个 radio 组来创建表单元素，但是有不同的视觉外观。他们能够在我们现有的`RadioGroup`组件添加一系列样式覆盖，而不必浪费地构建，测试和维护他们自己的自定义实现。

我们在对此模式进行原型设计时使用的另一个示例是向多选组件中的标记添加编辑行为。在这种情况下，我们创建了一个组件覆盖`Tag`，为其渲染了现有的内容，同是注入了一个编辑标签。

这说明了与 render props 相比允许注入完整组件的一个好处——你可以创建新的状态，生命周期方法，如果你需要的话甚至可以使用 React Hooks。我们的`EditableTag`组件在单击时能够显示模态，然后触发必要的 redux 操作以更新标记的名称。

# 覆盖内部实施（组件）

以下是我们 Autocomplete 组件内部可以实现的覆盖方法：

```jsx
// Autocomplete.js
import React from 'react';
import * as defaultComponents from './styled-elements';

class Autocomplete extends React.Component {

  // Setup & handlers omitted to keep this example short

  getSharedStyleProps() {
    const {isOpen, isError} = this.state;
    return {
      $isOpen: isOpen
      $isError: isError
    };
  }

  render() {
    const {isOpen, query, value} = this.state;
    const {options, overrides} = this.props;

    const {
      Root: {component: Root, props: rootProps},
      Input: {component: Input, props: inputProps},
      List: {component: List, props: listProps},
      Option: {component: Option, props: optionProps},
    } = getComponents(defaultComponents, overrides);

    const sharedProps = this.getSharedStyleProps();

    return (
      <Root {...sharedProps} {...rootProps}>
        <Input
          type="text"
          value={query}
          onChange={this.onInputChange}
          {...sharedProps}
          {...inputProps}
        />
        {isOpen && (
          <List {...sharedProps} {...listProps}>
            {options.map(option => {
              <Option
                onClick={this.onOptionClick.bind(this, option)}
                $option={option}
                {...sharedProps}
                {...optionProps}
              >
                {option.label}
              </Option>
            })}
          </List>
        )}
      </Root>
    );
  }
}

// https://gist.github.com/schnerd/30c1415b7621d0e71352aa0c0184f175#file-overrides-example-internal-js
```

请注意，render 方法不包含像`<div>`这样的原生 DOM。我们从相邻的文件中导入默认的子组件。在这个文件中我们使用 CSS-in-JS 库来创建封装所有默认样式的组件。如果组件传递了`overrides`，则它优先于这些默认值。

`getComponents`只是一个很简单的辅助函数，我们使用它来解压需要覆盖的参数并将它们与组件的默认样式合并到一处。很多方法可以实现这，下面是个简短的示例：

```jsx
function getComponents(defaultComponents, overrides) {
  return Object.keys(defaultComponents).reduce((acc, name) => {
    const override = overrides[name] || {};
    acc[name] = {
      component: override.component || defaultComponents[name],
      props: { $style: override.style, ...override.props }
    };
    return acc;
  }, {});
}

// https://gist.github.com/schnerd/c6753b941954f96ec16fea2ce47e74d8#file-overrides-example-getcomponents-js
```

这个函数指定了 style 覆盖到为名为`$style`的 prop，并将其与其他的覆盖 prop 合并到一起——这主要是因为我们使用 CSS-in-JS 实现了查找`$style`并将其与默认样式深度合并。

每个子组件也接受`sharedProps`，它可以用于动态更改样式或渲染——例如，在出现错误时将 border-color 设置为 red。我们将这些 props 添加`$`前缀作为一个命名规则的约定，以表明这些是特殊的 props，不应该传递给底层的 DOM 元素。

# 权衡 & 陷阱

与大多数设计模式一样，在使用覆盖模式的时候也需要全更一些因素。

## 刚性

因为每个内部元素都有一个标识符并作为覆盖的目标公开，所以更改 DOM 结构可能会导致超出预期的变化出现频次高于正常情况。对于 CSS 的变化来说也会有同样的问题——改变元素样式从`display: flex`到`display: block`理论上同样是个重大的改变，如果使用者觉得这是一个 flexbox 的内部并这样覆盖其中一个子元素的样式。通常都整齐封装的组件实际上可能会使下游受到影响从而出现问题。

所以的这些都意味着你可能需要更加小心地改变组件的 DOM 结构或者样式，并且不要害怕当一个主要版本的修改受到质疑的时候。

## 文档

现在你的内部元素是公共 API 的一部分，你可能会希望编写一个文档去描述每个元素以及它可以传入的 porps。包括使用一些简单的图表来描述它的 DOM 结构，以及它们的标识。

使用 TypeScripts 或 Flow 这类可以静态类型检查的方法在这里会是一个很棒的方案，因为它将使开发人员清楚地知道每个组件可以接受哪些 props，以及你覆盖的方式是否兼容。

## 组成

想象一下，你正在使用`Button`组件来构建一个可复用的`Pagination`组件来完成分页功能，我们如何将`Pagination`组件内的`Button`组件覆盖方法暴露出来呢？如果有多个按钮（例如：首页、上一页、下一页、尾页等），使用者可能想要以不同的方式去设置该怎么办？我们对于如何处理这一类问题有些[想法](https://github.com/uber-web/baseui/issues/375)，但是这并不能解决根本，在最终方案出现之前还需要反复地去实验。

## 复杂性

支持组件的复用会提升其复杂性，并且破事你更加批判性的考虑使用者如何覆盖你的内部组件。如果你只是构建一个将在自己的应用程序中重复使用几次的组件，那么这种复杂性的增加可能并不值得。但是如果你正在构建一个可供数百名工程师使用的可复用的组件库，那么为了这些使用者的便利而牺牲简洁的写法就非常有意义了。对于我们来说这是一个简单的决定，因为那工程师使用组件时那些有趣的用法一直令我们印象深刻。

# 展望

现在来说，覆盖模式只是一种模式，并没有刻意安装的库或者包，但是如果你想看看我们在自己的组件库中如何使用这个模式，你可以在[github](https://github.com/uber-web/baseui)上浏览我们的项目。

希望你发现这个模式刻意很有用，或者至少有一些关于如何提高你的 React 组件复用率的新想法！

—

_有疑问或想法吗？你可以发表评论或者在推特上找到我哦：@dschnr_

原文链接: https://medium.com/@dschnr/better-reusable-react-components-with-the-overrides-pattern-9eca2339f646
