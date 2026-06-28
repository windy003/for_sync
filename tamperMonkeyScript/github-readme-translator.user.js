// ==UserScript==
// @name         GitHub README 翻译 (DeepSeek)
// @namespace    https://github.com/
// @version      1.0.0
// @description  使用 DeepSeek API 将 GitHub 页面上的英文 README 翻译为中文
// @author       you
// @match        https://github.com/*
// @icon         https://github.githubassets.com/favicons/favicon.svg
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @connect      api.deepseek.com
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const API_URL = 'https://api.deepseek.com/chat/completions';
    const MODEL = 'deepseek-chat';

    // ---------- API Key 管理 ----------
    function getApiKey() {
        return GM_getValue('deepseek_api_key', '');
    }

    function promptApiKey() {
        const cur = getApiKey();
        const key = window.prompt('请输入你的 DeepSeek API Key（保存在本地浏览器中）:', cur);
        if (key !== null) {
            GM_setValue('deepseek_api_key', key.trim());
            alert('DeepSeek API Key 已保存。');
        }
    }

    GM_registerMenuCommand('设置 DeepSeek API Key', promptApiKey);

    // ---------- 调用 DeepSeek 翻译 ----------
    function translate(text) {
        return new Promise((resolve, reject) => {
            const apiKey = getApiKey();
            if (!apiKey) {
                reject(new Error('未设置 API Key'));
                return;
            }

            GM_xmlhttpRequest({
                method: 'POST',
                url: API_URL,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + apiKey,
                },
                data: JSON.stringify({
                    model: MODEL,
                    messages: [
                        {
                            role: 'system',
                            content:
                                '你是一个专业的技术文档翻译助手。请将用户提供的英文 HTML 片段翻译成简体中文。' +
                                '要求：1) 完整保留所有 HTML 标签、属性和结构，只翻译可见文本；' +
                                '2) 代码块、行内代码、命令、URL、变量名、函数名等保持原文不翻译；' +
                                '3) 不要添加任何解释或额外内容，直接输出翻译后的 HTML。',
                        },
                        { role: 'user', content: text },
                    ],
                    temperature: 1.3,
                    stream: false,
                }),
                onload: function (res) {
                    if (res.status >= 200 && res.status < 300) {
                        try {
                            const data = JSON.parse(res.responseText);
                            resolve(data.choices[0].message.content);
                        } catch (e) {
                            reject(new Error('解析响应失败: ' + e.message));
                        }
                    } else {
                        reject(new Error('API 请求失败 (' + res.status + '): ' + res.responseText));
                    }
                },
                onerror: function () {
                    reject(new Error('网络请求出错'));
                },
            });
        });
    }

    // ---------- 找到 README 容器 ----------
    function findReadme() {
        // GitHub 仓库主页 README，以及 .md 文件预览
        return (
            document.querySelector('#readme article.markdown-body') ||
            document.querySelector('article.markdown-body.entry-content') ||
            document.querySelector('article.markdown-body')
        );
    }

    // 设置图标显示的简短文字 + 悬停提示（完整说明）
    function setBtn(btn, glyph, tip) {
        btn.textContent = glyph;
        btn.title = tip;
    }

    // ---------- 翻译逻辑 ----------
    let translating = false;

    async function doTranslate(btn) {
        if (translating) return;
        const readme = findReadme();
        if (!readme) {
            alert('未找到 README 内容。');
            return;
        }
        if (!getApiKey()) {
            promptApiKey();
            if (!getApiKey()) return;
        }

        translating = true;
        setBtn(btn, '…', '翻译中…');
        btn.disabled = true;

        // 只翻译还没翻过的顶层元素（跳过已插入的译文）
        const children = Array.from(readme.children).filter(
            (el) => !el.classList.contains('ds-translation')
        );

        // 按顶层子元素分块，逐块翻译（控制每次请求大小）
        let buffer = [];
        let bufferLen = 0;
        const MAX_LEN = 2500;
        const batches = [];

        for (const el of children) {
            const html = el.outerHTML;
            if (bufferLen + html.length > MAX_LEN && buffer.length > 0) {
                batches.push(buffer);
                buffer = [];
                bufferLen = 0;
            }
            buffer.push(el);
            bufferLen += html.length;
        }
        if (buffer.length) batches.push(buffer);

        // 处理单个分块：翻译并就地插入译文
        async function processBatch(batch) {
            const htmlChunk = batch.map((e) => e.outerHTML).join('\n');
            const translated = await translate(htmlChunk);
            const cleaned = translated
                .replace(/^```html\s*/i, '')
                .replace(/^```\s*/i, '')
                .replace(/```\s*$/i, '')
                .trim();

            // 把译文包进一个容器，插入到这一批原文之后（双语对照，保留原文）
            const wrapper = document.createElement('div');
            wrapper.className = 'ds-translation';
            wrapper.style.cssText =
                'border-left:3px solid #1f6feb;padding-left:12px;margin:8px 0 16px;';
            wrapper.innerHTML = cleaned;

            const last = batch[batch.length - 1];
            last.parentNode.insertBefore(wrapper, last.nextSibling);
        }

        // 并发池：同时跑 CONCURRENCY 个请求，大幅加快整体速度
        const CONCURRENCY = 10;
        let done = 0;
        let failed = 0;
        const total = batches.length;
        const queue = batches.slice();

        async function worker() {
            while (queue.length) {
                const batch = queue.shift();
                try {
                    await processBatch(batch);
                } catch (e) {
                    failed++;
                    console.error('[DS翻译] 分块失败:', e.message);
                }
                done++;
                setBtn(btn, Math.round((done / total) * 100) + '%', `翻译中… (${done}/${total})`);
            }
        }

        try {
            await Promise.all(
                Array.from({ length: Math.min(CONCURRENCY, total) }, () => worker())
            );
            setBtn(
                btn,
                '✓',
                failed ? `已翻译，${failed} 块失败，点击隐藏译文` : '已翻译，点击隐藏译文'
            );
            btn.dataset.state = 'translated';
        } catch (e) {
            alert('翻译失败：' + e.message);
            setBtn(btn, '译', '翻译为中文');
        } finally {
            btn.disabled = false;
            translating = false;
        }
    }

    // 点击在“显示译文 / 隐藏译文”之间切换（原文始终保留）
    function toggleTranslation(readme, btn) {
        const blocks = readme.querySelectorAll('.ds-translation');
        if (blocks.length === 0) {
            doTranslate(btn);
            return;
        }
        const hidden = blocks[0].style.display === 'none';
        blocks.forEach((b) => {
            b.style.display = hidden ? '' : 'none';
        });
        if (hidden) {
            setBtn(btn, '✓', '已翻译，点击隐藏译文');
        } else {
            setBtn(btn, '译', '点击显示译文');
        }
    }

    // ---------- 注入按钮（右下角圆形图标，可拖动） ----------
    const BTN_SIZE = 48;

    function injectButton() {
        if (document.getElementById('ds-translate-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'ds-translate-btn';
        btn.type = 'button';
        btn.textContent = '译';
        btn.title = '翻译为中文（可拖动）';
        btn.style.cssText = [
            'position:fixed !important',
            'z-index:2147483647 !important',
            `width:${BTN_SIZE}px !important`,
            `height:${BTN_SIZE}px !important`,
            'padding:0 !important',
            'margin:0 !important',
            'font-size:18px !important',
            'font-weight:600 !important',
            'line-height:1 !important',
            'color:#fff !important',
            'background:#1f6feb !important',
            'border:none !important',
            'border-radius:50% !important',
            'cursor:pointer !important',
            'box-shadow:0 2px 12px rgba(0,0,0,0.35) !important',
            'display:flex !important',
            'align-items:center !important',
            'justify-content:center !important',
            'visibility:visible !important',
            'opacity:0.92 !important',
            'user-select:none !important',
            'touch-action:none !important',
        ].join(';');

        // 把图标限制在视口内，并设置位置
        function applyPos(left, top) {
            left = Math.max(0, Math.min(left, window.innerWidth - BTN_SIZE));
            top = Math.max(0, Math.min(top, window.innerHeight - BTN_SIZE));
            btn.style.setProperty('left', left + 'px', 'important');
            btn.style.setProperty('top', top + 'px', 'important');
            btn.style.setProperty('right', 'auto', 'important');
            btn.style.setProperty('bottom', 'auto', 'important');
        }

        // 读取上次保存的位置；默认右下角
        const saved = GM_getValue('ds_btn_pos', null);
        if (saved && typeof saved.left === 'number') {
            applyPos(saved.left, saved.top);
        } else {
            applyPos(window.innerWidth - BTN_SIZE - 20, window.innerHeight - BTN_SIZE - 20);
        }

        // ---- 拖动逻辑（Pointer Events + 指针捕获，区分点击与拖动） ----
        let dragging = false;
        let moved = false;
        let startX, startY, originLeft, originTop;

        btn.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return; // 只响应左键/主指针
            dragging = true;
            moved = false;
            startX = e.clientX;
            startY = e.clientY;
            const r = btn.getBoundingClientRect();
            originLeft = r.left;
            originTop = r.top;
            // 捕获指针：后续 move/up 一定回到这个按钮，不会被页面其它处理器抢走
            btn.setPointerCapture(e.pointerId);
            e.preventDefault();
            e.stopPropagation();
        });

        window.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            e.preventDefault();
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
            applyPos(originLeft + dx, originTop + dy);
        });

        function endDrag(e) {
            if (!dragging) return;
            dragging = false;
            try { btn.releasePointerCapture(e.pointerId); } catch (_) {}
            if (moved) {
                const r = btn.getBoundingClientRect();
                GM_setValue('ds_btn_pos', { left: r.left, top: r.top });
            } else {
                // 没移动 = 真正的点击 → 执行翻译/切换
                const rm = findReadme();
                if (!rm) return;
                if (btn.dataset.state === 'translated') {
                    toggleTranslation(rm, btn);
                } else {
                    doTranslate(btn);
                }
            }
        }

        window.addEventListener('pointerup', endDrag);
        window.addEventListener('pointercancel', endDrag);
        // 阻止原生 click（已用 pointerup 自行处理点击，避免拖动后误触发）
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });

        // 挂到 <html> 上，避免 GitHub 重渲染 <body> 时把按钮清掉
        document.documentElement.appendChild(btn);
    }

    // GitHub 使用 PJAX/Turbo 进行页面切换，需监听 DOM 变化
    injectButton();
    const observer = new MutationObserver(() => {
        injectButton();
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
