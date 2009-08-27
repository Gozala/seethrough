function getProperty(object, path) {
    path.split(".").forEach(function(key) {
        object = object ? object[key] : object;
    })
    if (object instanceof XML) return object.toString();
    return object;
}

exports["http://hyperstruct.net/seethrough#js::attr"] = function() {
    // Apparently, an xml attribute object cannot be created by
    // itself, so we use a dummy element as attribute "factory".
    // Also, we want to create this element just once, not every
    // time we need to generate an attribute.
    var dummy = <dummy/>;
    return function stAttr(element, env, children) {
        dummy.@[element.@name] = children(env).toString();
        return dummy.@[element.@name];
    };
};
exports["http://hyperstruct.net/seethrough#js::condition"] = function(attrValue) {
    return function stCondition(element, env, children) {
        if(getProperty(env, attrValue))
            return element.appendChild(children(env));
        else
            return new XML('');
    };
};
exports["http://hyperstruct.net/seethrough#js::disable"] = function(attrValue) {
    return function stDisable(element, env, children) {
        return attrValue == 'true' ? new XML('') : element;
    }
};
exports["http://hyperstruct.net/seethrough#js::replace"] = function(attrValue) {
    return function stReplace(element, env, children) {
        var envValue = getProperty(env, attrValue);
        switch(typeof(envValue)) { // this should belong in
        case "undefined":
        case 'number':
        case 'string':
            return <dummy>{envValue || ""}</dummy>.text();
        case 'xml':
            return envValue;
        default:
            throw new TypeError('Unhandled type for "' + attrValue + " = " + envValue + '" (' + typeof(envValue) + ')');
        }
    }
};
exports["http://hyperstruct.net/seethrough#js::inspect"] = function(attrValue) {
    return function stInspect(element, env, children) {
        var envValue = getProperty(env, attrValue);
        var representation;
        switch(typeof(envValue)) {
        case 'number':
        case 'string':
            representation = envValue;
            break;
        case 'xml':
            representation = envValue.toXMLString();
            break;
        case 'object':
            representation = envValue.toSource();
            break;
        default:
            throw new TypeError('Unhandled type for "' +
                                envValue +
                                '" (' + typeof(envValue) + ')');
        }
        // Force escaping
        return <dummy>{representation}</dummy>.text();
    }
};
exports["http://hyperstruct.net/seethrough#js::content"] = function(attrValue) {
    return function(element, env, children) {
        return element.appendChild(getProperty(env, attrValue));
    }
};
exports["http://hyperstruct.net/seethrough#js::xmlstring"] = function(attrValue) {
    return function(element, env, children) {
        return element.appendChild(new XMLList(getProperty(env, attrValue)));
    }
};
exports["http://hyperstruct.net/seethrough#js::exec"] = function(attrValue) {
    return function(element, env, children) {
        with(env) result = eval(attrValue);
        return element.appendChild(new XMLList(result.toString()));
    }
};

//exports["http://hyperstruct.net/seethrough#js::extra"] = function(attrValue, children) {
//  return function(element, env) {
//      return element.appendChild(getProperty(env, attrValue));
//  }
//};

exports["http://hyperstruct.net/seethrough#js::loop"] = function(attrValue) {
    var [iterName, collectionName] = attrValue.split(' ');
    return function stLoop(element, env, children) {
        var container = new XMLList();
        if(iterName in env)
            throw new Error('Overriding global name not yet supported.');

        // XXX copied from compile.element -- factor! cleanup!

        var collection = getProperty(env, collectionName);
        collection.forEach(function(envValue) {
            env[iterName] = envValue;

            var xmlOut = element.copy();

            var xmlChildren = children(env);
            if(typeof(xmlChildren) == 'undefined')
                return xmlOut;

            var xmlChild;
            for(var i=0,l=xmlChildren.length(); i<l; i++) {
                xmlChild = xmlChildren[i];
                if(xmlChild.nodeKind() == 'attribute')
                    xmlOut.@[xmlChild.name()] = xmlChild.toString();
                else
                    xmlOut.appendChild(xmlChild);
            }

            container += xmlOut;
        });

        delete env[iterName];
        return container;
    }
};
exports["http://hyperstruct.net/seethrough#js::eval"] = function() {
    return function stEval(element, env, children) {
        return new XML(eval(children(env).toString()));
    }
};

