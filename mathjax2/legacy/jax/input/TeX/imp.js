/*************************************************************
 *
 *  MathJax/jax/input/TeX/imp.js
 *  
 *  Implements the TeX InputJax that reads mathematics in
 *  TeX and LaTeX format and converts it to the MML ElementJax
 *  internal format.
 *
 *  ---------------------------------------------------------------------
 *  
 *  Copyright (c) 2009-2017 The MathJax Consortium
 * 
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */


// Intermediate parser namespace
var imp = {};
console.log("Loading imp!");

imp.NEW = false;
imp.MML = null;
imp.factory = null;
imp.visitor = null;
imp.attrs = ['autoOP',
             'fnOP',
             'movesupsub',
             'subsupOK',
             'texprimestyle',
             'useHeight',
             'variantForm',
             'texWithDelims'
            ];
imp.methodOut = true;
imp.defOut = false;
imp.jsonOut = false;
imp.simpleOut = false;



imp.createNode = function(type, children, def, text) {
  if (imp.NEW) {
    var node = imp.factory.create(type, def, children);
    if (text) {
      node.appendChild(text);
    }
    // TODO: Separate properties from proper attributes.
    node.attributes.setList(def);
  } else {
    console.log(imp.MML);
    node = (typeof text === 'undefined') ?
      imp.MML[type].apply(imp.MML, children).With(def) :
      imp.MML[type](text).With(def);
  }
  imp.printDef(def);
  imp.printJSON(node);
  return node;
};
  

imp.createText = function(text) {
  if (text == null) {
    return null;
  }
  var node = imp.NEW ? imp.factory.create('text').setText(text) : imp.MML.chars(text);
  imp.printJSON(node);
  return node;
};


imp.createEntity = function(code) {
  return imp.createText(String.fromCharCode(parseInt(code,16)));
};

imp.appendChildren = function(node, children) {
  if (imp.NEW) {
    for (let child of children) {
      node.appendChild(child);
    }
  } else {
    node.Append.apply(node, children);
  }
};


imp.setAttribute = function(node, attribute, value) {
  if (imp.NEW) {
    node.attributes.set(attribute, value);
  } else {
    node[attribute] = value;
  }
};


// Sets properties and attributes.
imp.setProperties = function(node, properties) {
  if (imp.NEW) {
    for (const name of Object.keys(properties)) {
      node.setProperty(name, properties[name]);
    }
  } else {
    node.With(properties);
  }
};


imp.getProperty = function(node, property) {
  return imp.NEW ? node.getProperty(property) : node[property];
};


imp.getChildAt = function(node, position) {
  return imp.NEW ? node.getChildren()[position] : node.data[position];
};


imp.setData = function(node, position, item) {
  if (imp.NEW) {
    // Here we assume that everything in data are actually proper nodes!
    node.childNodes[position] = item;
    item.parent = node;
    // for (let child of node.childNodes) {
    //   if (child) {console.log(child.parent)};
    // }
  } else {
    node.SetData(position, item);
  }
};

imp.isType = function(node, type) {
  return imp.NEW ? node.isKind(type) : node.type === type;
};

imp.isClass = function(node, type) {
  return imp.NEW ? node.isKind(type) : node.isa(imp.MML[type]);
};

imp.isEmbellished = function(node) {
  return imp.NEW ? node.isEmbellished : node.isEmbellished();
};

imp.getTexClass = function(node) {
  return imp.NEW ? node.texClass : node.Get('texClass');
};

imp.getCore = function(node) {
  return imp.NEW ? node.core() : node.Core();
};

imp.getCoreMO = function(node) {
  return imp.NEW ? node.coreMo() : node.CoreMO();
};


imp.cleanSubSup = function(node) {
  let rewrite = [];
  node.walkTree((n, d) => {
    const children = n.childNodes;
    if ((n.kind === 'msubsup' && (!children[n.sub] || !children[n.sup])) ||
        (n.isKind('munderover') && (!children[n.under] || !children[n.over]))) {
      d.unshift(n);
    }
  }, rewrite);
  for (const n of rewrite) {
    const children = n.childNodes;
    const parent = n.parent;
    let newNode = (n.isKind('msubsup')) ?
          (children[n.sub] ?
           imp.createNode('msub', [children[n.base], children[n.sub]], {}) :
           imp.createNode('msup', [children[n.base], children[n.sup]], {})) :
        (children[n.under] ?
         imp.createNode('munder', [children[n.base], children[n.under]], {}) :
         imp.createNode('mover', [children[n.base], children[n.over]], {}));
    if (parent) {
      parent.replaceChild(newNode, n);
    } else {
      node = newNode;
    }
  }
  return node;
};

imp.printSimple = function(txt) {
  if (imp.simpleOut) {
    console.log(txt);
  }
};

imp.untested = function(kind) {
  console.log("Untested case " + kind);
};

imp.printMethod = function(text) {
  if (imp.methodOut) {
    console.log("In " + text);
  }
};

imp.printNew = function(node) {
  console.log(imp.visitor.visitNode(node));
};

imp.printOld = function(node) {
  var mmlNode = node.toMmlNode(imp.factory);
  console.log(imp.visitor.visitNode(mmlNode));  
};


imp.printJSON = function(node) {
  if (imp.jsonOut) {
    if (imp.NEW) {
      imp.printNew(node);
    } else {
      imp.printOld(node);
    }
  }
};

imp.printDef = function(def) {
  if (imp.methodOut && imp.defOut) {
    console.log("With:");
    for (var x in def) {
      console.log(x + ": " + def[x]);
    }
  }
};

export {imp};