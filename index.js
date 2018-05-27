const params = new URLSearchParams(location.search);

if (params.has("test")) {
    const test = params.get("test");
    const script = document.createElement('script');
    script.setAttribute('src', `/tests/${test}`);
    script.setAttribute('type', 'module');
    document.body.appendChild(script);
}