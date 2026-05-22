/* ========== 课程探究模块 - 小组讨论功能 ========== */
var discussionApiKey = '795328bbbb4442f8a2258b0642cb1988.s4a6GtVcMTluclRR';
var discussionBaseUrl = 'https://open.bigmodel.cn/api/paas/v4';

var currentDiscussionTopic = null;
var discussionHistory = [];
var isDiscussionActive = false;
var selectedGroupMembers = [];
var isWaitingForUser = false; // 是否正在等待用户回答
var currentTurnCount = 0; // 当前轮次AI成员发言计数
var responsesPerTurn = 2; // 每轮AI成员发言数量（2-3人）
var discussionRound = 0; // 讨论轮数（用户发言次数）
var maxRoundsBeforeGuide = 3; // 多少轮后老师介入引导

// 讨论行为配置（可调节）
var discussionConfig = {
    responseCount: 'random', // 'random' 随机1-2人, 'all' 全部成员, 数字表示固定人数
    responseDelay: 1500, // 用户发言后AI开始回应的延迟时间(ms)
    memberInterval: 1500, // AI成员之间的发言间隔时间(ms)
    minResponses: 1, // 最少回应人数
    maxResponses: 2 // 最多回应人数
};

// 讨论课题题库
var discussionTopics = [
    { id: 1, topic: "讨论喀斯特地貌对当地农业发展的影响，分析有利条件和不利条件", category: "农业", 
      followUpQuestions: [
        "如果在喀斯特地区发展特色农业，你认为哪些作物最适合种植？",
        "如何解决喀斯特地区土壤贫瘠和水资源短缺的问题？",
        "喀斯特地貌对农业机械化有哪些挑战？"
      ]},
    { id: 2, topic: "对比桂林和贵州的喀斯特地貌特征，分析它们在形成原因上的异同", category: "地貌对比",
      followUpQuestions: [
        "桂林山水和贵州石林的景观差异背后有哪些地质因素？",
        "气候条件如何影响喀斯特地貌的发育？",
        "人类活动对喀斯特地貌景观有哪些影响？"
      ]},
    { id: 3, topic: "探讨喀斯特地区水资源保护的重要性和可行措施", category: "水资源",
      followUpQuestions: [
        "喀斯特地区地下水系统有什么特点？",
        "如何平衡喀斯特地区水资源开发与生态保护的关系？",
        "溶洞旅游开发会对地下水资源造成哪些影响？"
      ]},
    { id: 4, topic: "分析喀斯特地貌对当地旅游业发展的影响", category: "旅游",
      followUpQuestions: [
        "喀斯特旅游资源开发如何带动当地经济发展？",
        "如何在发展旅游的同时保护喀斯特生态环境？",
        "除了观光旅游，喀斯特地区还可以发展哪些特色旅游项目？"
      ]},
    { id: 5, topic: "讨论溶洞形成的地质条件和过程", category: "地质",
      followUpQuestions: [
        "溶洞中的钟乳石和石笋是如何形成的？",
        "溶洞的形成需要多长时间？",
        "为什么有些溶洞会形成奇特的景观？"
      ]}
];

// 小组成员配置
var groupMembers = [
    { name: '张同学', avatar: '💬', role: '辩驳型', personality: 'contrarian' },
    { name: '李同学', avatar: '✨', role: '优化型', personality: 'optimizing' },
    { name: '王同学', avatar: '👍', role: '认同型', personality: 'agreeing' }
];

// DOM 元素
var discussionTopicEl = null;
var discussionMessagesEl = null;
var discussionInput = null;
var sendDiscussionBtn = null;
var startDiscussionBtn = null;
var summarizeBtn = null;
var discussionSummaryEl = null;
var selectionTipEl = null;

// 初始化成员选择
function initMemberSelection() {
    var selectableCards = document.querySelectorAll('.member-card.selectable');
    selectableCards.forEach(function(card) {
        card.classList.add('selected');
        card.addEventListener('click', function() {
            if (isDiscussionActive) return;
            this.classList.toggle('selected');
        });
    });
}

// 获取选中的成员
function getSelectedMembers() {
    var selectedCards = document.querySelectorAll('.member-card.selectable.selected');
    var members = [];
    selectedCards.forEach(function(card) {
        var memberId = card.dataset.memberId;
        var member = groupMembers.find(function(m) {
            return m.personality === memberId;
        });
        if (member) members.push(member);
    });
    return members;
}

