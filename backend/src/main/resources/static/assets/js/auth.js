/* 校园跑 · 登录注册页 */
(function () {
    'use strict';

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabs = document.querySelectorAll('.auth-tab');
    const ink = document.getElementById('authTabInk');
    const title = document.getElementById('authTitle');
    const subtitle = document.getElementById('authSubtitle');
    let currentTab = 'login';

    document.getElementById('brandMark').innerHTML = UI.icon('logo');
    const mobileBrand = document.getElementById('brandMarkMobile');
    if (mobileBrand) mobileBrand.innerHTML = UI.icon('logo');
    UI.hydrateIcons();

    function setTab(tab) {
        currentTab = tab;
        tabs.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
        ink.classList.toggle('right', tab === 'register');
        loginForm.classList.toggle('hidden', tab !== 'login');
        registerForm.classList.toggle('hidden', tab !== 'register');
        if (tab === 'register') {
            title.textContent = '加入校园跑';
            subtitle.textContent = '注册后即可发布需求，也可以申请成为跑腿员';
        } else {
            title.textContent = '欢迎回来';
            subtitle.textContent = '登录后继续你的校园互助';
        }
        clearErrors();
    }

    tabs.forEach(btn => btn.addEventListener('click', () => setTab(btn.dataset.tab)));
    document.querySelectorAll('[data-auth-tab]').forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            setTab(link.dataset.authTab);
            document.getElementById('login').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    document.querySelectorAll('[data-pwd]').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = document.getElementById(btn.dataset.pwd);
            const show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            btn.textContent = show ? '隐藏' : '显示';
        });
    });

    document.querySelectorAll('.demo-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.getElementById('loginUsername').value = chip.dataset.user;
            document.getElementById('loginPassword').value = chip.dataset.pass;
            setTab('login');
            document.getElementById('loginBtn').focus();
            UI.toast('已填入 ' + chip.querySelector('b').textContent + ' 的演示账号');
        });
    });

    function clearErrors() {
        document.getElementById('loginError').classList.remove('show');
        document.getElementById('registerError').classList.remove('show');
    }

    function showError(id, message) {
        const el = document.getElementById(id);
        el.textContent = message;
        el.classList.add('show');
    }

    function setLoading(button, loading, text) {
        button.disabled = loading;
        if (loading) {
            button.dataset.text = button.innerHTML;
            button.textContent = text || '请稍候…';
        } else if (button.dataset.text) {
            button.innerHTML = button.dataset.text;
        }
    }

    loginForm.addEventListener('submit', async event => {
        event.preventDefault();
        clearErrors();
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        if (!username || !password) {
            showError('loginError', '请输入用户名和密码');
            return;
        }
        const button = document.getElementById('loginBtn');
        setLoading(button, true, '正在登录…');
        try {
            const data = await API.login(username, password);
            API.setSession(data);
            UI.toast('登录成功，欢迎回来');
            setTimeout(() => {
                location.href = data.user.role === 'ADMIN' ? 'admin.html' : 'user.html';
            }, 260);
        } catch (error) {
            showError('loginError', error.message);
            setLoading(button, false);
        }
    });

    registerForm.addEventListener('submit', async event => {
        event.preventDefault();
        clearErrors();
        const username = document.getElementById('regUsername').value.trim();
        const nickname = document.getElementById('regNickname').value.trim();
        const phone = document.getElementById('regPhone').value.trim();
        const password = document.getElementById('regPassword').value;
        const agreed = document.getElementById('regAgree').checked;
        if (!/^[a-zA-Z0-9_]{4,20}$/.test(username)) {
            showError('registerError', '用户名需为 4-20 位字母、数字或下划线');
            return;
        }
        if (!/^1[3-9]\d{9}$/.test(phone)) {
            showError('registerError', '请输入正确的 11 位手机号');
            return;
        }
        if (password.length < 6 || password.length > 20) {
            showError('registerError', '密码长度需为 6-20 位');
            return;
        }
        if (!agreed) {
            showError('registerError', '请先阅读并同意服务协议');
            return;
        }
        const button = document.getElementById('registerBtn');
        setLoading(button, true, '正在创建账号…');
        try {
            const data = await API.register({ username, password, nickname, phone });
            API.setSession(data);
            UI.toast('账号创建成功');
            setTimeout(() => { location.href = 'user.html'; }, 260);
        } catch (error) {
            showError('registerError', error.message);
            setLoading(button, false);
        }
    });

    API.publicStats().then(stats => {
        document.getElementById('heroOrders').textContent = stats.orderCount;
        document.getElementById('statUsers').textContent = stats.userCount;
        document.getElementById('statCompleted').textContent = stats.completedCount;
        document.getElementById('statRate').innerHTML = stats.completionRate + '<i>%</i>';
    }).catch(() => {});

    if (new URLSearchParams(location.search).get('expired')) {
        UI.toast('登录已过期，请重新登录', 'warn');
    }
    if (location.hash === '#register') setTab('register');
})();
