(function () {
    var key = 'theme';
    var stored = localStorage.getItem(key);
    var theme = stored === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);

    window.addEventListener('storage', function (event) {
        if (event.key !== key) return;
        var next = event.newValue === 'dark' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
    });
})();
