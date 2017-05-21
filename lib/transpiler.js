var UglifyJS = require("uglify-js")
var parse5 = require("parse5")

// filter_node returns node that hasn't #comment and empty #text nodes
function filter_node(node) {
  var filtered_elements = []

  for (var i = 0, len = node.length; i < len; i++) {
    if ((!(node[i].nodeName == "#text" && node[i].value.trim() == ""))
      && node[i].nodeName != "#comment") {
      filtered_elements.push(node[i])
    }
  }

  return filtered_elements
}

// has_attribute returns true if element has attribute else false
function has_attribute(attr_name, fragment) {
  if (typeof (fragment) === 'undefined' || typeof (fragment.attrs) === 'undefined')
    return false
  for (var i = 0, len = fragment.attrs.length; i < len; i++) {
    if (fragment.attrs[i].name == attr_name)
      return true
  }
  return false
}

// make_directives return javascript flow
function make_directives(fragment, cur_child) {
  var filtered_attributes_name = []
  var filtered_attributes_value = []
  var text = ""
  var close_tags = ""

  for (var i = 0, len = fragment.attrs.length; i < len; i++) {
    var attr_first_char = fragment.attrs[i].name[0]
    if (attr_first_char == "*") {
      filtered_attributes_name.push(fragment.attrs[i].name.substr(1))
      filtered_attributes_value.push(fragment.attrs[i].value)
    }
  }

  if (filtered_attributes_name.indexOf("if") >= 0
  ) {
    if (filtered_attributes_name.indexOf("for") >= 0) {
      if (typeof (fragment.parentNode) !== 'undefined'
        && typeof (fragment.parentNode.childNodes) !== 'undefined'
        && typeof (fragment.parentNode.childNodes[cur_child + 1]) !== 'undefined'
        && (
          has_attribute("*elseif", filter_node(fragment.parentNode.childNodes)[cur_child + 1])
          || has_attribute("*else", filter_node(fragment.parentNode.childNodes)[cur_child + 1])
        )
      ) {
        // build_for = "if-for-else"
        text += "(" + filtered_attributes_value[filtered_attributes_name.indexOf("if")] + ")?"

        var item = filtered_attributes_value[filtered_attributes_name.indexOf("for")].split(" in ")[0]
        var index = ""

        if (item.split(",").length == 2) {
          index = item.split(",")[1]
          item = item.split(",")[0]
        }
        var items = filtered_attributes_value[filtered_attributes_name.indexOf("for")].split(" in ")[1]

        text += items + ".map(function(" + item + (index.length ? "," + index : "") + "){"
        text += "return "
        close_tags += "}):"
      } else {
        // build_for = "if-for"
        text += "(" + filtered_attributes_value[filtered_attributes_name.indexOf("if")] + ")?"

        var item = filtered_attributes_value[filtered_attributes_name.indexOf("for")].split(" in ")[0]
        var index = ""

        if (item.split(",").length == 2) {
          index = item.split(",")[1]
          item = item.split(",")[0]
        }
        var items = filtered_attributes_value[filtered_attributes_name.indexOf("for")].split(" in ")[1]

        text += items + ".map(function(" + item + (index.length ? "," + index : "") + "){"
        text += "return "
        close_tags += "}):\"\""
      }
    } else {
      if (typeof (fragment.parentNode) !== 'undefined'
        && typeof (fragment.parentNode.childNodes) !== 'undefined'
        && typeof (fragment.parentNode.childNodes[cur_child + 1]) !== 'undefined'
        && (
          has_attribute("*elseif", filter_node(fragment.parentNode.childNodes)[cur_child + 1])
          || has_attribute("*else", filter_node(fragment.parentNode.childNodes)[cur_child + 1])
        )) {
        // build_for = "if-elseif" || "if-else"
        text += "(" + filtered_attributes_value[filtered_attributes_name.indexOf("if")] + ")?"
        close_tags = ":"

      } else {
        // build_for = "if"
        text += "(" + filtered_attributes_value[filtered_attributes_name.indexOf("if")] + ")?"
        close_tags = ":\"\""

      }
    }


  } else if (filtered_attributes_name.indexOf("for") >= 0) {
    if (typeof (fragment.parentNode) !== 'undefined'
      && typeof (fragment.parentNode.childNodes) !== 'undefined'
      && typeof (fragment.parentNode.childNodes[cur_child + 1]) !== 'undefined'
      && (
        has_attribute("*elseif", filter_node(fragment.parentNode.childNodes)[cur_child + 1])
        || has_attribute("*else", filter_node(fragment.parentNode.childNodes)[cur_child + 1])
      )
    ) {
      // build_for = "if.len-for-else"
      var item = filtered_attributes_value[filtered_attributes_name.indexOf("for")].split(" in ")[0]
      var index = ""

      if (item.split(",").length == 2) {
        index = item.split(",")[1]
        item = item.split(",")[0]
      }

      var items = filtered_attributes_value[filtered_attributes_name.indexOf("for")].split(" in ")[1]

      text += items + ".length?"

      text += items + ".map(function(" + item + (index.length ? "," + index : "") + "){"
      text += "return "
      close_tags += "}):"
    } else {
      // build_for = "for"
      var item = filtered_attributes_value[filtered_attributes_name.indexOf("for")].split(" in ")[0]
      var index = ""

      if (item.split(",").length == 2) {
        index = item.split(",")[1]
        item = item.split(",")[0]
      }

      var items = filtered_attributes_value[filtered_attributes_name.indexOf("for")].split(" in ")[1]

      text += items + ".map(function(" + item + (index.length ? "," + index : "") + "){"
      text += "return "
      close_tags += "})"
    }
  } else if (cur_child > 0 && filtered_attributes_name.indexOf("elseif") >= 0
    && typeof (fragment.parentNode) !== 'undefined'
    && typeof (fragment.parentNode.childNodes) !== 'undefined'
    && typeof (fragment.parentNode.childNodes[cur_child - 1]) !== 'undefined'
    && filter_node(fragment.parentNode.childNodes)[cur_child - 1].nodeName != "#text"
    && (
      has_attribute("*if", filter_node(fragment.parentNode.childNodes)[cur_child - 1])
      || has_attribute("*for", filter_node(fragment.parentNode.childNodes)[cur_child - 1])
    )
  ) {
    if (has_attribute("*elseif", filter_node(fragment.parentNode.childNodes)[cur_child + 1])
      || has_attribute("*else", filter_node(fragment.parentNode.childNodes)[cur_child + 1])) {
      // build_for = "elseif-else"
      text += "(" + filtered_attributes_value[filtered_attributes_name.indexOf("elseif")] + ")?"

      close_tags += ":"
    } else {
      // build_for = "elseif"
      text += "(" + filtered_attributes_value[filtered_attributes_name.indexOf("elseif")] + ")?"

      close_tags += ":\"\""
    }
  } else if (cur_child > 0
    && filtered_attributes_name.indexOf("else") >= 0
    && typeof (fragment.parentNode) !== 'undefined'
    && typeof (fragment.parentNode.childNodes) !== 'undefined'
    && typeof (fragment.parentNode.childNodes[cur_child - 1]) !== 'undefined'
    && filter_node(fragment.parentNode.childNodes)[cur_child - 1].nodeName != "#text"
    && (
      has_attribute("*if", filter_node(fragment.parentNode.childNodes)[cur_child - 1])
      || has_attribute("*for", filter_node(fragment.parentNode.childNodes)[cur_child - 1])
    )
  ) {
    // build_for = "else"
    // no need to handle that- handled by ":" (colon) in build_for = if-else 
  }

  return [text, close_tags]
}

