---
title: 如何使用 React Hooks 获取数据？
date: 2019-04-18 01:10:03
categories: React
tags:
  - React
---

在本教程中，我想向您展示如何使用 [状态](https://reactjs.org/docs/hooks-state.html)和[效果](https://reactjs.org/docs/hooks-effect.html)挂钩在 React with Hooks 中获取数据。我们将使用广为人知的[黑客新闻 API](https://hn.algolia.com/api)来获取科技界的热门文章。您还将实现数据提取的自定义挂钩，可以在应用程序的任何位置重用，也可以作为独立节点包在 npm 上发布。

<!-- more -->

如果您对这个新的 React 功能一无所知，请查看[React Hooks](https://www.robinwieruch.de/react-hooks/)的这个[介绍](https://www.robinwieruch.de/react-hooks/)。如果您想要查看完成的项目以获取展示如何在 React with Hooks 中获取数据的展示示例，请检查此[GitHub 存储库](https://github.com/the-road-to-learn-react/react-hooks-introduction)。

**注意：**将来，React Hooks 不适用于 React 中的数据提取。相反，一个名为 Suspense 的功能将负责它。以下演练是了解 React 中有关状态和效果挂钩的更多信息的好方法。

## 使用 React Hooks 获取数据

如果您不熟悉 React 中的数据提取，请查看我在[React 文章中提取的大量数据](https://www.robinwieruch.de/react-fetching-data/)。它将引导您完成使用 React 类组件的数据获取，如何使用[Render Prop 组件](https://www.robinwieruch.de/react-render-props-pattern/)和[高阶组件重新获取](https://www.robinwieruch.de/gentle-introduction-higher-order-components/)它，以及它如何处理错误处理和加载微调器。在本文中，我想在功能组件中使用 React Hooks 向您展示所有内容。

```jsx
import React, { useState } from "react";

function App() {
  const [data, setData] = useState({ hits: [] });

  return (
    <ul>
      {data.hits.map(item => (
        <li key={item.objectID}>
          <a href={item.url}>{item.title}</a>
        </li>
      ))}
    </ul>
  );
}

export default App;
```

App 组件显示了一个项目列表（hits = Hacker News 文章）。状态和状态更新函数来自状态钩子`useState`，它被称为负责管理我们要为 App 组件获取的数据的本地状态。初始状态是表示数据的对象中的空命中列表。目前还没有人为这些数据设置任何状态。

我们将使用[axios](https://github.com/axios/axios)来获取数据，但是您可以使用另一个数据获取库或浏览器的本机提取 API。如果尚未安装 axios，可以在命令行中执行此操作`npm install axios`。然后为数据获取实现效果钩子：

```jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [data, setData] = useState({ hits: [] });

  useEffect(async () => {
    const result = await axios(
      "http://hn.algolia.com/api/v1/search?query=redux"
    );

    setData(result.data);
  });

  return (
    <ul>
      {data.hits.map(item => (
        <li key={item.objectID}>
          <a href={item.url}>{item.title}</a>
        </li>
      ))}
    </ul>
  );
}

export default App;
```

名为 useEffect 的效果挂钩用于从 API 获取带有 axios 的数据，并使用状态挂钩的更新功能将数据设置为组件的本地状态。承诺解决发生在 async / await 中。

但是，当您运行应用程序时，您应该偶然发现一个讨厌的循环。效果挂钩在组件安装时运行，但也在组件更新时运行。因为我们在每次数据提取后设置状态，所以组件会更新并且效果会再次运行。它一次又一次地获取数据。这是一个错误，需要避免。**我们只想在组件安装时获取数据**。这就是为什么你可以提供一个空数组作为效果钩子的第二个参数，以避免在组件更新时激活它，但仅用于组件的安装。

```jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [data, setData] = useState({ hits: [] });

  useEffect(async () => {
    const result = await axios(
      "http://hn.algolia.com/api/v1/search?query=redux"
    );

    setData(result.data);
  }, []);

  return (
    <ul>
      {data.hits.map(item => (
        <li key={item.objectID}>
          <a href={item.url}>{item.title}</a>
        </li>
      ))}
    </ul>
  );
}

export default App;
```

第二个参数可用于定义钩子所依赖的所有变量（在此数组中分配）。如果其中一个变量发生变化，则钩子再次运行。如果包含变量的数组为空，则在更新组件时挂钩不会运行，因为它不必监视任何变量。

还有最后一个问题。在代码中，我们使用 async / await 从第三方 API 获取数据。根据文档，每个使用 async 注释的函数都会返回一个隐式的 promise：“async 函数声明定义了一个异步函数，它返回一个 AsyncFunction 对象。异步函数是一个通过事件循环异步操作的函数，使用隐式 Promise 返回其结果。“。但是，效果挂钩应该不返回任何内容或清除功能。这就是为什么你可能会在开发者控制台日志中看到以下警告：**07：41：22.910 index.js：1452 警告：useEffect 函数必须返回一个清理函数或什么也不返回。不支持 Promises 和 useEffect（async（）=> ...），但可以在效果中调用异步函数**。。这就是为什么`useEffect`不允许在函数中直接使用 async 的原因。让我们通过在效果中使用 async 函数来实现它的解决方法。

```jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [data, setData] = useState({ hits: [] });

  useEffect(() => {
    const fetchData = async () => {
      const result = await axios(
        "http://hn.algolia.com/api/v1/search?query=redux"
      );

      setData(result.data);
    };

    fetchData();
  }, []);

  return (
    <ul>
      {data.hits.map(item => (
        <li key={item.objectID}>
          <a href={item.url}>{item.title}</a>
        </li>
      ))}
    </ul>
  );
}

export default App;
```

简而言之，就是使用 React 钩子获取数据。但是如果您对错误处理，加载指示符，如何触发从表单中获取数据以及如何实现可重用数据获取挂钩感兴趣，请继续阅读。

## 如何以编程方式/手动触发挂钩？

太好了，我们在组件安装后获取数据。但是如何使用输入字段告诉 API 我们感兴趣的主题？“Redux”被视为默认查询。但是关于“React”的话题呢？让我们实现一个输入元素，使某人能够获取除“Redux”故事之外的其他故事。因此，为 input 元素引入一个新状态。

```jsx
import React, { Fragment, useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [data, setData] = useState({ hits: [] });
  const [query, setQuery] = useState("redux");

  useEffect(() => {
    const fetchData = async () => {
      const result = await axios(
        "http://hn.algolia.com/api/v1/search?query=redux"
      );

      setData(result.data);
    };

    fetchData();
  }, []);

  return (
    <Fragment>
      <input
        type="text"
        value={query}
        onChange={event => setQuery(event.target.value)}
      />
      <ul>
        {data.hits.map(item => (
          <li key={item.objectID}>
            <a href={item.url}>{item.title}</a>
          </li>
        ))}
      </ul>
    </Fragment>
  );
}

export default App;
```

目前，两个状态彼此独立，但现在您希望将它们耦合到仅获取输入字段中查询指定的文章。通过以下更改，组件应在挂载后按查询字词获取所有文章。

```jsx
function App() {
  const [data, setData] = useState({ hits: [] });
  const [query, setQuery] = useState('redux');

  useEffect(() => {
    const fetchData = async () => {
      const result = await axios(
        `http://hn.algolia.com/api/v1/search?query=${query}`,
      );

      setData(result.data);
    };

    fetchData();
  }, []);

  return (
    ...
  );
}

