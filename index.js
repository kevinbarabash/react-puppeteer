const params = new URLSearchParams(location.search);
const markup = params.get("markup");

document.body.innerHTML = markup;
// console.log(params.get("markup"));