// 添加讨论消息
function addDiscussionMessage(avatar, name, role, content) {
    var messageEl = document.createElement('div');
    messageEl.className = 'discussion-message';
    
    var avatarEl = document.createElement('div');
    avatarEl.className = 'message-avatar';
    avatarEl.textContent = avatar;
    
    var contentEl = document.createElement('div');
    contentEl.className = 'message-content';
    
    var headerEl = document.createElement('div');
    headerEl.className = 'message-header';
    headerEl.innerHTML = '<span class="message-name">' + name + '</span>';
    if (role) {
        headerEl.innerHTML += '<span class="message-role">' + role + '</span>';
    }
    
    var textEl = document.createElement('div');
    textEl.className = 'message-text';
    textEl.textContent = content;
    
    contentEl.appendChild(headerEl);
    contentEl.appendChild(textEl);
    messageEl.appendChild(avatarEl);
    messageEl.appendChild(contentEl);
    
    discussionMessagesEl.appendChild(messageEl);
    discussionMessagesEl.scrollTop = discussionMessagesEl.scrollHeight;
}

// 添加用户提示消息（轮到用户发言）
function addUserPrompt() {
    var promptEl = document.createElement('div');
    promptEl.className = 'discussion-prompt';
    promptEl.innerHTML = '<span class="prompt-icon">🙋</span><span class="prompt-text">轮到你发言了！请发表你的观点或回应其他同学的看法。</span><button class="prompt-skip-btn" onclick="skipUserTurn()">跳过</button>';
    discussionMessagesEl.appendChild(promptEl);
    discussionMessagesEl.scrollTop = discussionMessagesEl.scrollHeight;
    isWaitingForUser = true;
    // 聚焦输入框
    discussionInput.focus();
}

// 跳过用户发言
function skipUserTurn() {
    // 移除用户提示
    var prompts = document.querySelectorAll('.discussion-prompt');
    prompts.forEach(function(p) { p.remove(); });
    
    isWaitingForUser = false;
    currentTurnCount = 0;
    discussionHistory.push({ role: 'system', content: '用户选择跳过发言' });
    
    // 增加讨论轮数（跳过也算一轮）
    discussionRound++;
    
    // 检查是否需要老师引导
    if (discussionRound >= maxRoundsBeforeGuide && !isTeacherGuiding) {
        setTimeout(teacherGuide, 1000);
        return;
    }
    
    // 继续AI成员讨论
    setTimeout(generateAIMemberResponses, 1000);
}

// 生成AI成员消息
function generateAIMemberMessage(member, callback) {
    var personalityPrompt = getPersonalityPrompt(member.personality);
    var recentMessages = discussionHistory.slice(-5);
    var context = recentMessages.map(function(m) {
        return (m.role === 'user' ? '你：' : m.role === 'assistant' ? '同学：' : '') + m.content;
    }).join('\n');
    
    var prompt = `你是${member.name}，性格是${member.role}。${personalityPrompt}\n\n讨论课题：${currentDiscussionTopic.topic}\n\n最近讨论：\n${context}\n\n请用简短的一段话发表你的观点，保持自然口语化，不要超过150字。`;
    
    fetch(discussionBaseUrl + '/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + discussionApiKey },
        body: JSON.stringify({
            model: 'glm-4-flash',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 100
        })
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        if (data.choices && data.choices[0]) {
            addDiscussionMessage(member.avatar, member.name, member.role, data.choices[0].message.content);
            discussionHistory.push({ role: 'assistant', content: data.choices[0].message.content });
            if (callback) callback();
        }
    })
    .catch(function(error) {
        console.error('API调用失败:', error);
        var defaultResponses = getDefaultResponses(member.personality);
        var response = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
        addDiscussionMessage(member.avatar, member.name, member.role, response);
        discussionHistory.push({ role: 'assistant', content: response });
        if (callback) callback();
    });
}

// 生成多个AI成员回应
function generateAIMemberResponses() {
    // 如果正在等待用户发言，不生成新的AI回应
    if (isWaitingForUser) {
        console.log('正在等待用户发言，跳过AI回应');
        return;
    }
    
    var membersToUse = selectedGroupMembers.length > 0 ? selectedGroupMembers : groupMembers;
    var shuffledMembers = [...membersToUse].sort(() => Math.random() - 0.5);
    
    // 随机决定本轮发言人数（2-3人）
    var count = Math.min(shuffledMembers.length, Math.floor(Math.random() * 2) + 2);
    var interval = discussionConfig.memberInterval;
    currentTurnCount = 0;
    
    // 依次生成AI成员回应
    function generateNext(index) {
        if (index >= count || index >= shuffledMembers.length) {
            // 所有成员发言完毕，等待用户发言
            setTimeout(function() {
                addUserPrompt();
            }, 1500);
            return;
        }
        
        setTimeout(function() {
            generateAIMemberMessage(shuffledMembers[index], function() {
                currentTurnCount++;
                generateNext(index + 1);
            });
        }, interval);
    }
    
    generateNext(0);
}

