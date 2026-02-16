// Image debug panel - tap the bug icon to see image loading diagnostics
// Remove this file and its <script> tag from index.html when done debugging

(function() {
    // Separate logs: pinned (important) and stream (card images)
    var pinnedLog = [];
    var streamLog = [];
    var maxStream = 50;
    var panel = null;
    var logEl = null;
    var btnEl = null;
    var visible = false;
    var imgStats = { total: 0, loaded: 0, failed: 0, fallback: 0 };

    function addPinned(type, msg) {
        var time = new Date().toLocaleTimeString();
        pinnedLog.push('[' + time + '] ' + type + ': ' + msg);
        updatePanel();
    }

    function addStream(type, msg) {
        var time = new Date().toLocaleTimeString();
        streamLog.push('[' + time + '] ' + type + ': ' + msg);
        if (streamLog.length > maxStream) streamLog.shift();
        if (type === 'FAIL') imgStats.failed++;
        if (type === 'OK') imgStats.loaded++;
        if (type === 'LOAD') imgStats.total++;
        updatePanel();
    }

    // Global logger - logos go to pinned, cards go to stream
    window._imgDebug = function(type, msg) {
        if (type.indexOf('LOGO') !== -1 || type.indexOf('TEST') !== -1 || type.indexOf('INIT') !== -1 || type.indexOf('INFO') !== -1 || type.indexOf('SCAN') !== -1) {
            addPinned(type, msg);
        } else {
            addStream(type, msg);
        }
    };

    function updatePanel() {
        if (!logEl || !visible) return;
        var statsLine = 'Cards: ' + imgStats.total +
            ' loaded | ' + imgStats.failed + ' failed\n';
        var pinnedSection = pinnedLog.length > 0
            ? '=== LOGO & SYSTEM ===\n' + pinnedLog.join('\n') + '\n\n'
            : '=== LOGO & SYSTEM ===\n(none yet)\n\n';
        var streamSection = '=== CARD IMAGES (last ' + maxStream + ') ===\n' +
            (streamLog.length > 0 ? streamLog.slice().reverse().join('\n') : '(none yet)');
        logEl.textContent = statsLine + '\n' + pinnedSection + streamSection;
    }

    function scanLogos() {
        addPinned('SCAN', '--- Scanning all set button logos ---');

        // Custom set buttons
        var customBtns = document.querySelectorAll('#customSetButtons .set-btn');
        addPinned('SCAN', 'Custom set buttons found: ' + customBtns.length);
        customBtns.forEach(function(btn) {
            var img = btn.querySelector('.set-btn-logo');
            var fallback = btn.querySelector('.set-btn-logo-fallback');
            var setKey = btn.getAttribute('data-custom-set-key') || '?';
            if (img) {
                var cs = window.getComputedStyle(img);
                addPinned('SCAN', setKey +
                    '\n  src: ' + (img.getAttribute('src') || '(none)') +
                    '\n  complete: ' + img.complete +
                    '\n  naturalW: ' + img.naturalWidth + ' naturalH: ' + img.naturalHeight +
                    '\n  inline display: ' + img.style.display +
                    '\n  computed display: ' + cs.display +
                    '\n  computed visibility: ' + cs.visibility +
                    '\n  computed opacity: ' + cs.opacity +
                    '\n  computed position: ' + cs.position +
                    '\n  offsetW: ' + img.offsetWidth + ' offsetH: ' + img.offsetHeight +
                    '\n  fallback display: ' + (fallback ? fallback.style.display : 'N/A') +
                    '\n  fallback computed: ' + (fallback ? window.getComputedStyle(fallback).display : 'N/A'));
            } else {
                addPinned('SCAN', setKey + ': NO img.set-btn-logo found!');
            }
        });

        // Also check header character images for comparison
        var headerImgs = document.querySelectorAll('.pokemon-char');
        addPinned('SCAN', 'Header character images: ' + headerImgs.length);
        headerImgs.forEach(function(img) {
            var cs = window.getComputedStyle(img);
            addPinned('SCAN', 'header: ' + img.alt +
                '\n  src: ' + img.getAttribute('src') +
                '\n  complete: ' + img.complete +
                '\n  naturalW: ' + img.naturalWidth +
                '\n  computed display: ' + cs.display +
                '\n  offsetW: ' + img.offsetWidth);
        });

        updatePanel();
    }

    function createPanel() {
        // Toggle button
        btnEl = document.createElement('div');
        btnEl.innerHTML = '<span style="font-size:20px">&#128027;</span>';
        btnEl.style.cssText = 'position:fixed;bottom:12px;right:12px;z-index:100000;width:44px;height:44px;border-radius:50%;background:#1a1a2e;border:2px solid #444;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.5);-webkit-tap-highlight-color:transparent';
        btnEl.onclick = function() {
            visible = !visible;
            panel.style.display = visible ? 'flex' : 'none';
            if (visible) updatePanel();
        };
        document.body.appendChild(btnEl);

        // Panel
        panel = document.createElement('div');
        panel.style.cssText = 'display:none;position:fixed;bottom:64px;left:8px;right:8px;max-height:60vh;z-index:100000;background:#0d0d1a;border:1px solid #333;border-radius:10px;flex-direction:column;box-shadow:0 4px 20px rgba(0,0,0,0.7);font-family:monospace';

        // Header with buttons
        var header = document.createElement('div');
        header.style.cssText = 'display:flex;gap:6px;align-items:center;padding:8px 12px;border-bottom:1px solid #333;flex-shrink:0;flex-wrap:wrap';
        header.innerHTML = '<span style="color:#4fc3f7;font-weight:bold;font-size:13px">Debug</span>';

        // Scan button
        var scanBtn = document.createElement('button');
        scanBtn.textContent = 'Scan Logos';
        scanBtn.style.cssText = 'background:#e65100;color:#fff;border:none;border-radius:4px;padding:4px 10px;font-size:12px;cursor:pointer;-webkit-tap-highlight-color:transparent';
        scanBtn.onclick = scanLogos;
        header.appendChild(scanBtn);

        // Copy button
        var copyBtn = document.createElement('button');
        copyBtn.textContent = 'Copy All';
        copyBtn.style.cssText = 'background:#2563eb;color:#fff;border:none;border-radius:4px;padding:4px 10px;font-size:12px;cursor:pointer;-webkit-tap-highlight-color:transparent';
        copyBtn.onclick = function() {
            var text = logEl.textContent;
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(function() {
                    copyBtn.textContent = 'Copied!';
                    setTimeout(function() { copyBtn.textContent = 'Copy All'; }, 1500);
                });
            } else {
                var ta = document.createElement('textarea');
                ta.value = text;
                ta.style.cssText = 'position:fixed;left:-9999px';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                copyBtn.textContent = 'Copied!';
                setTimeout(function() { copyBtn.textContent = 'Copy All'; }, 1500);
            }
        };
        header.appendChild(copyBtn);
        panel.appendChild(header);

        // Log area
        logEl = document.createElement('pre');
        logEl.style.cssText = 'margin:0;padding:10px;overflow:auto;flex:1;font-size:11px;line-height:1.5;color:#ccc;white-space:pre-wrap;word-break:break-all;-webkit-overflow-scrolling:touch;user-select:text;-webkit-user-select:text';
        logEl.textContent = 'Tap "Scan Logos" to inspect set button images.';
        panel.appendChild(logEl);

        document.body.appendChild(panel);
    }

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createPanel);
    } else {
        createPanel();
    }

    // Patch handleImgError to add logging
    var _origHandleImgError = null;
    function patchHandleImgError() {
        if (typeof window.handleImgError === 'function' && !_origHandleImgError) {
            _origHandleImgError = window.handleImgError;
            window.handleImgError = function(img) {
                var name = img.getAttribute('data-card-name') || '?';
                var src = img.src || '(empty)';
                addStream('FAIL', name + ' src: ' + src);
                _origHandleImgError.call(this, img);
            };
        }
    }

    // Observe card images via MutationObserver
    function observeImages() {
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(m) {
                m.addedNodes.forEach(function(node) {
                    if (node.nodeType !== 1) return;
                    var imgs = node.querySelectorAll ? node.querySelectorAll('img[data-card-name]') : [];
                    imgs.forEach(function(img) {
                        var name = img.getAttribute('data-card-name');
                        imgStats.total++;
                        img.addEventListener('load', function() {
                            addStream('OK', name + '\n  loaded: ' + img.src);
                        });
                    });
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Apply patches after all scripts have loaded
    window.addEventListener('load', function() {
        patchHandleImgError();
        observeImages();
        addPinned('INIT', 'Debug panel v2 ready');
        addPinned('INFO', 'UA: ' + navigator.userAgent);
        addPinned('INFO', 'Custom sets: ' + Object.keys(window.customCardSets || {}).join(', '));

        // Auto-scan logos after a short delay to let images settle
        setTimeout(scanLogos, 1500);
    });
})();