export default App;
```

缺少一件：当您尝试在输入字段中键入内容时，在从效果触发安装后没有其他数据获取。那是因为你提供了空数组作为效果的第二个参数。效果取决于无变量，因此仅在组件安装时触发。但是，现在效果应该取决于查询。查询更改后，数据请求将再次触发。

```jsx
function App() {
  const [data, setData] = useState({ hits: [] });
  const [query, setQuery] = useState('redux');

  useEffect(() => {
    const fetchData = async () => {
      const result = await axios(
        `http://hn.algolia.com/api/v1/search?query=${query}`,
      );

      setData(result.data);
    };

    fetchData();
  }, [query]);

  return (
    ...
  );
}

export default App;
```

一旦更改输入字段中的值，就可以重新获取数据。但这会带来另一个问题：在输入字段中键入的每个字符上，都会触发效果并执行另一个数据提取请求。如何提供一个按钮来触发请求，从而手动挂钩？

```jsx
function App() {
  const [data, setData] = useState({ hits: [] });
  const [query, setQuery] = useState("redux");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const result = await axios(
        `http://hn.algolia.com/api/v1/search?query=${query}`
      );

      setData(result.data);
    };

    fetchData();
  }, [query]);

  return (
    <Fragment>
      <input
        type="text"
        value={query}
        onChange={event => setQuery(event.target.value)}
      />
      <button type="button" onClick={() => setSearch(query)}>
        Search
      </button>

      <ul>
        {data.hits.map(item => (
          <li key={item.objectID}>
            <a href={item.url}>{item.title}</a>
          </li>
        ))}
      </ul>
    </Fragment>
  );
}
```

现在，使效果取决于搜索状态，而不是随输入字段中的每个键击更改的波动查询状态。用户单击该按钮后，将设置新的搜索状态，并应手动触发效果挂钩。

```jsx
function App() {
  const [data, setData] = useState({ hits: [] });
  const [query, setQuery] = useState('redux');
  const [search, setSearch] = useState('redux');

  useEffect(() => {
    const fetchData = async () => {
      const result = await axios(
        `http://hn.algolia.com/api/v1/search?query=${search}`,
      );

      setData(result.data);
    };

    fetchData();
  }, [search]);

  return (
    ...
  );
}

