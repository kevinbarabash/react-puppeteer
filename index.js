const params = new URLSearchParams(location.search);

if (params.has("markup")) {
    const markup = params.get("markup");
    const container = document.querySelector("#container");
    container.innerHTML = markup;
} else if (params.has("code")) {
    const code = params.get("code");
    const func = Function(code);
    func();
} else if (params.has("react")) {
    const react = params.get("react");
    const funcBody = `ReactDOM.render(${react.slice(0, -1)}, document.querySelector("#container"));`;
    const func = Function(funcBody);
    func();
}