// 获取回应人数
function getResponseCount(maxAvailable) {
    var config = discussionConfig;
    
    if (typeof config.responseCount === 'number') {
        return Math.min(config.responseCount, maxAvailable);
    }
    
    if (config.responseCount === 'all') {
        return maxAvailable;
    }
    
    // random模式
    var min = Math.max(config.minResponses, 1);
    var max = Math.min(config.maxResponses, maxAvailable);
    
    if (min >= max) {
        return min;
    }
    
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 获取性格提示词
function getPersonalityPrompt(personality) {
    switch(personality) {
        case 'contrarian': return '你喜欢提出不同意见，善于发现问题并提出质疑。';
        case 'optimizing': return '你善于分析问题并提出改进建议。';
        case 'agreeing': return '你倾向于支持他人观点，并会补充更多论据。';
        default: return '你是一个积极参与讨论的学生。';
    }
}

// 获取默认回应
function getDefaultResponses(personality) {
    switch(personality) {
        case 'contrarian':
            return ['我觉得这个观点有待商榷。', '但是有没有考虑到其他方面？', '这个说法可能不太全面。'];
        case 'optimizing':
            return ['我有一个改进的想法。', '或许我们可以从这个角度优化。', '这个方案可以进一步完善。'];
        case 'agreeing':
            return ['我同意这个观点！', '说得很有道理！', '补充一下，这个点确实很重要。'];
        default:
            return ['好的，我来发表一下看法。', '我认为这个问题值得探讨。'];
    }
}

// 发送用户消息
function sendUserMessage() {
    var message = discussionInput.value.trim();
    if (!message) return;
    
    // 移除用户提示
    var prompts = document.querySelectorAll('.discussion-prompt');
    prompts.forEach(function(p) { p.remove(); });
    
    addDiscussionMessage('👤', '你', '', message);
    discussionHistory.push({ role: 'user', content: message });
    discussionInput.value = '';
    isWaitingForUser = false;
    currentTurnCount = 0;
    
    // 增加讨论轮数
    discussionRound++;
    
    // 检查是否需要老师引导
    if (discussionRound >= maxRoundsBeforeGuide && !isTeacherGuiding) {
        setTimeout(teacherGuide, 1500);
        return;
    }
    
    // 使用配置的延迟时间
    setTimeout(generateAIMemberResponses, discussionConfig.responseDelay);
}

// 老师引导讨论
var isTeacherGuiding = false;
function teacherGuide() {
    isTeacherGuiding = true;
    
    // 从课题的进阶问题中随机选择一个
    var followUpQuestions = currentDiscussionTopic && currentDiscussionTopic.followUpQuestions || [];
    var randomIndex = Math.floor(Math.random() * followUpQuestions.length);
    var question = followUpQuestions[randomIndex] || "大家的讨论很深入！让我们从另一个角度思考：喀斯特地貌还会带来哪些影响？";
    
    addDiscussionMessage('👨‍🏫', '老师', '', '同学们讨论得很热烈！我来提一个进阶问题：' + question);
    discussionHistory.push({ role: 'system', content: '老师引导：' + question });
    
    // 重置讨论轮数
    discussionRound = 0;
    
    setTimeout(function() {
        isTeacherGuiding = false;
        // 继续AI成员讨论
        generateAIMemberResponses();
    }, 2000);
}

// 设置讨论配置
function setDiscussionConfig(key, value) {
    if (discussionConfig.hasOwnProperty(key)) {
        discussionConfig[key] = value;
        console.log('讨论配置已更新:', key, value);
    }
}

// 获取当前讨论配置
function getDiscussionConfig() {
    return JSON.parse(JSON.stringify(discussionConfig));
}

// 生成讨论总结
function generateSummary() {
    // 获取按钮元素并禁用
    var btn = document.getElementById('summarizeBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> 生成中...';
    }
    
    // 显示加载状态
    discussionSummaryEl.innerHTML = '<div class="summary-header"><span class="recorder-icon">📝</span><span class="summary-title">讨论总结</span></div><div class="summary-content"><div class="loading-ai"><i class="fa fa-spinner fa-spin"></i><p>记录员正在整理讨论内容...</p></div></div>';
    discussionSummaryEl.classList.remove('hidden');
    
    // 滚动到总结区域
    discussionSummaryEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    var messagesText = discussionHistory.map(function(m) {
        return (m.role === 'user' ? '用户：' : m.role === 'assistant' ? '学生：' : '') + m.content;
    }).join('\n');
    
    var prompt = `请作为记录员陈同学，对以下小组讨论内容进行总结整理：\n\n讨论课题：${currentDiscussionTopic.topic}\n\n讨论内容：\n${messagesText}\n\n请按照以下结构输出总结：\n1. 讨论概述\n2. 主要观点\n3. 争议与共识\n4. 结论与建议\n\n保持简洁明了，使用自然的语言。`;
    
    fetch(discussionBaseUrl + '/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + discussionApiKey },
        body: JSON.stringify({
            model: 'glm-4-flash',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 500
        })
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '生成讨论总结';
        }
        if (data.choices && data.choices[0]) {
            discussionSummaryEl.innerHTML = '<div class="summary-header"><span class="recorder-icon">📝</span><span class="summary-title">讨论总结</span></div><div class="summary-content">' + data.choices[0].message.content.replace(/\n/g, '<br>') + '</div>';
        }
    })
    .catch(function(error) {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '生成讨论总结';
        }
        console.error('总结生成失败:', error);
        discussionSummaryEl.innerHTML = '<div class="summary-header"><span class="recorder-icon">📝</span><span class="summary-title">讨论总结</span></div><div class="summary-content"><p>总结生成失败，请稍后重试。</p></div>';
    });
}

