## Instalation
```shell
npm i -D mithril-template
```

## Usage
```javascript
var mithrilTemplate = require("mithril-template")

console.log(mithrilTemplate('<h1 class="greetings">Hello World</h1>'))
```

## Template syntax- guide

### Interpolation
The most basic form of data binding is text interpolation using the “Mustache” syntax (double curly braces):
```html
<div class="greeting">
    Hello {{ name }}!
</div>
```
that will output:
```javascript
m(".greeting","Hello "+name+"!")
```
Awesome, right? So let's dive deeper.

Interpolations can't be used within html tag definiition (also in attributes), so this code is invalid:
```html
<div key="{{ foo }}" class="bar">
    Hello World!
</div>
```
<!--TODO add link do binding reference-->
instead use a binding attribute:
```html
<div :key="foo" class="bar">
    Hello World!
</div>
```
output:
```javascript
m(".bar",{key:foo},"Hello World!")
```

Note that `{` and `}` characters are reserved in templates for interpolation, so if you have to write them use this workaround:
```html
<span>This is how to use {{ "{" }} and {{ "}"+"}" }} chars.</span>
```
You can't use `&#123;` and `&#125;` html entities because mithril will escape them

### Eembeding components
To embed component, his name must end on `-component`, be kebab-case (a.k.a. snake-case) that will be automatically converted to camelCase and can't be self-closed tag:
```html
<custom-component></custom-component>
```
output:
```javascript
m(customComponent)
```
Attributes that are **not** followed by `:` (colon) will be ommited.
```html
<custom-component class="custom-class"></custom-component>
```
output:
```javascript
m(customComponent)
```
so if you want to pass data into component use binding syntax instead:
```html
<custom-component :class="'custom-class'"></custom-component>
```
output:
```javascript
m(customComponent,{class:'custom-class'})
```
You can nest anything inside the component:
```html
<custom-component :key="'unique420'">
  <span style="color: red;">Hello!</span>
</custom-component>
```
output:
```javascript
m(customComponent,{key:'unique420'},m("span[style='color: red;']","Hello!"))
```
Nested data will be available in `vnode.children` component view property:
```html
<!--customComponent view-->
<div class="styled-message">{{ vnode.children }}</div>
```
output:
```javascript
m(".styled-message",vnode.children)
```


### Binding attributes
You probably noticed that html attributes are compiled to hardcoded selectors:
```html
<input type="text" name="name" value="name">
```
output:
```javascript
m("input[type=text][name=name][value=name]")
```
if you want to bind html attribute just put `:` (colon) before attribute name:
```html
<input type="text" name="name" :value="name">
```
output:
```javascript
m("input[type=text][name=name]",{value:name})
```
you can also bind events and lifecycle hooks:
```html
<div :oninit="initialize" :onclick="doSomething">
  Hello World!
</div>
```
output:
```javascript
m("div",{oninit:initialize,onclick:doSomething},"Hello World!")
```


### Directives
Directives are putted as html attributes that are previxed by `*` (asterisk).
The result hyperscript code will be surrounded by javascript flow statements.

There are four available directives, that can be mixed togheder:
* `for`
* `if`
* `elseif`
* `else`

Let's explain, but note that examples' outputs below are unminified, for better readability.

#### if:
usage:
```html
<div class="foo" *if="varr % 2 == 0">
  odd
</div>
```
output:
```javascript
varr % 2 == 0
    ? m(".foo","odd")
    : ""
```
#### if-elseif && if-else:
```html
<div class="foo" *if="varr % 2 == 0">
  odd
</div>
<div *elseif="varr % 5 == 0">
  divisible by 5
</div>
<div *else>
  other
</div>
```
output:
```javascript
[
    varr % 2 == 0
        ? m(".foo","odd")
        : varr % 5 == 0
            ? m("div","divisible by 5")
            : m("div","other")
]
```
#### for:
```html
<ul>
  <li *for="item in items">
    {{ item.name }}
  </li>
</ul>
```
output:
```javascript
m("ul", items.map(function(n){
    return m("li", n.name)
}))
```
#### for with index:
```html
<ul>
  <li *for="item, index in items">
    #{{ index }}: {{ item.name }}
  </li>
</ul>
```
output:
```javascript
m("ul", items.map(function(n, a){
    return m("li","#"+a+": "+n.name)
}))
```
#### for-else
for loop can be used with else (or elseif) statement:
```html
<ul>
  <li *for="item, index in items">
    #{{ index }}: {{ item.name }}
  </li>
  <li *else>
    items not found
  </li>
</ul>
```
output:
```javascript
m("ul", items.length
    ? items.map(function(n, t){
        return m("li","#"+t+": "+n.name)
    })
    : m("li","items not found")
)
```
so if items array is empty (loop won't execute even once) then else statement will be executed


## Gotchas
To maximally compress output- whitespaces whose belongs to tags are not properly handled, so if you write this code:
```html
foo <span>bar</span> baz qux
```
the transpiled code will be:
```javascript
["foo",m("span","bar"),"baz qux"]
```
instead of:
```javascript
["foo ",m("span","bar")," baz qux"]
```
that you may expected. So if you need space between text and tag do it by this workaround:
```html
foo{{ " " }}<span>bar</span>{{ " " }}baz qux
```

## Additional advantages
* properly support [splats](https://mithril.js.org/signatures.html#splats) for better minification
* produce maximally minified js code (also minify literal selectors)
