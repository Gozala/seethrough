var assert = require("test/assert"),
    Template = require("seethrough/seethrough").Template;

exports["test - sample"] = function() {
    var src = '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:st="http://hyperstruct.net/seethrough#js">'
        + '<head><title st:content="site.title"/></head>'
        + '<body><h1>Welcome to <span st:replace="site.title"/>!</h1></body>'
        + '</html>';
    var data = {
        site: {
            title: 'FooBar'
        }
    };
    var result = '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:st="http://hyperstruct.net/seethrough#js">'
            + '<head><title>FooBar</title></head>'
            + '<body><h1>Welcome to FooBar!</h1></body>'
            + '</html>';
    assert.isEqual(new Template(src).render(data), result);
};
exports["test - content"] = function() {
    var src = '<div xmlns:st="http://hyperstruct.net/seethrough#js" st:content="meta.title"/>';
    var data = {
        meta: {
            title: "Hello, world!"
        }
    };
    var result = '<div xmlns:st="http://hyperstruct.net/seethrough#js">Hello, world!</div>';
    assert.isEqual(new Template(src).render(data), result);
};
exports["test - replace"] = function() {
    var src = '<div xmlns:st="http://hyperstruct.net/seethrough#js"><span st:replace="meta.title"/></div>';
    var data = {
        meta: {
            title: 'Hello, world!'
        }
    };
    var result = '<div xmlns:st="http://hyperstruct.net/seethrough#js">Hello, world!</div>';
    assert.isEqual(new Template(src).render(data), result);
}
exports["test - disable"] = function() {
    var src = '<div xmlns:st="http://hyperstruct.net/seethrough#js"><span st:disable="true">Hello, world!</span></div>';
    var data = {};
    var result = '<div xmlns:st="http://hyperstruct.net/seethrough#js"></div>';
    assert.isEqual(new Template(src).render(data), result);
}
exports["test - loop"] = function() {
    var src = '<ul xmlns:st="http://hyperstruct.net/seethrough#js"><li st:loop="person people"><span st:replace="person"/></li></ul>';
    var data = {
        people: ['jim', 'spock', 'mccoy']
    };
    var result = '<ul xmlns:st="http://hyperstruct.net/seethrough#js"><li>jim</li><li>spock</li><li>mccoy</li></ul>';
    assert.isEqual(new Template(src).render(data), result);
}
exports["test - condition"] = function() {
    var src = '<div xmlns:st="http://hyperstruct.net/seethrough#js"><span st:condition="flag1">I will be here</span>'
            + '<span st:condition="flag2">I probably will not</span></div>';
    var data = {
        flag1: true,
        flag2: false
    };
    var result = '<div xmlns:st="http://hyperstruct.net/seethrough#js"><span>I will be here</span></div>';
    assert.isEqual(new Template(src).render(data), result);
}
exports["test - attribute"] = function() {
    var src = '<div xmlns:st="http://hyperstruct.net/seethrough#js"><div><st:attr name="foo">bar</st:attr></div></div>';
    var data = {};
    var result = '<div xmlns:st="http://hyperstruct.net/seethrough#js"><div foo="bar"/></div>';
    assert.isEqual(new Template(src).render(data), result);
}
exports["test - empty attribute"] = function() {
    var src = '<div xmlns:st="http://hyperstruct.net/seethrough#js"><div><st:attr name="foo"></st:attr></div></div>';
    var data = {};
    var result = '<div xmlns:st="http://hyperstruct.net/seethrough#js"><div/></div>';
    assert.isEqual(new Template(src).render(data), result);
}
exports["test - attribute on looping item"] = function() {
    var src = '<div xmlns:st="http://hyperstruct.net/seethrough#js"><ol><li st:loop="item items">'
            + '<st:attr name="_id"><span st:replace="item._id"/></st:attr><span st:replace="item.name"/>'
            + '</li></ol></div>';
    var data = {
        items: [
            { _id: 1, name: 'foo' },
            { _id: 2, name: 'bar' }
        ]
    };
    var result = '<div xmlns:st="http://hyperstruct.net/seethrough#js"><ol><li _id="1">foo</li><li _id="2">bar</li></ol></div>';
    assert.isEqual(new Template(src).render(data), result);
}
exports["test - handle comments"] = function() {
    var src = '<head><!-- [if lt IE 8]>\n'
            + '<script type="text/javascript" src="/static/IE8.js"> </script>\n'
            + '<![endif]-->\n'
            + '</head>';
    var data = {};
    var result = '<head><!-- [if lt IE 8]>\n'
            + '<script type="text/javascript" src="/static/IE8.js"> </script>\n'
            + '<![endif]-->\n'
            + '</head>';
    assert.isEqual(new Template(src).render(data), result);
}
exports["test - preserve spaces"] = function() {
    var src = '<head><script> </script></head>';
    var data = {};
    var result = '<head><script> </script></head>';
    assert.isEqual(new Template(src).render(data), result);
}
exports["test - empty children"] = function() {
    var src = '<div xmlns:st="http://hyperstruct.net/seethrough#js"><head/></div>';
    var data = {};
    var result = '<div xmlns:st="http://hyperstruct.net/seethrough#js"><head/></div>';
    assert.isEqual(new Template(src).render(data), result);
}
exports["dis test - big loops"] = function() {
    var src = '<ul xmlns:st="http://hyperstruct.net/seethrough#js"><li st:loop="number numbers"><span st:replace="number"/></li></ul>';
    var data = {
        numbers: (function() {
            var result = [];
            for (var i=0; i <= 10000; i++) result.push(i);
            return result;
        })()
    };
    var result = '<ul xmlns:st="http://hyperstruct.net/seethrough#js">'
                + data.numbers.map(function(number) {
                    return "<li>" + number + "</li>";
                }).join("")
                + '</ul>';
    assert.isEqual(new Template(src).render(data), result);

}
exports["test - preserving xml header"] = function() {
    var src = "<?xml version=\"1.0\"?>\n"
            + "<note xmlns:st=\"http://hyperstruct.net/seethrough#js\">\n"
            + "\t<to st:content=\"to\">Elene</to>\n"
            + "\t<from st:content=\"from\">Gozala</from>\n"
            + "\t<heading st:condition=\"hasHeader\">Reminder</heading>\n"
            + "\t<body st:content=\"text\"></body>\n"
            + "</note>";
    var data = {
        to: "Elene",
        from: "Gozala",
        text: "Don't forget me this weekend!"
    };
    var result = "<?xml version=\"1.0\"?>\n"
            + "<note xmlns:st=\"http://hyperstruct.net/seethrough#js\">\n"
            + "\t<to>Elene</to>\n"
            + "\t<from>Gozala</from>\n"
            + "\t\n"
            + "\t<body>Don't forget me this weekend!</body>\n"
            + "</note>";
    assert.isEqual(new Template(src).render(data), result);
}
exports["test - preserving xhtml doctypes"] = function() {
    var src = "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\"\n"
            + "\t\"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">\n\n"
            + "\t<html xmlns=\"http://www.w3.org/1999/xhtml\" xmlns:st=\"http://hyperstruct.net/seethrough#js\" "
            + "lang=\"en-US\" xml:lang=\"en-US\">\n"
            + "\t\t<head>\n"
            + "\t\t\t<title>simple document</title>\n"
            + "\t\t</head>\n"
            + "\t<body st:content=\"text\">Buy HTML!!</body>\n"
            + "</html>";
    var data = {
        text: "Hello XHTML!!"
    };
    var result = "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\"\n"
            + "\t\"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">\n\n"
            + "\t<html xmlns=\"http://www.w3.org/1999/xhtml\" xmlns:st=\"http://hyperstruct.net/seethrough#js\" "
            + "lang=\"en-US\" xml:lang=\"en-US\">\n"
            + "\t\t<head>\n"
            + "\t\t\t<title>simple document</title>\n"
            + "\t\t</head>\n"
            + "\t<body>Hello XHTML!!</body>\n"
            + "</html>";
    assert.isEqual(new Template(src).render(data), result);
}

if (module.id == require.main)
    require('os').exit(require('test/runner').run(exports));