export default App;
```

此外，搜索状态的初始状态设置为与查询状态相同的状态，因为组件也在 mount 上获取数据，因此结果应该镜像输入字段中的值。但是，具有类似的查询和搜索状态有点令人困惑。为什么不将实际的 URL 设置为状态而不是搜索状态？

```jsx
function App() {
  const [data, setData] = useState({ hits: [] });
  const [query, setQuery] = useState("redux");
  const [url, setUrl] = useState(
    "http://hn.algolia.com/api/v1/search?query=redux"
  );

  useEffect(() => {
    const fetchData = async () => {
      const result = await axios(url);

      setData(result.data);
    };

    fetchData();
  }, [url]);

  return (
    <Fragment>
      <input
        type="text"
        value={query}
        onChange={event => setQuery(event.target.value)}
      />
      <button
        type="button"
        onClick={() =>
          setUrl(`http://hn.algolia.com/api/v1/search?query=${query}`)
        }
      >
        Search
      </button>

      <ul>
        {data.hits.map(item => (
          <li key={item.objectID}>
            <a href={item.url}>{item.title}</a>
          </li>
        ))}
      </ul>
    </Fragment>
  );
}
```

这就是使用效果钩子获取隐式程序数据的情况。您可以决定效果所依赖的状态。一旦您在单击或其他副作用中设置此状态，此效果将再次运行。在这种情况下，如果 URL 状态发生更改，则效果会再次运行以从 API 获取故事。

## 装载指示器与反应钩

让我们为数据提取引入一个加载指示器。它只是另一个由状态钩子管理的状态。加载标志用于在 App 组件中呈现加载指示符。

```jsx
import React, { Fragment, useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [data, setData] = useState({ hits: [] });
  const [query, setQuery] = useState("redux");
  const [url, setUrl] = useState(
    "http://hn.algolia.com/api/v1/search?query=redux"
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      const result = await axios(url);

      setData(result.data);
      setIsLoading(false);
    };

    fetchData();
  }, [url]);

  return (
    <Fragment>
      <input
        type="text"
        value={query}
        onChange={event => setQuery(event.target.value)}
      />
      <button
        type="button"
        onClick={() =>
          setUrl(`http://hn.algolia.com/api/v1/search?query=${query}`)
        }
      >
        Search
      </button>

      {isLoading ? (
        <div>Loading ...</div>
      ) : (
        <ul>
          {data.hits.map(item => (
            <li key={item.objectID}>
              <a href={item.url}>{item.title}</a>
            </li>
          ))}
        </ul>
      )}
    </Fragment>
  );
}

