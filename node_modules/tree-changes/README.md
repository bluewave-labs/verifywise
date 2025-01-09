# tree-changes

[![NPM version](https://badge.fury.io/js/tree-changes.svg)](https://www.npmjs.com/package/tree-changes) [![build status](https://travis-ci.org/gilbarbara/tree-changes.svg)](https://travis-ci.org/gilbarbara/tree-changes) [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=gilbarbara-github_tree-changes&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=gilbarbara-github_tree-changes) [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=gilbarbara-github_tree-changes&metric=coverage)](https://sonarcloud.io/summary/new_code?id=gilbarbara-github_tree-changes)

Compare changes between two datasets.

## Setup

```bash
npm install tree-changes
```

## Usage

```ts
import treeChanges from 'tree-changes';

const previousData = {
  hasData: false,
  sort: {
    data: [{ type: 'asc' }, { type: 'desc' }],
    status: 'idle',
  },
};

const newData = {
  hasData: true,
  sort: {
    data: [{ type: 'desc' }, { type: 'asc' }],
    status: 'success',
  },
};

const { changed, changedFrom } = treeChanges(previousData, newData);

changed(); // true

changed('hasData'); // true
changed('hasData', true); // true
changed('hasData', true, false); // true

// support nested matches. with dot notation
changed('sort.data.0.type', 'desc'); // true

// works with array values too
changed('sort.status', ['done', 'success']); // true

// if you only need to know the previous value 
changedFrom('sort.status', 'idle'); // true
```

#### Works with arrays too.

```typescript
import treeChanges from 'tree-changes';

const { changed } = treeChanges([0, { id: 2 }], [0, { id: 4 }]);

changed(); // true
changed(0); // false
changed(1); // true
changed('1.id', 4); // true
```

> This library uses [@gilbarbara/deep-equal](https://github.com/gilbarbara/deep-equal) to compare properties.

## API

**added**(`key: Key`, `value?: Value`)  
Check if something was added to the data.  
Works with arrays and objects (using Object.keys).

```typescript
import treeChanges from 'tree-changes';

const previousData = {
  actions: {},
  messages: [],
};

const newData = {
  actions: { complete: true },
  messages: ['New Message'],
  sudo: true,
};

const { added } = treeChanges(previousData, newData);

added(); // true
added('actions'); // true
added('messages'); // true
added('sudo'); // true
```

**changed**(`key?: Key`, `actual?: Value`, `previous?: Value`)  
Check if the data has changed.  
It also can compare to the `actual` value or even with the `previous`.

**changedFrom**(`key: Key`, `previous: Value`, `actual?: Value`)  
Check if the data has changed from `previous` or from `previous` to `actual`.

**decreased**(`key: Key`, `actual?: Value`, `previous?: Value`)  
Check if both values are numbers and the value has decreased.  
It also can compare to the `actual` value or even with the `previous`.

```typescript
import treeChanges from 'tree-changes';

const previousData = {
  ratio: 0.9,
  retries: 0,
};

const newData = {
  ratio: 0.5,
  retries: 1,
};

const { decreased } = treeChanges(previousData, newData);

decreased('ratio'); // true
decreased('retries'); // false
```

**emptied**(`key: Key`)  
Check if the data was emptied. Works with arrays, objects and strings.

```typescript
import treeChanges from 'tree-changes';

const previousData = {
  data: { a: 1 },
  items: [{ name: 'test' }],
  missing: 'username',
};

const newData = {
  data: {},
  items: [],
  missing: '',
};

const { emptied } = treeChanges(previousData, newData);

emptied('data'); // true
emptied('items'); // true
emptied('missing'); // true
```

**filled**(`key: Key`)  
Check if the data was filled (from a previous empty value). Works with arrays, objects and strings.

```typescript
import treeChanges from 'tree-changes';

const previousData = {
  actions: {},
  messages: [],
  username: '',
};

const newData = {
  actions: { complete: true },
  messages: ['New Message'],
  username: 'John',
};

const { filled } = treeChanges(previousData, newData);

filled('actions'); // true
filled('messages'); // true
filled('username'); // true
```

**increased**(`key: Key`, `actual?: Value`, `previous?: Value`)  
Check if both values are numbers and the value has increased.  
It also can compare to the `actual` value or even with the `previous`.

```typescript
import treeChanges from 'tree-changes';

const previousData = {
  ratio: 0.9,
  retries: 0,
};

const newData = {
  ratio: 0.5,
  retries: 1,
};

const { increased } = treeChanges(previousData, newData);

increased('retries'); // true
increased('ratio'); // false
```

**removed**(`key: Key`, `value?: Value`)  
Check if something was removed from the data.  
Works with arrays and objects (using Object.keys).

```typescript
import treeChanges from 'tree-changes';

const previousData = {
  data: { a: 1 },
  items: [{ name: 'test' }],
  switch: false,
};

const newData = {
  data: {},
  items: [],
};

const { removed } = treeChanges(previousData, newData);

removed(); // true
removed('data'); // true
removed('items'); // true
removed('switch'); // true
```

> **Types**  
> type Key = string | number;  
> type ValidTypes = string | boolean | number | Record<string, any> };  
> type Value = ValidTypes | ValidTypes[];

## License

MIT
