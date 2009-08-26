exports["test - Seethrough"] = require("./seethrough-tests");
if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));