export default App;
```

一旦为数据提取调用了效果，这在组件安装或 URL 状态更改时发生，则加载状态设置为 true。请求解析后，加载状态再次设置为 false。

## 使用 React Hook 进行错误处理

使用 React 钩子获取数据的错误处理怎么样？错误只是用状态挂钩初始化的另一个状态。一旦出现错误状态，App 组件就可以为用户呈现反馈。使用 async / await 时，通常使用 try / catch 块进行错误处理。你可以在效果范围内完成：

```jsx
import React, { Fragment, useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [data, setData] = useState({ hits: [] });
  const [query, setQuery] = useState("redux");
  const [url, setUrl] = useState(
    "http://hn.algolia.com/api/v1/search?query=redux"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsError(false);
      setIsLoading(true);

      try {
        const result = await axios(url);

        setData(result.data);
      } catch (error) {
        setIsError(true);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [url]);

  return (
    <Fragment>
      <input
        type="text"
        value={query}
        onChange={event => setQuery(event.target.value)}
      />
      <button
        type="button"
        onClick={() =>
          setUrl(`http://hn.algolia.com/api/v1/search?query=${query}`)
        }
      >
        Search
      </button>

      {isError && <div>Something went wrong ...</div>}

      {isLoading ? (
        <div>Loading ...</div>
      ) : (
        <ul>
          {data.hits.map(item => (
            <li key={item.objectID}>
              <a href={item.url}>{item.title}</a>
            </li>
          ))}
        </ul>
      )}
    </Fragment>
  );
}

export default App;
```

每次挂钩再次运行时，错误状态都会重置。这很有用，因为在失败的请求之后，用户可能想要再次尝试它，这应该重置错误。为了自己执行错误，您可以将 URL 更改为无效的内容。然后检查错误消息是否显示。

## 使用表单获取数据并进行反应

获取数据的正确表单怎么样？到目前为止，我们只有输入字段和按钮的组合。一旦引入了更多输入元素，您可能希望用表单元素包装它们。此外，表单也可以通过键盘上的“Enter”触发按钮。

```jsx
function App() {
  ...

  return (
    <Fragment>
      <form
        onSubmit={() =>
          setUrl(`http://hn.algolia.com/api/v1/search?query=${query}`)
        }
      >
        <input
          type="text"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {isError && <div>Something went wrong ...</div>}

      ...
    </Fragment>
  );
}
```

但是现在浏览器在单击提交按钮时会重新加载，因为这是提交表单时浏览器的本机行为。为了防止默认行为，我们可以在 React 事件上调用一个函数。这就是你在 React 类组件中的表现。

```jsx
function App() {
  ...

  const doFetch = () => {
    setUrl(`http://hn.algolia.com/api/v1/search?query=${query}`);
  };

  return (
    <Fragment>
      <form onSubmit={event => {
        doFetch();

        event.preventDefault();
      }}>
        <input
          type="text"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {isError && <div>Something went wrong ...</div>}

      ...
    </Fragment>
  );
}
```

现在，当您单击“提交”按钮时，浏览器不应再重新加载。它像以前一样工作，但这次是使用表单而不是天真的输入字段和按钮组合。您也可以按键盘上的“Enter”键。

## 自定义数据获取钩子

为了提取数据提取的自定义挂钩，将属于数据提取的所有内容（属于输入字段的查询状态除外，包括加载指示符和错误处理）移动到其自己的函数中。还要确保从 App 组件中使用的函数返回所有必需的变量。

```jsx
const useHackerNewsApi = () => {
  const [data, setData] = useState({ hits: [] });
  const [url, setUrl] = useState(
    "http://hn.algolia.com/api/v1/search?query=redux"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsError(false);
      setIsLoading(true);

      try {
        const result = await axios(url);

        setData(result.data);
      } catch (error) {
        setIsError(true);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [url]);

  const doFetch = () => {
    setUrl(`http://hn.algolia.com/api/v1/search?query=${query}`);
  };

  return { data, isLoading, isError, doFetch };
};
```

现在，您的新挂钩可以再次在 App 组件中使用：

```jsx
function App() {
  const [query, setQuery] = useState("redux");
  const { data, isLoading, isError, doFetch } = useHackerNewsApi();

  return <Fragment>...</Fragment>;
}
```

接下来，从`doFetch`函数外部传递 URL 状态：

```jsx
const useHackerNewsApi = () => {
  ...

  useEffect(
    ...
  );

  const doFetch = url => {
    setUrl(url);
  };

  return { data, isLoading, isError, doFetch };
};

function App() {
  const [query, setQuery] = useState('redux');
  const { data, isLoading, isError, doFetch } = useHackerNewsApi();

  return (
    <Fragment>
      <form
        onSubmit={event => {
          doFetch(
            `http://hn.algolia.com/api/v1/search?query=${query}`,
          );

          event.preventDefault();
        }}
      >
        <input
          type="text"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      ...
    </Fragment>
  );
}
```

初始状态也可以是通用的。将它简单地传递给新的自定义钩子：

```jsx
import React, { Fragment, useState, useEffect } from "react";
import axios from "axios";

const useDataApi = (initialUrl, initialData) => {
  const [data, setData] = useState(initialData);
  const [url, setUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsError(false);
      setIsLoading(true);

      try {
        const result = await axios(url);

        setData(result.data);
      } catch (error) {
        setIsError(true);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [url]);

  const doFetch = url => {
    setUrl(url);
  };

  return { data, isLoading, isError, doFetch };
};

function App() {
  const [query, setQuery] = useState("redux");
  const { data, isLoading, isError, doFetch } = useDataApi(
    "http://hn.algolia.com/api/v1/search?query=redux",
    {
      hits: []
    }
  );

  return (
    <Fragment>
      <form
        onSubmit={event => {
          doFetch(`http://hn.algolia.com/api/v1/search?query=${query}`);

          event.preventDefault();
        }}
      >
        <input
          type="text"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {isError && <div>Something went wrong ...</div>}

      {isLoading ? (
        <div>Loading ...</div>
      ) : (
        <ul>
          {data.hits.map(item => (
            <li key={item.objectID}>
              <a href={item.url}>{item.title}</a>
            </li>
          ))}
        </ul>
      )}
    </Fragment>
  );
}

export default App;
```

这就是使用自定义钩子获取数据的原因。钩子本身对 API 没有任何了解。它从外部接收所有参数，并仅管理必要的状态，例如数据，加载和错误状态。它执行请求并使用它作为自定义数据获取挂钩将数据返回给组件。

## 用于数据获取的 Reducer Hook

到目前为止，我们已经使用各种状态挂钩来管理数据，加载和错误状态的数据获取状态。然而，不知何故，所有这些状态，由他们自己的状态钩子管理，属于一起，因为他们关心相同的原因。如您所见，它们都在数据提取功能中使用。一个很好的指标，他们属于一起的是，它们用于一个接一个（例如`setIsError`，`setIsLoading`）。让我们将所有这三个与 Reducer Hook 结合起来。

Reducer Hook 返回一个状态对象和一个改变状态对象的函数。该函数（称为调度函数）采用具有类型和可选有效负载的操作。所有这些信息都在实际的 reducer 函数中用于从先前的状态，动作的可选有效负载和类型中提取新状态。让我们看看它在代码中是如何工作的：

```jsx
import React, {
  Fragment,
  useState,
  useEffect,
  useReducer,
} from 'react';
import axios from 'axios';

const dataFetchReducer = (state, action) => {
  ...
};

const useDataApi = (initialUrl, initialData) => {
  const [url, setUrl] = useState(initialUrl);

  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: false,
    isError: false,
    data: initialData,
  });

  ...
};
```

Reducer Hook 将 reducer 函数和初始状态对象作为参数。在我们的例子中，数据，加载和错误状态的初始状态的参数没有改变，但它们已经聚合到一个由一个 reducer 钩子而不是单个状态钩子管理的状态对象。

```jsx
const dataFetchReducer = (state, action) => {
  ...
};

const useDataApi = (initialUrl, initialData) => {
  const [url, setUrl] = useState(initialUrl);

  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: false,
    isError: false,
    data: initialData,
  });

  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: 'FETCH_INIT' });

      try {
        const result = await axios(url);

        dispatch({ type: 'FETCH_SUCCESS', payload: result.data });
      } catch (error) {
        dispatch({ type: 'FETCH_FAILURE' });
      }
    };

    fetchData();
  }, [url]);

  ...
};
```

现在，在获取数据时，可以使用调度功能将信息发送到 reducer 功能。使用 dispatch 函数发送的对象具有强制`type`属性和可选`payload`属性。该类型告诉 reducer 功能需要应用哪个状态转换，并且 reducer 可以另外使用有效负载来提取新状态。毕竟，我们只有三个状态转换：初始化提取过程，通知成功的数据提取结果，并通知有关错误的数据提取结果。

在自定义钩子的末尾，状态像以前一样返回，但是因为我们有状态对象而不是独立状态，所以状态对象作为被破坏对象返回。这样，调用`useDataApi`自定义挂钩的人仍然可以访问`data`，`isLoading`并且`isError`：

```jsx
const useDataApi = (initialUrl, initialData) => {
  const [url, setUrl] = useState(initialUrl);

  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: false,
    isError: false,
    data: initialData,
  });

  ...

  const doFetch = url => {
    setUrl(url);
  };

  return { ...state, doFetch };
};
```

最后但并非最不重要的是，缺少 reducer 函数的实现。它需要作用于所谓的三种不同的状态转换`FETCH_INIT`，`FETCH_SUCCESS`和`FETCH_FAILURE`。每个状态转换都需要返回一个新的状态对象。让我们看看如何使用 switch case 语句实现它：

```jsx
const dataFetchReducer = (state, action) => {
  switch (action.type) {
    case "FETCH_INIT":
      return { ...state };
    case "FETCH_SUCCESS":
      return { ...state };
    case "FETCH_FAILURE":
      return { ...state };
    default:
      throw new Error();
  }
};
```

reducer 函数可以通过其参数访问当前状态和传入操作。到目前为止，在 out case case 语句中，每个状态转换仅返回先前的状态。解构语句用于保持状态对象不可变 - 意味着状态永远不会直接变异 - 以强制执行最佳实践。现在让我们覆盖一些当前状态返回的属性来改变每个状态转换的状态：

```jsx
const dataFetchReducer = (state, action) => {
  switch (action.type) {
    case "FETCH_INIT":
      return {
        ...state,
        isLoading: true,
        isError: false
      };
    case "FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload
      };
    case "FETCH_FAILURE":
      return {
        ...state,
        isLoading: false,
        isError: true
      };
    default:
      throw new Error();
  }
};
```

现在，由动作类型决定的每个状态转换都会返回基于先前状态和可选有效负载的新状态。例如，在成功请求的情况下，有效载荷用于设置新状态对象的数据。

总之，Reducer Hook 确保状态管理的这一部分用自己的逻辑封装。通过提供操作类型和可选的有效负载，您将始终以谓词状态更改结束。此外，您永远不会遇到无效状态。例如，以前可能会意外地将`isLoading`和`isError`状态设置为 true。在这种情况下，UI 应该显示什么？现在，reducer 函数定义的每个状态转换都会导致一个有效的状态对象。

## 中止数据在效果钩中获取

React 中的一个常见问题是即使组件已经卸载（例如由于使用 React Router 导航），也会设置组件状态。我之前在这里写过关于这个问题的文章，它描述了[如何防止](https://www.robinwieruch.de/react-warning-cant-call-setstate-on-an-unmounted-component/)在各种场景中为[未安装的组件](https://www.robinwieruch.de/react-warning-cant-call-setstate-on-an-unmounted-component/)设置状态。让我们看看我们如何阻止在数据提取的自定义钩子中设置状态：

```js
const useDataApi = (initialUrl, initialData) => {
  const [url, setUrl] = useState(initialUrl);

  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: false,
    isError: false,
    data: initialData
  });

  useEffect(() => {
    let didCancel = false;

    const fetchData = async () => {
      dispatch({ type: "FETCH_INIT" });

      try {
        const result = await axios(url);

        if (!didCancel) {
          dispatch({ type: "FETCH_SUCCESS", payload: result.data });
        }
      } catch (error) {
        if (!didCancel) {
          dispatch({ type: "FETCH_FAILURE" });
        }
      }
    };

    fetchData();

    return () => {
      didCancel = true;
    };
  }, [url]);

  const doFetch = url => {
    setUrl(url);
  };

  return { ...state, doFetch };
};
```

每个效果挂钩都带有一个清理功能，该功能在组件卸载时运行。清理功能是钩子返回的一个功能。在我们的例子中，我们使用一个布尔标志来调用`didCancel`，让我们的数据获取逻辑知道组件的状态（已安装/未安装）。如果组件已卸载，则应将该标志设置为`true`导致在最终异步解析数据提取后阻止设置组件状态。

注意：实际上不会中止数据获取 - 这可以通过[Axios Cancellation](https://github.com/axios/axios#cancellation)实现- 但是对于未安装的组件不再执行状态转换。由于 Axios Cancellation 在我看来并不是最好的 API，因此这个防止设置状态的布尔标志也能完成这项工作。

您已经了解了如何在 React 中使用状态和效果的 React 挂钩进行数据获取。如果您对使用渲染道具和高阶组件的类组件（和函数组件）中的数据获取感到好奇，请从头开始查看我的其他文章。否则，我希望本文对您了解 React Hooks 以及如何在现实世界中使用它们非常有用。

**译文：**[How to fetch data with React Hooks?](https://www.robinwieruch.de/react-hooks-fetch-data/)
