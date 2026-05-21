(function() {
    // 检查是否已经初始化过
    if (window.chatAssistantInitialized) return;
    window.chatAssistantInitialized = true;

    // CSS样式
    const css = `
        /* 悬浮聊天按钮 */
        .chat-float-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 56px;
            height: 56px;
            background: linear-gradient(135deg, #1677ff, #40a9ff);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: white;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(22, 119, 255, 0.4);
            border: none;
            z-index: 999;
            transition: all 0.3s ease;
        }

        .chat-float-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(22, 119, 255, 0.5);
        }

        /* 聊天框 */
        .chat-container {
            position: fixed;
            bottom: 100px;
            right: 30px;
            width: 350px;
            height: 550px;
            background-color: white;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            display: none;
            flex-direction: column;
            overflow: hidden;
        }

        .chat-header {
            background: linear-gradient(135deg, #1677ff, #40a9ff);
            color: white;
            padding: 15px 20px;
            font-weight: bold;
            font-size: 18px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
        }

        .chat-avatar {
            width: 42px;
            height: 42px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
        }

        .chat-close {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            font-weight: bold;
            line-height: 1;
        }

        .chat-close:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(1.1);
        }

        .chat-messages {
            flex: 1;
            padding: 15px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .message {
            max-width: 80%;
            padding: 10px 15px;
            border-radius: 18px;
            line-height: 1.6;
            white-space: normal;
            word-wrap: break-word;
        }

        .message.user {
            background-color: #1677ff;
            color: white;
            align-self: flex-end;
            border-bottom-right-radius: 4px;
        }

        .message.ai {
            background-color: #f0f2f5;
            color: #333;
            align-self: flex-start;
            border-bottom-left-radius: 4px;
        }

        .message.error {
            background: #fff2f0;
            color: #ff4d4f;
        }

        .chat-input-container {
            padding: 15px;
            border-top: 1px solid #f0f0f0;
            display: flex;
            flex-direction: column;
            gap: 10px;
            overflow: visible;
        }

        .chat-image-preview {
            display: flex;
            flex-wrap: wrap;
            gap: 25px; /* 增加间距，给删除按钮留出空间 */
            min-height: 0;
            padding: 10px 5px;
            position: relative;
        }

        .preview-image-wrapper {
            position: relative;
            width: 65px;
            height: 65px;
            border-radius: 8px;
            border: 2px solid #1677ff;
            padding: 2px;
            background: white;
            box-sizing: content-box;
        }

        .preview-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 6px;
        }

        .preview-remove-btn {
            position: absolute;
            top: -13px;
            right: -13px;
            width: 20px;
            height: 20px;
            background: #ff4d4f;
            color: white;
            border-radius: 50%;
            border: none; /* 移除白色边框 */
            font-size: 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            z-index: 100;
            flex-shrink: 0;
        }

        .chat-input-row {
            display: flex;
            gap: 10px;
            align-items: center;
        }

        .chat-input {
            flex: 1;
            padding: 10px 15px;
            border: 1px solid #d9d9d9;
            border-radius: 20px;
            outline: none;
            font-size: 14px;
        }

        .chat-input:focus {
            border-color: #1677ff;
        }

        .chat-send-btn {
            background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
            color: white;
            border: none;
            border-radius: 20px;
            width: 65px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(22, 119, 255, 0.4);
            font-size: 14px;
            font-weight: 500;
        }

        .chat-send-btn:hover {
            background: linear-gradient(135deg, #0958d9 0%, #3388ff 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(22, 119, 255, 0.5);
        }

        .chat-send-btn:active {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(22, 119, 255, 0.3);
        }
         
        /* 图片上传按钮 */
        .chat-upload-btn {
            background: #f5f5f5;
            border: 2px solid #ddd;
            font-size: 28px;
            cursor: pointer;
            color: #666;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            line-height: 1;
            box-sizing: border-box;
        }

        .chat-upload-btn:hover {
            background: #f0f0f0;
            color: #1677ff;
            border-color: #1677ff;
            transform: scale(1.1);
        }

        .chat-image {
            max-width: 200px;
            max-height: 200px;
            border-radius: 8px;
            margin-top: 5px;
            object-fit: cover;
        }

        .image-upload-input {
            display: none;
        }

        /* 响应式调整 */
        @media (max-width: 480px) {
            .chat-container {
                width: 300px;
                height: 400px;
                bottom: 90px;
                right: 20px;
            }

            .chat-float-btn {
                bottom: 20px;
                right: 20px;
                width: 50px;
                height: 50px;
                font-size: 20px;
            }
        }
    `;

    // 创建样式标签
    const styleSheet = document.createElement('style');
    styleSheet.textContent = css;
    document.head.appendChild(styleSheet);

    // HTML结构
    const html = `
        <button class="chat-float-btn" id="chatFloatBtn">💬</button>
        <div class="chat-container" id="chatContainer">
            <div class="chat-header">
                <div class="chat-avatar">🤖</div>
                <span>智能地理助手</span>
                <button class="chat-close" id="chatCloseBtn">×</button>
            </div>
            <div class="chat-messages" id="chatMessages">
                <div class="message ai">
                    你好！我是地理智能助手，有什么关于喀斯特地貌的问题可以问我哦～
                    <br><small style="color:#888;font-size:12px">支持上传图片进行提问</small>
                </div>
            </div>
            <div class="chat-input-container">
                <div class="chat-image-preview" id="chatImagePreview"></div>
                <div class="chat-input-row">
                    <input type="file" class="image-upload-input" id="imageUploadInput" accept="image/*">
                    <button class="chat-upload-btn" id="chatUploadBtn">+</button>
                    <input type="text" class="chat-input" id="chatInput" placeholder="输入你的问题...">
                    <button class="chat-send-btn" id="chatSendBtn">发送</button>
                </div>
            </div>
        </div>
    `;

    // 创建容器并添加到页面
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);

    // 初始化聊天功能
    initChat();

    function initChat() {
        const chatFloatBtn = document.getElementById('chatFloatBtn');
        const chatContainer = document.getElementById('chatContainer');
        const chatCloseBtn = document.getElementById('chatCloseBtn');
        const chatSendBtn = document.getElementById('chatSendBtn');
        const chatInput = document.getElementById('chatInput');
        const chatMessages = document.getElementById('chatMessages');
        const chatImagePreview = document.getElementById('chatImagePreview');
        const chatUploadBtn = document.getElementById('chatUploadBtn');
        const imageUploadInput = document.getElementById('imageUploadInput');

        // 当前上传的图片数据
        let currentImages = [];
        // 核心：维护完整对话历史
        let chatHistory = [];
        // 请求节流控制
        let lastRequestTime = 0;
        const MIN_REQUEST_INTERVAL = 8000;
        let requestCount = 0;
        const MAX_REQUESTS_PER_MINUTE = 3;
        let requestWindowStart = Date.now();
        let retryCount = 0;
        const MAX_RETRY_COUNT = 4;
        let isInCooldown = false;
        let cooldownEndTime = 0;

        // 系统消息
        const systemMessage = {
            role: 'system',
            content: `你是专注喀斯特地貌的智能地理助手，严格遵守规则：
            1. 完整记住所有对话上下文，绝对不能失忆。
            2. 直接回答原则：用户提出问题后，必须直接给出明确答案，绝对禁止反问用户或要求用户进一步澄清。
            3. 回答风格：使用简洁、通俗的语言，避免专业术语过多，让学生容易理解。
            4. 完整性：回答应包含必要的解释和例子，确保信息准确全面。
            5. 永远把当前对话和历史对话关联起来。`
        };

        // 从sessionStorage加载对话历史
        const savedHistory = sessionStorage.getItem('chatHistory');
        if (savedHistory) {
            try {
                const loadedHistory = JSON.parse(savedHistory);
                const hasSystemMessage = loadedHistory.some(msg => msg.role === 'system');
                chatHistory = hasSystemMessage ? loadedHistory : [systemMessage, ...loadedHistory];
                // 显示历史消息
                chatMessages.innerHTML = '';
                chatHistory.forEach(msg => {
                    if (msg.role === 'user' || msg.role === 'assistant') {
                        const messageDiv = document.createElement('div');
                        messageDiv.className = `message ${msg.role === 'user' ? 'user' : 'ai'}`;
                        if (Array.isArray(msg.content)) {
                            msg.content.forEach(item => {
                                if (item.type === 'image_url' && item.image_url && item.image_url.url) {
                                    const img = document.createElement('img');
                                    img.src = item.image_url.url;
                                    img.className = 'chat-image';
                                    messageDiv.appendChild(img);
                                } else if (item.type === 'text' && item.text) {
                                    const textNode = document.createElement('p');
                                    textNode.textContent = item.text;
                                    textNode.style.margin = '5px 0 0 0';
                                    messageDiv.appendChild(textNode);
                                }
                            });
                        } else {
                            messageDiv.textContent = msg.content;
                        }
                        chatMessages.appendChild(messageDiv);
                    }
                });
            } catch (e) {
                chatHistory = [systemMessage];
            }
        } else {
            chatHistory = [systemMessage];
        }

        // 保存对话历史
        function saveChatHistory() {
            try {
                sessionStorage.setItem('chatHistory', JSON.stringify(chatHistory));
            } catch (e) {
                console.error('保存对话历史失败:', e);
            }
        }

        // 事件监听
        chatFloatBtn.addEventListener('click', () => { 
            chatContainer.style.display = 'flex'; 
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
        chatCloseBtn.addEventListener('click', () => { chatContainer.style.display = 'none'; });
        chatSendBtn.addEventListener('click', sendChatMessage);
        chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChatMessage(); });
        chatUploadBtn.addEventListener('click', () => { imageUploadInput.click(); });
        imageUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) handleImageUpload(file);
        });

        // 处理图片上传
        async function handleImageUpload(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const base64Data = e.target.result;
                    currentImages.push(base64Data);

                    const previewWrapper = document.createElement('div');
                    previewWrapper.className = 'preview-image-wrapper';
                    previewWrapper.dataset.index = currentImages.length - 1;

                    const img = document.createElement('img');
                    img.src = base64Data;
                    img.className = 'preview-image';
                    previewWrapper.appendChild(img);

                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'preview-remove-btn';
                    removeBtn.textContent = '×';
                    removeBtn.addEventListener('click', () => {
                        removePreviewImage(parseInt(previewWrapper.dataset.index));
                    });
                    previewWrapper.appendChild(removeBtn);

                    chatImagePreview.appendChild(previewWrapper);
                    resolve(base64Data);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }

        // 移除预览图片
        function removePreviewImage(index) {
            currentImages.splice(index, 1);
            chatImagePreview.innerHTML = '';
            currentImages.forEach((imgData, idx) => {
                const previewWrapper = document.createElement('div');
                previewWrapper.className = 'preview-image-wrapper';
                previewWrapper.dataset.index = idx;

                const img = document.createElement('img');
                img.src = imgData;
                img.className = 'preview-image';
                previewWrapper.appendChild(img);

                const removeBtn = document.createElement('button');
                removeBtn.className = 'preview-remove-btn';
                removeBtn.textContent = '×';
                removeBtn.addEventListener('click', () => { removePreviewImage(idx); });
                previewWrapper.appendChild(removeBtn);

                chatImagePreview.appendChild(previewWrapper);
            });
        }

        // 发送消息
        async function sendChatMessage() {
            if (isInCooldown && Date.now() < cooldownEndTime) {
                const remaining = Math.ceil((cooldownEndTime - Date.now()) / 1000);
                alert(`请求过于频繁，请等待${remaining}秒后再试`);
                return;
            }

            const msg = chatInput.value.trim();
            if (!msg && currentImages.length === 0) return;

            const now = Date.now();
            if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
                const remaining = Math.ceil((MIN_REQUEST_INTERVAL - (now - lastRequestTime)) / 1000);
                alert(`请求过于频繁，请等待${remaining}秒后再试`);
                return;
            }

            if (now - requestWindowStart >= 60000) {
                requestCount = 0;
                requestWindowStart = now;
            }

            if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
                alert('当前请求过多，请稍后再试');
                return;
            }

            lastRequestTime = now;
            requestCount++;
            retryCount = 0;

            // 添加用户消息到界面
            const userMsg = document.createElement('div');
            userMsg.className = 'message user';

            currentImages.forEach(imgData => {
                const img = document.createElement('img');
                img.src = imgData;
                img.className = 'chat-image';
                userMsg.appendChild(img);
            });

            chatImagePreview.innerHTML = '';

            if (msg) {
                const textNode = document.createElement('p');
                textNode.textContent = msg;
                textNode.style.margin = '5px 0 0 0';
                userMsg.appendChild(textNode);
            }

            chatMessages.appendChild(userMsg);
            chatInput.value = '';

            // 构建消息内容
            let messageContent = '';
            if (currentImages.length > 0) {
                // 有图片时使用数组格式
                messageContent = [];
                currentImages.forEach(imgData => {
                    messageContent.push({
                        type: 'image_url',
                        image_url: { url: imgData }
                    });
                });
                if (msg) {
                    messageContent.push({ type: 'text', text: msg || '请分析这张图片' });
                }
            } else {
                // 纯文本消息使用字符串格式
                messageContent = msg;
            }

            currentImages = [];
            chatHistory.push({ role: 'user', content: messageContent });
            saveChatHistory();

            await getAIReply();
        }

        // 获取AI回复
        async function getAIReply() {
            const apiKey = '795328bbbb4442f8a2258b0642cb1988.s4a6GtVcMTluclRR';
            const baseUrl = 'https://open.bigmodel.cn/api/paas/v4';
            const MAX_RETRY_DELAY = 30000;

            try {
                const loading = document.createElement('div');
                loading.className = 'message ai';
                loading.textContent = '思考中...';
                chatMessages.appendChild(loading);
                chatMessages.scrollTop = chatMessages.scrollHeight;

                const hasImage = chatHistory.some(msg =>
                    msg.role === 'user' &&
                    Array.isArray(msg.content) &&
                    msg.content.some(item => item.type === 'image_url')
                );

                const selectedModel = hasImage ? 'glm-4.6v-flash' : 'glm-4-flash';

                const response = await fetch(`${baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: selectedModel,
                        messages: chatHistory,
                        stream: true
                    })
                });

                if (!response.ok) {
                    if (response.status === 429) {
                        retryCount++;
                        if (retryCount <= MAX_RETRY_COUNT) {
                            const retryAfter = response.headers.get('Retry-After');
                            const serverWaitTime = retryAfter ? parseInt(retryAfter) * 1000 : 0;
                            const exponentialWait = Math.pow(2, retryCount) * 8000;
                            const waitTime = Math.min(Math.max(serverWaitTime, exponentialWait), MAX_RETRY_DELAY);

                            chatMessages.removeChild(loading);
                            const waitMsg = document.createElement('div');
                            waitMsg.className = 'message ai';
                            waitMsg.textContent = `请求过于频繁，${Math.ceil(waitTime / 1000)}秒后重试...(${retryCount}/${MAX_RETRY_COUNT})`;
                            chatMessages.appendChild(waitMsg);
                            chatMessages.scrollTop = chatMessages.scrollHeight;

                            await new Promise(resolve => setTimeout(resolve, waitTime));

                            chatMessages.removeChild(waitMsg);
                            await getAIReply();
                            return;
                        } else {
                            chatMessages.removeChild(loading);
                            isInCooldown = true;
                            cooldownEndTime = Date.now() + 30000;
                            const cooldownMsg = document.createElement('div');
                            cooldownMsg.className = 'message ai error';
                            cooldownMsg.textContent = '请求过于频繁，请30秒后再试';
                            chatMessages.appendChild(cooldownMsg);
                            chatMessages.scrollTop = chatMessages.scrollHeight;
                            setTimeout(() => { isInCooldown = false; retryCount = 0; }, 30000);
                            return;
                        }
                    }
                    chatMessages.removeChild(loading);
                    throw new Error(`API请求失败，状态码：${response.status}`);
                }

                retryCount = 0;

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let fullText = '';
                let aiMsg = null;

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const lines = decoder.decode(value, { stream: true }).split('\n');
                    for (const line of lines) {
                        if (!line.startsWith('data: ')) continue;
                        const data = line.slice(6).trim();
                        if (data === '[DONE]') continue;

                        try {
                            const json = JSON.parse(data);
                            let content = json.choices[0]?.delta?.content || '';
                            if (!content) continue;

                            // 处理Markdown格式
                            content = content.replace(/\*\*/g, '');

                            if (!aiMsg) {
                                chatMessages.removeChild(loading);
                                aiMsg = document.createElement('div');
                                aiMsg.className = 'message ai';
                                aiMsg.style.whiteSpace = 'pre-wrap';
                                aiMsg.style.wordBreak = 'break-word';
                                chatMessages.appendChild(aiMsg);
                            }

                            fullText += content;
                            aiMsg.textContent = fullText;
                            chatMessages.scrollTop = chatMessages.scrollHeight;
                        } catch (e) {
                            // 解析错误时继续
                        }
                    }
                }

                chatHistory.push({ role: 'assistant', content: fullText });
                saveChatHistory();

            } catch (error) {
                console.error('API调用错误：', error);
                const errorMsg = document.createElement('div');
                errorMsg.className = 'message ai error';
                errorMsg.textContent = `错误：${error.message}`;
                chatMessages.appendChild(errorMsg);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }
    }
})();