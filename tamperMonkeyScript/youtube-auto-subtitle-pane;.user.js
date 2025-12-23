// ==UserScript==
// @name         YouTube自动显示内容转文字面板
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  在YouTube视频页面自动打开详情中的内容转文字面板
// @author       You
// @match        https://www.youtube.com/watch*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 等待页面加载完成
    function waitForElement(selector, timeout = 10000) {
        return new Promise((resolve) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver((mutations, obs) => {
                const element = document.querySelector(selector);
                if (element) {
                    obs.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document, {
                childList: true,
                subtree: true
            });

            // 超时处理
            setTimeout(() => {
                observer.disconnect();
                resolve(null);
            }, timeout);
        });
    }

    // 自动打开内容转文字面板
    async function openTranscriptPanel() {
        try {
            console.log('开始查找内容转文字面板...');

            // 等待视频详情区域加载
            const videoDetails = await waitForElement('#below-the-fold, #secondary-inner', 8000);
            if (!videoDetails) {
                console.log('视频详情区域未找到');
                return;
            }

            // 检查内容转文字面板是否已经打开
            if (document.querySelector('ytd-transcript-segment-list-renderer, ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-transcript"]')) {
                console.log('内容转文字面板已经打开');
                return;
            }

            // 查找"更多"按钮的多种可能选择器
            const moreButtonSelectors = [
                '#expand',
                'tp-yt-paper-button#expand',
                'button#expand',
                '[aria-label*="更多"]',
                '[aria-label*="Show more"]',
                'button[aria-label*="Show more"]'
            ];

            let moreButton = null;
            for (const selector of moreButtonSelectors) {
                moreButton = document.querySelector(selector);
                if (moreButton && moreButton.offsetParent !== null) {
                    break;
                }
            }

            // 如果找到"更多"按钮，先点击它
            if (moreButton) {
                console.log('点击"更多"按钮...');
                moreButton.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // 查找内容转文字按钮的多种可能选择器
            const transcriptSelectors = [
                'button[aria-label*="内容转文字"]',
                'button[aria-label*="Show transcript"]',
                'button[aria-label*="Transcript"]',
                'yt-button-renderer[aria-label*="内容转文字"]',
                'yt-button-renderer[aria-label*="Show transcript"]',
                'tp-yt-paper-button[aria-label*="内容转文字"]',
                'tp-yt-paper-button[aria-label*="Show transcript"]'
            ];

            let transcriptButton = null;
            
            // 尝试找到内容转文字按钮，等待一段时间让DOM更新
            for (let attempt = 0; attempt < 3; attempt++) {
                for (const selector of transcriptSelectors) {
                    transcriptButton = document.querySelector(selector);
                    if (transcriptButton && transcriptButton.offsetParent !== null) {
                        break;
                    }
                }
                if (transcriptButton) break;
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            if (transcriptButton) {
                console.log('找到内容转文字按钮，正在点击...');
                transcriptButton.click();
                
                // 等待面板打开
                setTimeout(() => {
                    const transcriptPanel = document.querySelector('ytd-transcript-segment-list-renderer, ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-transcript"]');
                    if (transcriptPanel) {
                        console.log('内容转文字面板已成功打开');
                    } else {
                        console.log('内容转文字面板可能未成功打开');
                    }
                }, 2000);
            } else {
                console.log('未找到内容转文字按钮，可能此视频不支持此功能');
            }

        } catch (error) {
            console.error('打开内容转文字面板时发生错误:', error);
        }
    }

    // 监听页面变化，处理SPA路由切换
    function observePageChanges() {
        let currentUrl = location.href;
        
        const observer = new MutationObserver(() => {
            if (location.href !== currentUrl) {
                currentUrl = location.href;
                if (currentUrl.includes('/watch')) {
                    console.log('检测到YouTube视频页面变化，准备打开内容转文字面板...');
                    setTimeout(openTranscriptPanel, 3000); // 延迟执行，确保页面加载完成
                }
            }
        });

        observer.observe(document, {
            childList: true,
            subtree: true
        });
    }

    // 初始化
    function init() {
        console.log('YouTube自动内容转文字脚本已启动');
        
        // 如果当前就在视频页面，直接执行
        if (location.href.includes('/watch')) {
            setTimeout(openTranscriptPanel, 4000);
        }
        
        // 监听页面变化
        observePageChanges();
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();