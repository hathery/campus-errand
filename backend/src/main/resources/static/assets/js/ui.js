/* 校园跑 · 通用 UI 工具 */
(function (global) {
    'use strict';

    const icons = {
        logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19c4.8 0 3.9-14 9-14 3.2 0 4.1 3.2 5 5.2"/><circle cx="5" cy="19" r="2.1" fill="currentColor" stroke="none"/><circle cx="19" cy="10.2" r="2.3" fill="currentColor" stroke="none"/><path d="M14 19h4.5" opacity=".55"/></svg>',
        user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c.7-4 3.6-6 7.5-6s6.8 2 7.5 6"/></svg>',
        lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="4.5" y="10" width="15" height="10" rx="2.5"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/><path d="M12 14v2.5"/></svg>',
        phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6.8 3.8l2.2-.5 2 4.2-1.8 1.7a15 15 0 0 0 5.6 5.6l1.7-1.8 4.2 2-.5 2.2c-.3 1.4-1.6 2.3-3 2.2C9.9 19.2 4.8 14.1 4.6 6.8c-.1-1.4.8-2.7 2.2-3z"/></svg>',
        smile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M8.5 14.5c.9 1.3 2.1 2 3.5 2s2.6-.7 3.5-2"/><path d="M9 9.5h.01M15 9.5h.01" stroke-width="2.4"/></svg>',
        home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z"/></svg>',
        compass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.7"/><path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" stroke-linejoin="round"/></svg>',
        plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
        list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4.5" cy="18" r="1" fill="currentColor" stroke="none"/></svg>',
        tasks: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M8 9l2 2 4-4M8 16h8"/></svg>',
        wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a2 2 0 0 1 2 2v12H6.5A2.5 2.5 0 0 1 4 16.5v-9z"/><path d="M4 8h13"/><path d="M15.5 13h4.5v4h-4.5a2 2 0 0 1 0-4z"/></svg>',
        bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 9a6 6 0 1 0-12 0c0 4.5-1.5 6-1.5 6h15S18 13.5 18 9z"/><path d="M9.8 19a2.5 2.5 0 0 0 4.4 0"/></svg>',
        logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M14 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8"/><path d="M17 8l4 4-4 4M10 12h11"/></svg>',
        search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="10.8" cy="10.8" r="6.2"/><path d="M15.5 15.5L20 20"/></svg>',
        clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/></svg>',
        pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 10c0 5.2-6 10-6 10S6 15.2 6 10a6 6 0 1 1 12 0z"/><circle cx="12" cy="10" r="2.2"/></svg>',
        star: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 3.5l2.5 5.1 5.6.8-4 4 .9 5.6-5-2.7-5 2.7.9-5.6-4-4 5.6-.8L12 3.5z"/></svg>',
        arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 12h14M14 7l5 5-5 5"/></svg>',
        chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 5l7 7-7 7"/></svg>',
        close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
        check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l5 5L20 6.5"/></svg>',
        shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5.5c0 4.5-3 7.8-7 9.5-4-1.7-7-5-7-9.5V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>',
        runner: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="14.5" cy="4.8" r="2"/><path d="M12.5 9l3.5 1.5 2 4.5M12 8l-2.5 4.5L6 14M10 13l3 2-1.5 5M13 15l3.5 3.5"/></svg>',
        edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 20h4.5L20 8.5 15.5 4 4 15.5V20z"/><path d="M13.5 6l4.5 4.5"/></svg>',
        refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M20 11a8 8 0 1 0-2 6.5"/><path d="M20 5v6h-6"/></svg>',
        box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8l8-4 8 4-8 4-8-4z"/><path d="M4 8v8l8 4 8-4V8M12 12v8"/></svg>',
        food: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 3v7a3 3 0 0 0 6 0V3M8 3v18M17 3c-1.5 2-2 4.5-2 7h4V3h-2zM19 10v11"/></svg>',
        print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="7" rx="2"/><path d="M7 14h10v6H7z"/></svg>',
        cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2l2.5 11h10L20 7H6"/><circle cx="9" cy="19" r="1.3"/><circle cx="17" cy="19" r="1.3"/></svg>',
        spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/><path d="M18.5 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z"/></svg>',
        menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
        dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>',
        users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="9" cy="8" r="3.2"/><path d="M3 19c.6-3.6 3-5.3 6-5.3s5.4 1.7 6 5.3"/><path d="M16 5.2a3 3 0 0 1 0 5.6M17.5 13.8c2.1.5 3.3 2.1 3.7 4.6"/></svg>',
        orders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z"/><path d="M9 8h6M9 12h6"/></svg>',
        audit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l4 4v14H6V3z"/><path d="M15 3v4h4"/><path d="M9 12l2 2 4-4"/></svg>',
        trend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5M4 19h16"/><path d="M7 15l4-5 3 3 5-6"/></svg>',
        coin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M9 8h4.2a2 2 0 0 1 0 4H10.5m0 0V16m-1-4h5M10.5 8v8"/></svg>',
        trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v4a4 4 0 0 1-8 0V4z"/><path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 12v5M8.5 21h7l-1-4h-5l-1 4z"/></svg>',
        alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 4L3.5 20h17L12 4z"/><path d="M12 10v4M12 17h.01" stroke-width="2"/></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01" stroke-width="2"/></svg>',
        eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 12s3.3-5.5 9-5.5S21 12 21 12s-3.3 5.5-9 5.5S3 12 3 12z"/><circle cx="12" cy="12" r="2.4"/></svg>',
        upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/></svg>',
        calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/></svg>',
        message: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4V5z"/><path d="M8 9h8M8 12h5"/></svg>',
        filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 5h16l-6 7v6l-4 2v-8L4 5z"/></svg>',
        copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>',
        settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 0 0-1.7-1L14.5 3h-5L9 6a7 7 0 0 0-1.7 1L5 6l-2 3.4 2 1.5a7 7 0 0 0 0 2L3 14.4 5 18l2.3-1a7 7 0 0 0 1.7 1l.5 3h5l.5-3a7 7 0 0 0 1.7-1l2.3 1 2-3.5-2-1.5c.1-.3.1-.7.1-1z"/></svg>',
        'arrow-up-right': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M7 17L17 7M9 7h8v8"/></svg>'
    };

    function icon(name, className) {
        const raw = icons[name] || icons.info;
        return raw.replace('<svg ', '<svg class="' + (className || '') + '" ');
    }

    function escapeHtml(value) {
        if (value === null || value === undefined) return '';
        return String(value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    function money(value) {
        const n = Number(value || 0);
        return n.toFixed(2);
    }

    function shortMoney(value) {
        const n = Number(value || 0);
        return Number.isInteger(n) ? String(n) : n.toFixed(2);
    }

    function parseDate(value) {
        if (!value) return null;
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
    }

    function dateTime(value) {
        const date = parseDate(value);
        if (!date) return '—';
        const pad = n => String(n).padStart(2, '0');
        return (date.getMonth() + 1) + '月' + date.getDate() + '日 ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
    }

    function fullDateTime(value) {
        const date = parseDate(value);
        if (!date) return '—';
        const pad = n => String(n).padStart(2, '0');
        return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) +
            ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
    }

    function timeAgo(value) {
        const date = parseDate(value);
        if (!date) return '';
        const diff = Math.floor((Date.now() - date.getTime()) / 1000);
        if (diff < 60) return '刚刚';
        if (diff < 3600) return Math.floor(diff / 60) + ' 分钟前';
        if (diff < 86400) return Math.floor(diff / 3600) + ' 小时前';
        if (diff < 86400 * 7) return Math.floor(diff / 86400) + ' 天前';
        return fullDateTime(value).slice(0, 10);
    }

    function greeting() {
        const hour = new Date().getHours();
        if (hour < 6) return '夜深了';
        if (hour < 11) return '早上好';
        if (hour < 14) return '中午好';
        if (hour < 18) return '下午好';
        return '晚上好';
    }

    const typeMeta = {
        EXPRESS: { label: '取快递', icon: 'box', cls: '' },
        FOOD: { label: '代买餐食', icon: 'food', cls: 'food' },
        PRINT: { label: '打印代办', icon: 'print', cls: 'print' },
        PURCHASE: { label: '代购物品', icon: 'cart', cls: 'purchase' },
        OTHER: { label: '其他帮忙', icon: 'spark', cls: 'other' }
    };

    const statusMeta = {
        PENDING: { label: '待接单', cls: 'pending' },
        ACCEPTED: { label: '已接单', cls: 'accepted' },
        PICKED_UP: { label: '配送中', cls: 'picked' },
        DELIVERED: { label: '已送达', cls: 'delivered' },
        COMPLETED: { label: '已完成', cls: 'completed' },
        CANCELLED: { label: '已取消', cls: 'cancelled' }
    };

    function typeInfo(type) {
        return typeMeta[type] || { label: type || '其他', icon: 'spark', cls: 'other' };
    }

    function statusInfo(status) {
        return statusMeta[status] || { label: status || '未知', cls: 'cancelled' };
    }

    function avatar(name, url, size) {
        const cls = 'avatar ' + (size || 'avatar-sm');
        if (url) {
            return '<span class="' + cls + '"><img src="' + escapeHtml(url) + '" alt=""></span>';
        }
        const letter = (name || '同').trim().charAt(0).toUpperCase();
        return '<span class="' + cls + '">' + escapeHtml(letter) + '</span>';
    }

    function stars(rating) {
        const n = Number(rating || 0);
        let out = '';
        for (let i = 1; i <= 5; i++) out += i <= n ? '★' : '☆';
        return '<span class="stars">' + out + '</span>';
    }

    function toast(message, type) {
        let root = document.getElementById('toastRoot');
        if (!root) {
            root = document.createElement('div');
            root.id = 'toastRoot';
            root.className = 'toast-root';
            document.body.appendChild(root);
        }
        const el = document.createElement('div');
        el.className = 'toast ' + (type || '');
        const iconName = type === 'error' ? 'alert' : (type === 'warn' ? 'info' : 'check');
        el.innerHTML = icon(iconName) + '<span>' + escapeHtml(message) + '</span>';
        root.appendChild(el);
        setTimeout(() => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(-6px)';
            el.style.transition = 'all .25s';
            setTimeout(() => el.remove(), 260);
        }, 3200);
    }

    let modalEl = null;

    function modal(options) {
        closeModal();
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        backdrop.innerHTML = '<div class="modal ' + (options.size || '') + '" role="dialog" aria-modal="true">' +
            '<div class="modal-head"><div><h3>' + escapeHtml(options.title || '') + '</h3>' +
            (options.subtitle ? '<p>' + escapeHtml(options.subtitle) + '</p>' : '') + '</div>' +
            '<button class="icon-btn" type="button" data-close aria-label="关闭">' + icon('close') + '</button></div>' +
            '<div class="modal-body">' + (options.body || '') + '</div>' +
            (options.footer ? '<div class="modal-foot">' + options.footer + '</div>' : '') +
            '</div>';
        backdrop.addEventListener('click', event => {
            if (event.target === backdrop || event.target.closest('[data-close]')) closeModal();
        });
        document.body.appendChild(backdrop);
        document.body.style.overflow = 'hidden';
        modalEl = backdrop;
        return backdrop;
    }

    function closeModal() {
        if (modalEl) {
            modalEl.remove();
            modalEl = null;
        }
        document.body.style.overflow = '';
    }

    function confirmDialog(options) {
        return new Promise(resolve => {
            let settled = false;
            const backdrop = modal({
                title: options.title || '确认操作',
                subtitle: options.message || '',
                body: options.body || '',
                footer: '<button class="btn btn-outline" type="button" data-cancel>取消</button>' +
                    '<button class="btn ' + (options.danger ? 'btn-danger' : 'btn-primary') + '" type="button" data-ok>' +
                    escapeHtml(options.confirmText || '确认') + '</button>'
            });
            const finish = value => {
                if (settled) return;
                settled = true;
                closeModal();
                resolve(value);
            };
            backdrop.querySelector('[data-ok]').addEventListener('click', () => finish(true));
            backdrop.querySelector('[data-cancel]').addEventListener('click', () => finish(false));
            backdrop.addEventListener('click', event => {
                if (event.target === backdrop || event.target.closest('[data-close]')) finish(false);
            });
        });
    }

    function emptyState(iconName, title, text, actionHtml) {
        return '<div class="empty"><div class="empty-icon">' + icon(iconName) + '</div>' +
            '<h3>' + escapeHtml(title) + '</h3><p>' + escapeHtml(text || '') + '</p>' +
            (actionHtml || '') + '</div>';
    }

    function pager(data, prefix) {
        if (!data || data.pages <= 1) return '';
        const page = Number(data.page || 1);
        const pages = Number(data.pages || 1);
        let start = Math.max(1, page - 2);
        let end = Math.min(pages, start + 4);
        start = Math.max(1, end - 4);
        let html = '<div class="pager" data-pager="' + (prefix || '') + '">';
        html += '<button data-page="' + (page - 1) + '" ' + (page <= 1 ? 'disabled' : '') + '>‹</button>';
        for (let i = start; i <= end; i++) {
            html += '<button data-page="' + i + '" class="' + (i === page ? 'active' : '') + '">' + i + '</button>';
        }
        html += '<button data-page="' + (page + 1) + '" ' + (page >= pages ? 'disabled' : '') + '>›</button>';
        html += '<span class="pager-info">共 ' + data.total + ' 条</span></div>';
        return html;
    }

    function debounce(fn, wait) {
        let timer = null;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), wait || 300);
        };
    }

    function query(params) {
        return Object.keys(params)
            .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
            .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
            .join('&');
    }

    function skeletonOrder() {
        return '<div class="order-card" style="grid-template-columns:1fr"><div>' +
            '<div class="skeleton" style="height:14px;width:42%;margin-bottom:12px"></div>' +
            '<div class="skeleton" style="height:10px;width:70%;margin-bottom:12px"></div>' +
            '<div class="skeleton" style="height:10px;width:55%"></div></div></div>';
    }

    function hydrateIcons(root) {
        (root || document).querySelectorAll('[data-icon]').forEach(el => {
            const name = el.getAttribute('data-icon');
            const cls = el.getAttribute('data-icon-class') || '';
            el.innerHTML = icon(name, cls);
        });
    }

    function formatDateInput(date) {
        const pad = n => String(n).padStart(2, '0');
        return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) +
            'T' + pad(date.getHours()) + ':' + pad(date.getMinutes());
    }

    global.UI = {
        icon, escapeHtml, money, shortMoney, dateTime, fullDateTime, timeAgo, greeting,
        typeInfo, statusInfo, avatar, stars, toast, modal, closeModal, confirmDialog,
        emptyState, pager, debounce, query, skeletonOrder, hydrateIcons, formatDateInput,
        typeMeta, statusMeta
    };
})(window);
