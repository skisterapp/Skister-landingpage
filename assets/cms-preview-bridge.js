(function () {
    if (new URLSearchParams(location.search).get('cmsPreview') !== '1') return;

    function handlePreviewMessage(data) {
        if (!data || data.type !== 'skister-cms-preview') return;
        if (typeof window.skisterCmsApplyPreview === 'function') {
            window.skisterCmsApplyPreview(data);
            return;
        }
        window.__skisterCmsPreviewQueue = window.__skisterCmsPreviewQueue || [];
        window.__skisterCmsPreviewQueue.push(data);
    }

    window.addEventListener('message', function (event) {
        if (event.origin !== location.origin) return;
        handlePreviewMessage(event.data);
    });

    window.parent.postMessage({ type: 'skister-cms-preview-ready' }, location.origin);
})();
