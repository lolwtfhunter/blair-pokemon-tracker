// Image debug panel - tap the bug icon to see image loading diagnostics
// Remove this file and its <script> tag from index.html when done debugging

(function() {
    var debugLog = [];
    var maxEntries = 200;
    var panel = null;
    var logEl = null;
    var btnEl = null;
    var visible = false;
    var imgStats = { total: 0, loaded: 0, failed: 0, fallback: 0 };

    function addEntry(type, msg) {
        var time = new Date().toLocaleTimeString();
        var entry = '[' + time + '] ' + type + ': ' + msg;
        debugLog.push(entry);
        if (debugLog.length > maxEntries) debugLog.shift();
        if (type === 'FAIL') imgStats.failed++;
        if (type === 'OK') imgStats.loaded++;
        if (type === 'FALLBACK') imgStats.fallback++;
        if (type === 'LOAD') imgStats.total++;
        updatePanel();
    }

    function updatePanel() {
        if (!logEl || !visible) return;
        var statsLine = 'Total: ' + imgStats.total +
            ' | OK: ' + imgStats.loaded +
            ' | Fallback: ' + imgStats.fallback +
            ' | Failed: ' + imgStats.failed + '\n\n';
        logEl.textContent = statsLine + debugLog.slice().reverse().join('\n');
        updateBadge();
    }

    function updateBadge() {
        if (!btnEl) return;
        var badge = btnEl.querySelector('.dbg-badge');
        if (imgStats.failed > 0) {
            badge.textContent = imgStats.failed;
            badge.style.display = 'block';
        }
    }

    function createPanel() {
        // Toggle button
        btnEl = document.createElement('div');
        btnEl.innerHTML = '<span style="font-size:20px">&#128027;</span><span class="dbg-badge" style="display:none;position:absolute;top:-4px;right:-4px;background:#ff4444;color:#fff;border-radius:50%;width:18px;height:18px;font-size:11px;line-height:18px;text-align:center;font-weight:bold"></span>';
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

        // Header
        var header = document.createElement('div');
        header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-bottom:1px solid #333;flex-shrink:0';
        header.innerHTML = '<span style="color:#4fc3f7;font-weight:bold;font-size:13px">Image Debug Log</span>';

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
                // Fallback for older iOS
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
        logEl.textContent = 'Waiting for image events...\nSelect a custom set to see image loading.';
        panel.appendChild(logEl);

        document.body.appendChild(panel);
    }

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createPanel);
    } else {
        createPanel();
    }

    // Expose logger globally
    window._imgDebug = addEntry;

    // Patch handleImgError to add logging
    var _origHandleImgError = null;
    function patchHandleImgError() {
        if (typeof window.handleImgError === 'function' && !_origHandleImgError) {
            _origHandleImgError = window.handleImgError;
            window.handleImgError = function(img) {
                var src = img.src || '(empty)';
                var tcgdex = img.getAttribute('data-tcgdex-src') || '(none)';
                var local = img.getAttribute('data-local-src') || '(none)';
                var name = img.getAttribute('data-card-name') || '?';
                addEntry('FAIL', name + '\n  src: ' + src + '\n  tcgdex: ' + tcgdex + '\n  local: ' + local);
                _origHandleImgError.call(this, img);
            };
        }
    }

    // Patch getCustomCardImageUrl to log URLs
    var _origGetUrl = null;
    function patchGetCustomCardImageUrl() {
        if (typeof window.getCustomCardImageUrl === 'function' && !_origGetUrl) {
            _origGetUrl = window.getCustomCardImageUrl;
            window.getCustomCardImageUrl = function(card) {
                var url = _origGetUrl(card);
                addEntry('LOAD', (card.name || '?') + ' apiId=' + (card.apiId || '(none)') + '\n  pokemontcg url: ' + (url || '(null)'));
                return url;
            };
        }
    }

    // Patch renderCustomSetButtons to log logo loading
    var _origRenderBtns = null;
    function patchRenderCustomSetButtons() {
        if (typeof window.renderCustomSetButtons === 'function' && !_origRenderBtns) {
            _origRenderBtns = window.renderCustomSetButtons;
            window.renderCustomSetButtons = function() {
                _origRenderBtns.apply(this, arguments);
                // Log logo image states after render
                var btns = document.querySelectorAll('#customSetButtons .set-btn');
                btns.forEach(function(btn) {
                    var img = btn.querySelector('.set-btn-logo');
                    var setKey = btn.getAttribute('data-custom-set-key');
                    if (img) {
                        var src = img.getAttribute('src');
                        addEntry('LOGO', setKey + ' -> ' + src +
                            '\n  complete=' + img.complete +
                            ' naturalW=' + img.naturalWidth +
                            ' display=' + img.style.display);
                    }
                });
            };
        }
    }

    // Also log when images successfully load (via MutationObserver on card grids)
    function observeImages() {
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(m) {
                m.addedNodes.forEach(function(node) {
                    if (node.nodeType !== 1) return;
                    var imgs = node.querySelectorAll ? node.querySelectorAll('img[data-card-name]') : [];
                    imgs.forEach(function(img) {
                        var name = img.getAttribute('data-card-name');
                        img.addEventListener('load', function() {
                            addEntry('OK', name + '\n  loaded: ' + img.src);
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
        patchGetCustomCardImageUrl();
        patchRenderCustomSetButtons();
        observeImages();
        addEntry('INIT', 'Debug panel ready. Patches applied.');
        addEntry('INFO', 'User Agent: ' + navigator.userAgent);
        addEntry('INFO', 'Custom sets loaded: ' + Object.keys(window.customCardSets || {}).join(', '));

        // Log current state of any already-rendered set button logos
        var existingBtns = document.querySelectorAll('#customSetButtons .set-btn');
        if (existingBtns.length > 0) {
            existingBtns.forEach(function(btn) {
                var img = btn.querySelector('.set-btn-logo');
                var setKey = btn.getAttribute('data-custom-set-key');
                if (img) {
                    addEntry('LOGO-STATE', setKey +
                        '\n  src: ' + (img.getAttribute('src') || '(none)') +
                        '\n  complete: ' + img.complete +
                        '\n  naturalWidth: ' + img.naturalWidth +
                        '\n  display: ' + img.style.display +
                        '\n  parentVisible: ' + (img.offsetParent !== null));
                }
            });
        }

        // Test a known image URL directly
        var testImg = new Image();
        var testUrl = 'https://images.pokemontcg.io/basep/20.png';
        testImg.onload = function() {
            addEntry('TEST-OK', 'pokemontcg.io CDN reachable\n  ' + testUrl + '\n  size: ' + testImg.naturalWidth + 'x' + testImg.naturalHeight);
        };
        testImg.onerror = function() {
            addEntry('TEST-FAIL', 'pokemontcg.io CDN UNREACHABLE\n  ' + testUrl);
        };
        testImg.src = testUrl;

        // Test tcgdex too
        var testImg2 = new Image();
        var testUrl2 = 'https://assets.tcgdex.net/en/base/basep/20/high.png';
        testImg2.onload = function() {
            addEntry('TEST-OK', 'tcgdex.net CDN reachable\n  ' + testUrl2 + '\n  size: ' + testImg2.naturalWidth + 'x' + testImg2.naturalHeight);
        };
        testImg2.onerror = function() {
            addEntry('TEST-FAIL', 'tcgdex.net CDN UNREACHABLE\n  ' + testUrl2);
        };
        testImg2.src = testUrl2;

        // Test local logo image
        var testImg3 = new Image();
        var testUrl3 = './Images/header/pikachu.png';
        testImg3.onload = function() {
            addEntry('TEST-OK', 'Local pikachu.png reachable\n  size: ' + testImg3.naturalWidth + 'x' + testImg3.naturalHeight);
        };
        testImg3.onerror = function() {
            addEntry('TEST-FAIL', 'Local pikachu.png NOT FOUND');
        };
        testImg3.src = testUrl3;
    });
})();