function make_selector(fragment) {
  var text = ""

  var tagName = fragment.tagName
  // convert component name kebab-case to camelCase
  if (tagName.substr(tagName.length - 9) == "component")
    return tagName.replace(/(\-\w)/g, function (m) { return m[1].toUpperCase(); })

  if (!fragment.attrs.length)
    return "\"" + tagName + "\""

  // filtered_other_attributes doesn't contain class and id -there are added in the loop below
  filtered_other_attributes = []

  for (var i = 0, len = fragment.attrs.length; i < len; i++) {
    var attr_first_char = fragment.attrs[i].name[0]
    if (attr_first_char != ":" && attr_first_char != "*") {
      var cur_attr_name = fragment.attrs[i].name
      var cur_attr_value = fragment.attrs[i].value

      if (cur_attr_name == "id") {
        if (cur_attr_value.trim().length)
          text += "#" + fragment.attrs[i].value
      } else if (cur_attr_name == "class") {
        if (cur_attr_value.trim().length)
          text += "." + fragment.attrs[i].value.trim().replace(/\s/g, ".")
      } else {
        filtered_other_attributes.push(fragment.attrs[i])
      }
    }
  }

  for (var i = 0, len = filtered_other_attributes.length; i < len; i++) {
    text += "[" + filtered_other_attributes[i].name

    if (filtered_other_attributes[i].value.trim() != "")
      text += "=" + (/^[\s\p{L}\w-]+$/i.test(filtered_other_attributes[i].value.trim()) ? filtered_other_attributes[i].value.trim() : "'" + filtered_other_attributes[i].value.trim() + "'")

    text += "]"
  }

  // tag name 'div' is optional when there are any attributes
  if (tagName != "div")
    text = tagName + text
  else if (!text.length) {
    text = tagName + text
  }

  return "\"" + text + "\""
}

