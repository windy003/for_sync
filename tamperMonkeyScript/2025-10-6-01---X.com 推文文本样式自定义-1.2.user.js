  // ==UserScript==
  // @name         X.com 推文文本样式自定义
  // @namespace    http://tampermonkey.net/
  // @version      2025/10/06-01
  // @description  自定义 X.com 推文的文本大小、字间距和行间距（字间距仅对中文字符生效）
  // @author       You
  // @match        https://x.com/*
  // @match        https://twitter.com/*
  // @grant        GM_addStyle
  // @grant        GM_setValue
  // @grant        GM_getValue
  // ==/UserScript==

  (function() {
      'use strict';

      // 默认设置
      const defaultSettings = {
          fontSize: 15,
          letterSpacing: 0,
          lineHeight: 20
      };

      // 读取保存的设置
      let settings = {
          fontSize: GM_getValue('fontSize', defaultSettings.fontSize),
          letterSpacing: GM_getValue('letterSpacing', defaultSettings.letterSpacing),
          lineHeight: GM_getValue('lineHeight', defaultSettings.lineHeight)
      };

      // 应用样式
      function applyStyles() {
          const style = document.createElement('style');
          style.id = 'tweet-custom-style-init';
          style.textContent = `
              [data-testid="tweetText"],
              article [lang] {
                  font-size: ${settings.fontSize}px !important;
                  line-height: ${settings.lineHeight}px !important;
              }

              .chinese-text {
                  letter-spacing: ${settings.letterSpacing}px !important;
              }
          `;
          document.head.appendChild(style);
      }

      // 判断字符是否为中文
      function isChinese(char) {
          const code = char.charCodeAt(0);
          return (code >= 0x4E00 && code <= 0x9FFF) || // CJK统一汉字
                 (code >= 0x3400 && code <= 0x4DBF) || // CJK扩展A
                 (code >= 0x20000 && code <= 0x2A6DF) || // CJK扩展B
                 (code >= 0xF900 && code <= 0xFAFF);   // CJK兼容汉字
      }

      // 处理文本节点，分离中英文
      function processTextNode(node) {
          if (node.nodeType !== 3 || !node.textContent.trim()) return;

          const text = node.textContent;
          const parent = node.parentNode;

          // 如果父元素已经处理过，跳过
          if (parent.classList && parent.classList.contains('chinese-text-processed')) return;

          // 避免处理已经被包裹的中文文本
          if (parent.classList && parent.classList.contains('chinese-text')) return;

          // 分段处理文本
          const segments = [];
          let currentSegment = '';
          let currentIsChinese = null;

          for (let i = 0; i < text.length; i++) {
              const char = text[i];
              const charIsChinese = isChinese(char);

              if (currentIsChinese === null) {
                  currentIsChinese = charIsChinese;
                  currentSegment = char;
              } else if (currentIsChinese === charIsChinese) {
                  currentSegment += char;
              } else {
                  segments.push({ text: currentSegment, isChinese: currentIsChinese });
                  currentSegment = char;
                  currentIsChinese = charIsChinese;
              }
          }

          if (currentSegment) {
              segments.push({ text: currentSegment, isChinese: currentIsChinese });
          }

          // 只要包含中文就处理
          const hasChinese = segments.some(s => s.isChinese);

          if (hasChinese && segments.length > 1) {
              const fragment = document.createDocumentFragment();
              segments.forEach(segment => {
                  if (segment.isChinese) {
                      const span = document.createElement('span');
                      span.className = 'chinese-text';
                      span.textContent = segment.text;
                      fragment.appendChild(span);
                  } else {
                      fragment.appendChild(document.createTextNode(segment.text));
                  }
              });
              parent.replaceChild(fragment, node);
          } else if (hasChinese && segments.length === 1) {
              // 纯中文文本也需要包裹
              const span = document.createElement('span');
              span.className = 'chinese-text';
              span.textContent = text;
              parent.replaceChild(span, node);
          }
      }

      // 处理推文元素
      function processTweet(element) {
          const walker = document.createTreeWalker(
              element,
              NodeFilter.SHOW_TEXT,
              null
          );

          const textNodes = [];
          let node;
          while (node = walker.nextNode()) {
              textNodes.push(node);
          }

          textNodes.forEach(processTextNode);
          element.classList.add('chinese-text-processed');
      }

      // 处理所有推文
      function processAllTweets() {
          // 处理所有推文文本，不限语言
          const tweets = document.querySelectorAll('[data-testid="tweetText"], article [lang]');
          tweets.forEach(processTweet);
      }

      // 监听DOM变化
      function observeDOMChanges() {
          const observer = new MutationObserver((mutations) => {
              mutations.forEach((mutation) => {
                  mutation.addedNodes.forEach((node) => {
                      if (node.nodeType === 1) {
                          // 检查新添加的节点是否是推文或包含推文
                          if (node.matches && (node.matches('[data-testid="tweetText"]') ||
                              node.matches('article [lang]'))) {
                              processTweet(node);
                          }
                          // 检查新节点的子元素
                          const tweets = node.querySelectorAll('[data-testid="tweetText"], article [lang]');
                          tweets.forEach(processTweet);
                      }
                  });
              });
          });

          observer.observe(document.body, {
              childList: true,
              subtree: true
          });
      }

      // 创建控制面板
      function createPanel() {
          // 创建浮动按钮
          const floatBtn = document.createElement('div');
          floatBtn.id = 'tweet-style-float-btn';
          floatBtn.textContent = '设置';
          floatBtn.style.cssText = `
              position: fixed !important;
              bottom: 100px !important;
              right: 10px !important;
              width: 50px !important;
              height: 50px !important;
              background: #1d9bf0 !important;
              border-radius: 50% !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              cursor: pointer !important;
              z-index: 999999 !important;
              box-shadow: 0 4px 12px rgba(29, 155, 240, 0.5) !important;
              font-size: 12px !important;
              color: white !important;
              font-weight: bold !important;
              user-select: none !important;
          `;
          document.body.appendChild(floatBtn);

          // 创建控制面板
          const panel = document.createElement('div');
          panel.id = 'tweet-style-panel';
          panel.style.cssText = `
              position: fixed !important;
              bottom: 160px !important;
              right: 10px !important;
              background: #1a1a1a !important;
              border: 1px solid #333 !important;
              border-radius: 12px !important;
              padding: 15px !important;
              z-index: 999999 !important;
              color: #fff !important;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
              box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
              min-width: 220px !important;
              display: none !important;
          `;
          panel.innerHTML = `
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid
   #333; padding-bottom: 8px;">
                  <span style="font-weight: bold; font-size: 14px;">推文样式设置</span>
                  <button id="close-panel" style="background: #333; border: none; color: #fff; cursor: pointer; font-size: 18px; padding:
  0; width: 24px; height: 24px; border-radius: 4px;">×</button>
              </div>

              <label style="display: block; margin-bottom: 8px; font-size: 12px;">
                  文本大小: <span id="fs-value">${settings.fontSize}px</span>
              </label>
              <input type="range" id="font-size" min="12" max="50" value="${settings.fontSize}" style="width: 100%; margin-bottom: 12px;">

              <label style="display: block; margin-bottom: 8px; font-size: 12px;">
                  字间距: <span id="ls-value">${settings.letterSpacing}px</span>
              </label>
              <input type="range" id="letter-spacing" min="-2" max="30" step="0.5" value="${settings.letterSpacing}" style="width: 100%;
  margin-bottom: 12px;">

              <label style="display: block; margin-bottom: 8px; font-size: 12px;">
                  行间距: <span id="lh-value">${settings.lineHeight}px</span>
              </label>
              <input type="range" id="line-height" min="16" max="60" value="${settings.lineHeight}" style="width: 100%; margin-bottom:
  12px;">

              <button id="reset-btn" style="width: 100%; padding: 8px; background: #1d9bf0; color: white; border: none; border-radius:
  20px; cursor: pointer; font-size: 13px; font-weight: bold;">重置默认</button>
          `;
          document.body.appendChild(panel);

          // 点击浮动按钮显示/隐藏面板
          floatBtn.addEventListener('click', () => {
              if (panel.style.display === 'none') {
                  panel.style.display = 'block';
              } else {
                  panel.style.display = 'none';
              }
          });

          // 点击关闭按钮隐藏面板
          document.getElementById('close-panel').addEventListener('click', () => {
              panel.style.display = 'none';
          });

          // 添加滑块事件监听
          const fsSlider = document.getElementById('font-size');
          const lsSlider = document.getElementById('letter-spacing');
          const lhSlider = document.getElementById('line-height');
          const resetBtn = document.getElementById('reset-btn');

          fsSlider.addEventListener('input', (e) => {
              settings.fontSize = e.target.value;
              document.getElementById('fs-value').textContent = e.target.value + 'px';
              GM_setValue('fontSize', parseInt(e.target.value));
              updateStyles();
          });

          lsSlider.addEventListener('input', (e) => {
              settings.letterSpacing = e.target.value;
              document.getElementById('ls-value').textContent = e.target.value + 'px';
              GM_setValue('letterSpacing', parseFloat(e.target.value));
              updateStyles();
          });

          lhSlider.addEventListener('input', (e) => {
              settings.lineHeight = e.target.value;
              document.getElementById('lh-value').textContent = e.target.value + 'px';
              GM_setValue('lineHeight', parseInt(e.target.value));
              updateStyles();
          });

          resetBtn.addEventListener('click', () => {
              settings = {...defaultSettings};
              GM_setValue('fontSize', defaultSettings.fontSize);
              GM_setValue('letterSpacing', defaultSettings.letterSpacing);
              GM_setValue('lineHeight', defaultSettings.lineHeight);

              fsSlider.value = defaultSettings.fontSize;
              lsSlider.value = defaultSettings.letterSpacing;
              lhSlider.value = defaultSettings.lineHeight;

              document.getElementById('fs-value').textContent = defaultSettings.fontSize + 'px';
              document.getElementById('ls-value').textContent = defaultSettings.letterSpacing + 'px';
              document.getElementById('lh-value').textContent = defaultSettings.lineHeight + 'px';

              updateStyles();
          });
      }

      // 更新样式
      function updateStyles() {
          const existingStyle = document.getElementById('tweet-custom-style');
          if (existingStyle) existingStyle.remove();

          const style = document.createElement('style');
          style.id = 'tweet-custom-style';
          style.textContent = `
              [data-testid="tweetText"],
              article [lang] {
                  font-size: ${settings.fontSize}px !important;
                  line-height: ${settings.lineHeight}px !important;
              }

              .chinese-text {
                  letter-spacing: ${settings.letterSpacing}px !important;
              }
          `;
          document.head.appendChild(style);

          // 重新处理所有推文以应用新的字间距
          document.querySelectorAll('.chinese-text-processed').forEach(el => {
              el.classList.remove('chinese-text-processed');
          });
          processAllTweets();
      }

      // 初始化
      applyStyles();

      // 延迟创建面板和处理推文，确保页面加载完成
      setTimeout(() => {
          createPanel();
          processAllTweets();
          observeDOMChanges();
      }, 2000);
  })();