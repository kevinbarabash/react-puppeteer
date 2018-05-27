const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const babel = require("babel-core");
const babylon = require("babylon");
const t = require("babel-types");
const traverse = require("babel-traverse").default;

const port = 4444;

const preprocessImports = (data) => {
  // TODO: make these replacements more robust
  const lines = data.split("\n").map(line => {
    if (line.endsWith(`from "react";`)) {
      return ""; // React is a global in the test environment
    } else if (line.endsWith(`from "react-dom";`)) {
      return ""; // ReactDOM is a global in the test environment
    } else if (line.endsWith(`from "aphrodite";`)) {
      // aphrodite is global
      return line.replace("import", "const").replace(`from "aphrodite"`, '= aphrodite;');
    } else {
      return line;
    }
  });
  return lines.join("\n");
};

const injectImports = (ast) => {
  const customComponents = [];
        
  traverse(ast, {
    enter(path) {
      // console.log(path);
      if (path.isJSXIdentifier()) {
        if (/^[A-Z]/.test(path.node.name) && path.parent.type === "JSXOpeningElement") {
          customComponents.push(path.node.name);
        }
      }
    }
  });

  ast.program.body = [
    ...customComponents.map(identifier => 
      t.importDeclaration(
        [
          t.importDefaultSpecifier(t.identifier(identifier))
        ],
        t.stringLiteral(componentFileMap[identifier]),
      )
    ),
    ...ast.program.body,
  ];
}

const maybeWrapLastJsxStatement = ast => {
  const lastStatement = ast.program.body[ast.program.body.length - 1];
  const isJSXElement = lastStatement.expression &&
    lastStatement.expression.type === "JSXElement";

  if (!isJSXElement) {
    return;
  }

  const wrappedStatement = t.callExpression(
    t.memberExpression(
      t.identifier("ReactDOM"),
      t.identifier("render"),
    ),
    [
      lastStatement.expression,
      t.callExpression(
        t.memberExpression(
          t.identifier("document"),
          t.identifier("querySelector"),
        ),
        [
          t.stringLiteral("#container"),
        ],
      ),
      t.arrowFunctionExpression(
        [], 
        t.callExpression(
          t.memberExpression(
            t.memberExpression(
              t.callExpression(
                t.memberExpression(
                  t.identifier("document"),
                  t.identifier("querySelector"),
                ),
                [t.stringLiteral("#container")],
              ),
              t.identifier("classList"),
            ),
            t.identifier("add"),
          ),
          [t.stringLiteral("complete")],
        ),
      ),
    ],
  );

  ast.program.body = [...ast.program.body.slice(0, -1), wrappedStatement];
};

// TODO: rewrite using async/await

const requestHandler = (req, res) => {
  const {pathname} = url.parse(req.url);
  if (pathname === "/") {
    fs.readFile("index.html", "utf8", (err, data) => {
      res.writeHead(200, {
        "Content-Length": data.length,
        "Content-Type": "text/html"
      });
      res.write(data);
      res.end();
    });
  } else {
    const filename = path.join(__dirname, pathname.slice(1));
    fs.exists(filename, exists => {
      if (exists) {
        fs.readFile(filename, "utf8", (err, data) => {
          data = preprocessImports(data);

          const ast = babylon.parse(data, {
            plugins: ["jsx", "flow"],
            sourceType: "module"
          });

          injectImports(ast);
          maybeWrapLastJsxStatement(ast);

          const output = babel.transformFromAst(ast, data, {
            presets: ["react"]
          });
          const code = output.code;
          res.writeHead(200, {
            "Content-Length": code.length,
            "Content-Type": "application/javascript"
          });
          res.write(code);
          res.end();
        });
      } else {
        // TODO: raise 404
      }
    });
  }
  console.log(pathname);
};

const componentFileMap = {};

// TODO: recursively find components
fs.readdir("components", (err, files) => {
  if (err) {
    console.err("couldn't read components");
    process.exit(1);
  }

  files.forEach(file => {
    const src = fs.readFileSync(path.join("components", file), "utf8");
    const match = src.match(/export default class ([^ ]+)/);
    componentFileMap[match[1]] = path.join("../components", file);
  });

  console.log("Found components");
  console.log(componentFileMap);

  const server = http.createServer(requestHandler);

  server.listen(port, err => {
    if (err) {
      return console.log("something bad happened", err);
    }
    console.log(`server is listening on ${port}`);
  });
});