// make_attributes returns binding attributes and events object (as string)
// or empty string if there is no attributes
function make_attributes(fragment) {
  var text = ""

  // get only attributes that begin with ":"
  var filtered_attributes = []
  for (var i = 0, len = fragment.attrs.length; i < len; i++) {
    var attr_first_char = fragment.attrs[i].name[0]
    if (attr_first_char == ":") {
      filtered_attributes.push(fragment.attrs[i])
    }
  }

  for (var i = 0, len = filtered_attributes.length; i < len; i++) {

    var attr_first_char = filtered_attributes[i].name[0]
    if (attr_first_char == ":") {
      var cur_attr_name = filtered_attributes[i].name
      var cur_attr_value = filtered_attributes[i].value

      text += cur_attr_name.substr(1) + ":" + cur_attr_value

      if (i < len - 1)
        text += ","
    }
  }

  if (text.length)
    text = "{" + text + "}"

  return text
}

// text, interpolation etc
function make_text(fragment) {
  var text = fragment.value.trim().replace(/\s+/g, ' ')

  // escape javascript code
  text = text.replace(/\\/g, "\\\\").replace(/\"/g, '\\"')

  text = "\"" + text + "\""

  // interpolation
  text = text.replace(/{{[\s\S]*?}}/g, function (match, offset, str) {
    var text = ""

    // unescape escaped
    match = match.replace(/\\"/g, '"').replace(/\\\\/g, "\\")

    if (offset > 1)
      text += "\"+"
    else
      text += "\""

    var val = match.substr(2, match.length - 4).trim()
    if (/[\-+*\/%?:()]/i.test(val))
      text += "(" + val + ")"
    else
      text += val

    if (match.length + offset + 1 == str.length)
      text += "\""
    else
      text += "+\""

    return text
  }).replace(/\+\"\"\+/g, "+").replace(/^\"\"/, "").replace(/\"\"$/, "")

  if (text.substr(0, 2) == "\"\"") {
    text = text.substr(1)
  }

  if (text.substr(-2) == "\"\"" &&
    text.substr(-3, 1) != "\\"
  ) {
    text = text.substr(0, text.length - 1)
  }

  return text
}

function make_m(fragment, first_run) {
  // keep only non empty nodes
  var filtered_elements = filter_node(fragment)
  var compiled = ""


  // if there are only empty nedes just return empty string
  if (filtered_elements.length == 0)
    return ""

  // add first square brackets
  if (filtered_elements.length > 1 && first_run)
    compiled += "["

  var directived = ""
  var close_tags = ""

  for (var i = 0, len = filtered_elements.length; i < len; i++) {
    if (typeof (filtered_elements[i].tagName) !== 'undefined') {
      // process directives
      directived = make_directives(filtered_elements[i], i)
      close_tags = directived[1]
      directived = directived[0]

      if (directived.length)
        compiled += directived

      // add selector
      compiled += "m(" + make_selector(filtered_elements[i])

      // add attributes 
      var attributes = make_attributes(filtered_elements[i])
      if (attributes.length > 0)
        compiled += "," + attributes

      if (typeof (filtered_elements[i].childNodes) !== 'undefined') {
        var maked = make_m(filtered_elements[i].childNodes, false)
        if (maked.length)
          compiled += "," + maked
      }

      compiled += ")"

      // close directive
      if (directived.length)
        compiled += close_tags

    } else if (filtered_elements[i].nodeName == "#text") { // process as text- interpolations etc.
      compiled += make_text(filtered_elements[i])
    } else {
      continue
    }

    if (i < len - 1 && close_tags.substr(close_tags.length - 1) != ":")
      compiled += ","
  }

  // add second square brackets
  if (filtered_elements.length > 1 && first_run)
    compiled += "]"

  return compiled
}

module.exports = function (source) {
  source = source.trim()
  var parsed = parse5.parseFragment(source)

  var minified = UglifyJS.minify("var f=" + make_m(parsed.childNodes, true), {
    mangle: {
      reserved: ['m']
    }
  }).code

  return minified.substring(6, minified.length - 1)
}
