const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const babel = require("babel-core");
const babylon = require("babylon");

const port = 4444;

const wrapLastJsxStatement = ast => {
  const lastStatement = ast.program.body[ast.program.body.length - 1];
  const wrappedStatement = {
    type: "CallExpression",
    callee: {
      type: "MemberExpression",
      object: { type: "Identifier", name: "ReactDOM" },
      property: { type: "Identifier", name: "render" }
    },
    arguments: [
      lastStatement.expression,
      {
        type: "CallExpression",
        callee: {
          type: "MemberExpression",
          object: { type: "Identifier", name: "document" },
          property: { type: "Identifier", name: "querySelector" }
        },
        arguments: [
          {
            type: "StringLiteral",
            value: "#container"
          }
        ]
      }
    ]
  };

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
          data = lines.join("\n");
          const ast = babylon.parse(data, {
            plugins: ["jsx", "flow"],
            sourceType: "module"
          });
          const lastStatement = ast.program.body[ast.program.body.length - 1];
          if (
            lastStatement.expression &&
            lastStatement.expression.type === "JSXElement"
          ) {
            wrapLastJsxStatement(ast);
          }
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
        // raise 404
      }
    });
  }
  console.log(pathname);
};

const server = http.createServer(requestHandler);

server.listen(port, err => {
  if (err) {
    return console.log("something bad happened", err);
  }
  console.log(`server is listening on ${port}`);
});
