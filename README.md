# Depecration Notice

This library has been succeeded by a v2 concept re-write: https://github.com/netarc/refrax

# React Partial Store (RPS)

Another simple library for unidirectional dataflow architecture with support for fragmented (partial) data. Inspired by collaboration with [sarahhenkens](https://github.com/sarahhenkens) and [omab](https://github.com/omab) and similar libraries.

The goal is to introduce a more functional programming style architecture by eschewing MVC like pattern and adopting a single data flow pattern revolving around resources (Datasets).

```
                   ╔════════╗
                   ║ Stores ║
                   ╚════════╝
                      ▲  │
                      │  ▼
╔═════════╗       ╔══════════╗       ╔═════════════════╗
║ Actions ║──────>║ Datasets ║──────>║  Components     ║
╚═════════╝       ╚══════════╝       ╚═════════════════╝
     ▲                                        │
     └────────────────────────────────────────┘

```

Mutation of data has to happen through calling the Actions that flow through the stack. Actions exist on Datasets, which describe a sub-set of data that is stored in the Data Stores. This keeps the data structure flat and lets the concerns of data manipulation follow the chain to the Stores. This will remove side effects and exhaustive code that may result from Components handling data each on their own.

By forcing the data-flow to be in a single direction, it will be easier to follow how data changes will affect the whole application depending on what actions have been issued.

## Content

- [Installation](#installation)
- [Preface](#preface)
- [Usage](#usage)
     - [Stores](#creating-stores)
     - [Datasets](#creating-datasets)
     - [Actions](#creating-actions)
     - [Component](#component-usage)
- [Advanced Usage](#advanced-usage)
     - [Dataset Subsets](#dataset-subsets)
     - [Partials](#partials)
     - [Embedded Data](#embedded-data)

## Installation

You can currently install the package as a npm package or bower component.

### NPM

The following command installs reflux as a npm package:

    npm install react-partial-store

[Back to top](#content)

### Preface

Short of the Actions, Datasets, Stores, Components already referenced above; there are a few other terms & concepts to be aware of.

##### Resource

Resource refers to objects stored in a Store. Actions perform upon Resources ultimately even though they follow the stack chain through a Dataset.

##### Stack

The stack refers to the flow of an Action through a Dataset up its parental chain until it reaches a Dataset or Store with no parent. This concept is important because Datasets & Stores are typically built upon each other in a given application.

##### Resolve

Referencing the Stack, Resolving is the act of collapsing the Stack into a representation of a given Resource or Action upon a Resource. As the Stack resolves, items at the front of the stack will take higher priority than ones at the end and options for each item either concatenate or override each-other as the stack resolves. When an Action finally gets to the Store there will be a clear representation of how that resource should be accessed.

## Usage

### Creating Stores

Stores represent a collection of data of one type (For example `projects`). A Store can be created by calling `RPS.createStore` with an optional collection type name and/or options object. If multiple `createStore` commands use the same collection type they will all point to the same data Store and you may get errors telling you so if you tried to change its configuration while doing so.

```javascript
var ProjectsStore = RPS.createStore("projects");
```

Above is as dry as it gets. Stores can be further configured with the following options:

#### Store Options

Name | Type | Required | Description
-----|------|----------|------------
type | string | no | The unique name representing the objects in this Store. When no-name is provided it will be considered an anonymous Store.

[Back to top](#content)

### Creating Datasets

A Dataset is typically created through an existing Store since they represent a virtual sub-set of data by calling `store.createDataset` with an optional options object. They can also be created by calling `RPS.createDataset` and then later compounded with a Store.

```javascript
var ProjectsStore = RPS.createStore("projects");

var ProjectsDataset = ProjectsStore.createDataset({
  uri: "/projects"
});
```

If a Store is only used once in the overall scope you can use the shorthand method of creating a Dataset off a Store such as:

```javascript
var ProjectsDataset = RPS.createStore("projects", {
  uri: "/projects"
});
```

Datasets can also be chained as seen below.

```javascript
var ProjectsDataset = RPS.createStore("projects", {
  uri: "/projects"
});

var ProjectDataset = ProjectsDataset.createDataset({
  uri: "/:projectId",
  paramId: "projectId"
});
```

That means when `ProjectDataset` resolves it would resolve to a **URI** of `/projects/:projectId`.

Datasets can be further configured with the following options:

#### Dataset Options

Name | Type | Required | Description
-----|------|----------|------------
partial | string | no | When specified, resources that are fetched through this Dataset are associated with the specified partial name unless over-ridden further down the chain.
fragments | array(string) | no | Specified fragments that are used to compose objects from this dataset until the "complete" data can be fetched.
paramMap | object | no | A lookup table to map params on the Component with params in the `uri`.
paramId | string | no | An identifier to the Component param that will server as the unique id for this Dataset.
uri | string | no | A URI that will be resolved and concatenated with other URI's in the stack. Component params may be referenced in the URI by doing `:paramName`.
actions | object | no | An object depicting accessor names and action values that will be provided to the Component referencing this Dataset. This list of actions will be concatenated with other Actions as the stack is resolved.
onlyActions | object | no | An object depicting accessor names and action values that will whitelist any Actions found later in the stack.

[Back to top](#content)

### Creating Actions

An Action can be created by calling `RPS.createAction` with a function and/or definition. The return value of a function supplied will be appended to the Stack when the Action resolves. Be aware this won't automatically resolve to an end-point action (`update` / `create` / `delete`). If you want to `update` (**PUT**) a resource via a custom Action you will need to hook the predefined Action `RPS.actions.update` by making use of the `.hook(fn)` method thats inherit on all Actions.

```javascript
var ProjectsStore = RPS.createStore("projects");

var ActionArchive = RPS.actions.update.hook({
  uri: "/archive"
})

var ProjectsDataset = ProjectsStore.createDataset({
  uri: "/projects"
});

var ProjectDataset = ProjectsDataset.createDataset({
  uri: "/:projectId",
  paramId: "projectId",
  actions: {
    archive: ActionArchive
  }
});

```

Now when using this Dataset in your Component, simply call `this.project.archive()` to invoke the `update` (**PUT**) that will resolve to `/projects/:projectId/archive`.

Let's see this as a callback intead that appends json into the response:

```
var ActionArchive = RPS.actions.update.hook(function() {
  console.info("archiving project: %i", this.projectId);
  return {
    archive: true
  };
});
```

When Providing an options object to an Action you can use the following:

#### Action Options

Name | Type | Required | Description
-----|------|----------|------------
uri | string | no | A URI that will be resolved and concatenated with other URI's in the stack. Component params may be referenced in the URI by doing `:paramName`.

[Back to top](#content)

### Component Usage

Making a React Component work with RPS requires just changing your `React.createClass` over to `RPS.createClass` and providing a `datasets` object denoting accessor names to Dataset objects.

To bring this full circle, lets look at a relatively simple demo:

```javascript
var React = require("react")
  , RPS = require("react-partial-store");

var ProjectsStore = RPS.createStore("projects");

var ProjectsDataset = ProjectsStore.createDataset({
  uri: "/projects"
});

var ProjectDataset = ProjectsDataset.createDataset({
  uri: "/:projectId",
  paramId: "projectId"
});

var ComponentProjectShow = RPS.createClass({
  datasets: {
    project: ProjectDataset
  },
  render: function() {
    var projectDataset = this.project
      , project = projectDataset.data;

    if (this.isLoading()) {
      return (
        <div>Loading Project...</div>
      );
    }

    return (
      <div>
        <label>Title</label>
        <span>{project.title}</span>
        <label>Description</label>
        <span>{project.description}</span>
        <label>Options</label>
        <span>
          <a href="#" onClick={this._delete}>Delete Project</a>
        </span>
      </div>
    );
  },
  _delete: function() {
    this.project.delete()
      .then(function() {
        window.location = "/projects"
      });
  }
});

var ComponentProjectsList = RPS.createClass({
  datasets: {
    projects: ProjectsDataset
  },
  render: function() {
    var projectsDataset = this.projects
      , projects = projectsDataset.data;

    if (this.isLoading()) {
      return (
        <div>Loading Projects...</div>
      );
    }

    var contentProjects = []
    for (var i = 0; i < projects.length; i++) {
      var project = projects[i];

      contentProjects.add((
        <li key={project.id}>
          <a href={"/projects/" + project.id}>
            {project.title}
          </a>
        </li>
      ));
    }

    return (
      <ul>
        {contentProjects}
      </ul>
    );
  }
});
```

If you are familiar with other Stores in React you may notice that you aren't accessing data through `this.props`. Instead all dataset accessors are mounted right on the component itself.

You may have also noticed that the `.delete` action (any action through a React Component) returns a [Promise](http://www.html5rocks.com/en/tutorials/es6/promises/) that can be followed for a success/failure. But wait, why is the `delete` action even available in the first place; we didn't specify any `actions` option for our Store or Datasets? This is because by default Datasets offer the basic `create`, `update`, `delete` actions. If you want to disable them you can pass `onlyActions: {}` to your Dataset or Store as a simple empty white-list.

You will also see one of several helper methods for components in use via `this.isLoading()`, this will check all datasets to see if any are actively waiting for data.

If you want to further modify a Dataset solely for use in the component but don't want to create a new external dataset, you can also pass the `datasetConfig` object on the Component and then specify the dataset you wish to config along with an options object that accepts all options a Dataset normally would accept.

For example:

```javascript
var ComponentProjectsList = RPS.createClass({
  datasets: {
    projects: ProjectsDataset
  },
  datasetConfig: {
    projects: {
      onlyActions: {}
    }
  }
  render: function() {
    ...
  }
});
```

[Back to top](#content)

## Advanced Usage

### Dataset Subsets

While we saw how Datasets can be chained off each other, this hierarchy is often needed to be easily referenced at each point along it. One approach could be to manually build/store references to each Dataset or you can make use of Dataset Subsets.

Subsets allow you to add a Dataset to an existing Dataset as a subset via a literal reference instead of just creating a Dataset that parental references another. As an example:

```javascript
var Projects = RPS.createStore("projects", {
  uri: "/projects"
});

Projects.addDataset("project", {
  uri: "/:projectId",
  paramId: "projectId"
});

...

var ComponentProjectShow = RPS.createClass({
  datasets: {
    project: Projects.project
  },
  render: function() {
    ...
  }
});

var ComponentProjectsList = RPS.createClass({
  datasets: {
    projects: Projects
  },
  render: function() {
    ...
  }
});
```

This allows greater Dataset re-usability componed with the need to maintain references to various Datasets across the application.

### Partials

We mentioned **partials** earlier, but didn't see them in action. Out of the box RPS will work with non-fragmented resources. But let's add some optimization and fragment some data.

This can be accomplished one of two ways.

#### Approach 1 - Manual

From our above example we can rewrite the Datasets and declare them fragmented and associated as a partial.

```
var ProjectsDataset = ProjectsStore.createDataset({
  partial: "minimal",
  uri: "/projects"
});

var ProjectDataset = ProjectsDataset.createDataset({
  uri: "/:projectId",
  paramId: "projectId",
  fragments: ["minimal"]
});
```

We can see that any resources going through our `ProjectsDataset` will be associated as a partial called **minimal**. The server can then return a minimalistic represntation of a project for the index view. The other Dataset says it accepts fragments of a given partial to allow a pre-render before the complete data is fetched and rendered completey.

This can be expanded in a React Component as the following:

```
var ComponentProjectShow = RPS.createClass({
  datasets: {
    project: ProjectDataset
  },
  render: function() {
    var projectDataset = this.project
      , project = projectDataset.data;

    if (this.isLoading() && !this.hasData()) {
      return (
        <div>Loading Project...</div>
      );
    }

    return (
      <div>
        <label>Title</label>
        <span>{project.title}</span>
        <label>Description</label>
        <span>{project.description}</span>
        <label>Options</label>
        <span>
          <a href="#" onClick={this._delete}>Delete Project</a>
        </span>
      </div>
    );
  },
  _delete: function() {
    this.project.delete()
      .then(function() {
        window.location = "/projects"
      });
  }
});
```

We just added an extra conditional `&& !this.hasData()` (another one of those component helper methods mentioned earlier). So if the user is coming from the *index* view into the *show* view seen above, `isLoading()` will return true because the **complete** representation of the resource hasn't been loaded yet but `hasData()` will return true since it contains a fragment of existing data. Any properties on the resource object that are not in the fragment of data will be undefined and can be handled appropriately for a default value.

#### Approach 2 - Automatic

With this approach you can leave the Datasets without configuration seen above:

```
var ProjectsDataset = ProjectsStore.createDataset({
  uri: "/projects"
});

var ProjectDataset = ProjectsDataset.createDataset({
  uri: "/:projectId",
  paramId: "projectId"
});
```

And it will rely on the server denoting any partial existence when data is returned (with a specific json format containting a `_partial` property for each resource in the json representation; `minimal` on the index uri `/projects` and `full` for the show uri `/projects/:projectId`).

### Embedding data on the page load

There are times it's convenient to preload data on an actual page-load. To support this you can make use of the `RPS.prefetchCache` toolset and directly put any preloaded data by Store `type` name into cache by using its `.setEntries` or `.setQueries` function. That data will be checked before any request is made out to the server.

An example usage can be seen below in an example of a script at the start of the App. Of course this generally is populated from a JSON/Script embed from the html template and can be easily used in those scenarios as well.

An array of objects each with explicit collection type:

```
RPS.prefetchCache.setEntries([
  {
    _partial: "minimal",
    _type: "projects",
    id: 1,
    title: "The Big Bad Wolf"
  },
  ...
]);
```

An array of objects with explicit passed type:

```
RPS.prefetchCache.setEntries("projects", [
  {
    _partial: "minimal",
    id: 1,
    title: "The Big Bad Wolf"
  },
  ...
]);
```

### Embedded Data (Relational data cross filling)

Another supported feature is allowing one resource request to potentially fill in other resource stores via embedded data in the response.

TODO FINISH/EXAMPLES

[Back to top](#content)