// 设置讨论配置
function setDiscussionConfig(key, value) {
    if (discussionConfig.hasOwnProperty(key)) {
        discussionConfig[key] = value;
        console.log('讨论配置已更新:', key, value);
    }
}

// 获取当前讨论配置
function getDiscussionConfig() {
    return JSON.parse(JSON.stringify(discussionConfig));
}

// 初始化配置面板事件
function initConfigPanel() {
    var responseCountSelect = document.getElementById('responseCountSelect');
    var responseDelaySelect = document.getElementById('responseDelaySelect');
    var memberIntervalSelect = document.getElementById('memberIntervalSelect');
    
    // 回应人数选择
    if (responseCountSelect) {
        responseCountSelect.addEventListener('change', function() {
            var value = this.value;
            if (value === 'random' || value === 'all') {
                setDiscussionConfig('responseCount', value);
            } else {
                setDiscussionConfig('responseCount', parseInt(value));
            }
        });
    }
    
    // 回应延迟选择
    if (responseDelaySelect) {
        responseDelaySelect.addEventListener('change', function() {
            setDiscussionConfig('responseDelay', parseInt(this.value));
        });
    }
    
    // 成员间隔选择
    if (memberIntervalSelect) {
        memberIntervalSelect.addEventListener('change', function() {
            setDiscussionConfig('memberInterval', parseInt(this.value));
        });
    }
}

// 初始化事件监听
function initDiscussionEvents() {
    // 开始讨论
    startDiscussionBtn.addEventListener('click', function() {
        selectedGroupMembers = getSelectedMembers();
        
        if (selectedGroupMembers.length === 0) {
            alert('请至少选择一位小组成员参与讨论！');
            return;
        }
        
        var randomIndex = Math.floor(Math.random() * discussionTopics.length);
        currentDiscussionTopic = discussionTopics[randomIndex];
        
        discussionTopicEl.innerHTML = '<p>' + currentDiscussionTopic.topic + '</p>';
        discussionMessagesEl.innerHTML = '';
        
        addDiscussionMessage('👨‍🏫', '老师', '', '同学们好！今天我们讨论的课题是：' + currentDiscussionTopic.topic + '。请大家积极发言，表达自己的观点。');
        
        discussionInput.disabled = false;
        sendDiscussionBtn.disabled = false;
        startDiscussionBtn.classList.add('hidden');
        summarizeBtn.classList.remove('hidden');
        isDiscussionActive = true;
        
        // 隐藏选择成员提示
        if (selectionTipEl) {
            selectionTipEl.classList.add('hidden');
        }
        
        discussionHistory = [
            { role: 'system', content: '你是一个参与喀斯特地貌课程讨论的学生，需要根据讨论课题发表观点。' },
            { role: 'assistant', content: '讨论课题：' + currentDiscussionTopic.topic }
        ];
        
        if (selectedGroupMembers.length > 0) {
            setTimeout(function() {
                generateAIMemberResponses();
            }, 1500);
        }
    });
    
    // 发送按钮点击
    sendDiscussionBtn.addEventListener('click', sendUserMessage);
    
    // 回车键发送
    discussionInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendUserMessage();
        }
    });
    
    // 生成总结按钮
    summarizeBtn.addEventListener('click', generateSummary);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    discussionTopicEl = document.getElementById('discussionTopic');
    discussionMessagesEl = document.getElementById('discussionMessages');
    discussionInput = document.getElementById('discussionInput');
    sendDiscussionBtn = document.getElementById('sendDiscussionBtn');
    startDiscussionBtn = document.getElementById('startDiscussionBtn');
    summarizeBtn = document.getElementById('summarizeBtn');
    discussionSummaryEl = document.getElementById('discussionSummary');
    selectionTipEl = document.getElementById('selectionTip');
    
    if (discussionTopicEl && discussionMessagesEl && discussionInput && sendDiscussionBtn && startDiscussionBtn && summarizeBtn && discussionSummaryEl) {
        initMemberSelection();
        initDiscussionEvents();
        initConfigPanel();
    }
});