const params = new URLSearchParams(location.search);

if (params.has("markup")) {
    const markup = params.get("markup");
    const container = document.querySelector("#container");
    container.innerHTML = markup;
} else if (params.has("code")) {
    const code = params.get("code");
    const func = Function(code);
    func();
}
