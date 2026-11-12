/* 校园跑 · API 客户端 */
(function (global) {
    'use strict';

    const TOKEN_KEY = 'campusrun_token';
    const USER_KEY = 'campusrun_user';

    function token() {
        return localStorage.getItem(TOKEN_KEY) || '';
    }

    function user() {
        try {
            return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
        } catch (e) {
            return null;
        }
    }

    function setSession(data) {
        if (!data) return;
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }

    function updateUser(data) {
        if (data) localStorage.setItem(USER_KEY, JSON.stringify(data));
    }

    function clear() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }

    function logout() {
        clear();
        location.href = 'index.html';
    }

    function requireAuth(role) {
        const current = user();
        if (!token() || !current) {
            location.href = 'index.html';
            return false;
        }
        if (role && current.role !== role) {
            location.href = current.role === 'ADMIN' ? 'admin.html' : 'user.html';
            return false;
        }
        return true;
    }

    async function request(path, options) {
        const opts = options || {};
        const headers = Object.assign({}, opts.headers || {});
        const authToken = token();
        if (authToken) headers['Authorization'] = 'Bearer ' + authToken;
        let body = opts.body;
        if (body !== undefined && body !== null && !(body instanceof FormData)) {
            headers['Content-Type'] = 'application/json;charset=UTF-8';
            body = typeof body === 'string' ? body : JSON.stringify(body);
        }

        let response;
        try {
            response = await fetch('/api' + path, {
                method: opts.method || 'GET',
                headers,
                body,
                cache: 'no-store'
            });
        } catch (e) {
            throw new Error('网络连接失败，请确认服务已启动');
        }

        let payload = null;
        try {
            payload = await response.json();
        } catch (e) {
            payload = null;
        }

        if (response.status === 401) {
            clear();
            if (!location.pathname.endsWith('index.html') && location.pathname !== '/') {
                location.href = 'index.html?expired=1';
            }
            throw new Error((payload && payload.message) || '登录已过期，请重新登录');
        }
        if (!response.ok || !payload || payload.code !== 0) {
            const message = (payload && payload.message) || ('请求失败（' + response.status + '）');
            const error = new Error(message);
            error.status = response.status;
            error.payload = payload;
            throw error;
        }
        return payload.data;
    }

    const API = {
        token, user, setSession, updateUser, clear, logout, requireAuth,
        get: (path, params) => request(path + (params ? '?' + UI.query(params) : '')),
        post: (path, body) => request(path, { method: 'POST', body }),
        put: (path, body) => request(path, { method: 'PUT', body }),
        upload: (path, formData) => request(path, { method: 'POST', body: formData }),

        login: (username, password) => request('/auth/login', { method: 'POST', body: { username, password } }),
        register: payload => request('/auth/register', { method: 'POST', body: payload }),
        publicStats: () => request('/public/stats'),

        profile: () => request('/user/profile'),
        updateProfile: payload => request('/user/profile', { method: 'PUT', body: payload }),
        changePassword: payload => request('/user/password', { method: 'PUT', body: payload }),
        recharge: amount => request('/user/recharge', { method: 'POST', body: { amount } }),
        walletTxns: (page, size) => request('/user/wallet/transactions?' + UI.query({ page, size })),
        applyRunner: payload => request('/user/runner/apply', { method: 'POST', body: payload }),
        myRunnerApply: () => request('/user/runner/apply'),
        runnerStats: () => request('/user/runner/stats'),

        hall: params => request('/orders/hall?' + UI.query(params)),
        quote: (type, urgent, weight) => request('/orders/quote?' + UI.query({ type, urgent, weight })),
        publishOrder: payload => request('/orders', { method: 'POST', body: payload }),
        myPublished: params => request('/orders/mine/published?' + UI.query(params)),
        myAccepted: params => request('/orders/mine/accepted?' + UI.query(params)),
        orderDetail: id => request('/orders/' + id),
        acceptOrder: id => request('/orders/' + id + '/accept', { method: 'POST' }),
        pickupOrder: id => request('/orders/' + id + '/pickup', { method: 'POST' }),
        deliverOrder: id => request('/orders/' + id + '/deliver', { method: 'POST' }),
        completeOrder: id => request('/orders/' + id + '/complete', { method: 'POST' }),
        cancelOrder: (id, reason) => request('/orders/' + id + '/cancel', { method: 'POST', body: { reason } }),
        reviewOrder: (id, payload) => request('/orders/' + id + '/review', { method: 'POST', body: payload }),

        notifications: (page, size) => request('/notifications?' + UI.query({ page, size })),
        unreadCount: () => request('/notifications/unread-count'),
        readNotification: id => request('/notifications/' + id + '/read', { method: 'PUT' }),
        readAllNotifications: () => request('/notifications/read-all', { method: 'PUT' }),

        adminDashboard: () => request('/admin/dashboard'),
        adminUsers: params => request('/admin/users?' + UI.query(params)),
        adminSetUserStatus: (id, status) => request('/admin/users/' + id + '/status?status=' + status, { method: 'PUT' }),
        adminApplies: params => request('/admin/runner-applies?' + UI.query(params)),
        adminAudit: (id, payload) => request('/admin/runner-applies/' + id + '/audit', { method: 'PUT', body: payload }),
        adminOrders: params => request('/admin/orders?' + UI.query(params)),
        adminCancelOrder: (id, reason) => request('/admin/orders/' + id + '/cancel', { method: 'POST', body: { reason } })
    };

    global.API = API;
})(window);
