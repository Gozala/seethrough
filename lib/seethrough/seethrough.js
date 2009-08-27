/*
 * Copyright 2008 by Massimiliano Mirra
 *
 * This file is part of seethrough.
 *
 * seethrough is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the
 * Free Software Foundation; either version 3 of the License, or (at your
 * option) any later version.
 *
 * SamePlace is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * The interactive user interfaces in modified source and object code
 * versions of this program must display Appropriate Legal Notices, as
 * required under Section 5 of the GNU General Public License version 3.
 *
 * In accordance with Section 7(b) of the GNU General Public License
 * version 3, modified versions must display the "Powered by SamePlace"
 * logo to users in a legible manner and the GPLv3 text must be made
 * available to them.
 *
 * Author: Massimiliano Mirra, <bard [at] hyperstruct [dot] net>
 * Contributors: Irakli Gozalishvili <rfobic [at] gmail [dot] com>
 */
var Log = new (require("logger").Logger)({write: system.print});
var Processors = require("seethrough/processors");

// DEVELOPMENT UTILITIES
// ----------------------------------------------------------------------

function d(msg) {
    if(!d.on)
        return;

    if(!arguments.callee.printFn) {
        if(typeof(print) == 'function')
            // command-line spidermonkey
            arguments.callee.printFn = print;
        else if(typeof(app) == 'object' &&
                typeof(app.log) == 'function')
            // helma
            arguments.callee.printFn = function(s) { app.log(s) };
        else
            arguments.callee.printFn = function() {};
    }

    var output;
    var stack = (new Error()).stack;
    if(stack)
        output = stack.split('\n')[2] + ':' + msg;
    else
        output = msg;

    arguments.callee.printFn(output);
}
d.on = false;


function Template(source, element) {
    XML.ignoreComments = false;
    XML.ignoreWhitespace = false;
    XML.prettyPrinting = false;
    source = /(^[\s\S]*?(?=\<[A-Za-z]))([\s\S]*>(?=[^\>]*$))/.exec(source.toString());
    this.header = !element ? source[1] : "";
    var xml = new XML(source[2]);
    this.body = element ? xml..*.(@id == element)[0] : xml;
}
Template.prototype = {
    /**
     * Template headers like doctype etc..
     * @type {String}
     */
    header: null,
    /**
     * Body of the template. Part that will be used for
     * content rendering
     * @type {XML}
     */
    body: null,
    build: function(data) {
        this.build = this.compile();
        return this.build(data);
    },
    /**
     * Renders data template from the data
     */
    render: function render(data) {
        return this.header + this.build(data).toXMLString();
    },
    /**
     * Compiles this template
     */
    compile: function(source) {
        source = source || this.body;
        if (source instanceof XMLList) {
            d('  - Compiling children');
            var children = [];
            for each(var child in source) {
                children.push(this.compile(child));
            }
            return (function(children, data) {
                d('  * Rendering children')
                var outChildren = new XMLList();
                children.forEach(function(child) {
                    outChildren += child(data);
                });
                return outChildren;
            }).bind(this, children);
        } else if (source instanceof XML) {
            switch(source.nodeKind()) {
                case "element":
                    var xmlBase = source.copy();
                    delete xmlBase.*::*;
                    return (function renderElement(source, processors, children, data) {
                        var xmlOut = source.copy();
                        d('* Rendering ' + xmlOut.name());
                        if (processors.length > 0)
                            processors.forEach(function(processor) {
                                xmlOut = processor(xmlOut, data, children);
                            });
                        else {
                            var xmlChildren = children(data);
                            if (typeof xmlChildren != "undefined")
                                for (var i=0,l=xmlChildren.length(); i<l; i++) {
                                    var xmlChild = xmlChildren[i];
                                    if (xmlChild.nodeKind() == 'attribute') xmlOut.@[xmlChild.name()] = xmlChild.toString();
                                    else xmlOut.appendChild(xmlChild);
                                }
                        }
                        return xmlOut;
                    }).bind(this, xmlBase, this.makeProcessors(source), this.compile(source.children()));
                    break;
                case "text":
                case "comment":
                    return (function(source, data) {
                        return source;
                    }).bind(this, source);
                    break;
                default:
                    throw new Error('Compile error: unhandled node kind. (' + xml.nodeKind() + ')');
            }
        }
    },
    makeProcessors: function(element) {
        var processors = [];
        // Handle attributes
        for each(var attribute in element.@*::*) {
            var processor = Processors[attribute.name().toString()];
            if (processor) processors.push((function(process, ns, name, element, data, children) {
                delete element.@ns::[name];
                return process(element, data, children);
            }).bind(null, processor(attribute), attribute.namespace(), attribute.localName()));
        }
        // Handle tag
        var processor = Processors[element.name().toString()];
        if (processor) processors.push(processor());

        return processors;
    }
};
exports.Template = Template;