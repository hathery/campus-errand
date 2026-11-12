/* 校园跑 · 管理后台 */
(function () {
    'use strict';

    if (!API.requireAuth('ADMIN')) return;

    const page = document.getElementById('page');
    const state = {
        me: API.user(),
        route: 'dashboard',
        dashboard: null,
        applies: { status: 'PENDING', page: 1, size: 10 },
        users: { keyword: '', status: '', page: 1, size: 10 },
        orders: { status: '', keyword: '', page: 1, size: 10 }
    };
    let routeSeq = 0;

    const titles = {
        dashboard: ['数据看板', '校园跑运营概览'],
        applies: ['跑腿员审核', '核验身份，维护校园跑腿服务质量'],
        users: ['用户管理', '查看与维护校园用户账号'],
        orders: ['订单监管', '处理异常订单，保障交易双方权益']
    };

    const typeColors = {
        EXPRESS: '#155e4b', FOOD: '#f2a93b', PRINT: '#4a72c9',
        PURCHASE: '#8a5ab0', OTHER: '#7f9a72'
    };

    function setPage(html) {
        page.innerHTML = html;
        UI.hydrateIcons(page);
    }

    function renderChrome() {
        const me = state.me || {};
        document.getElementById('adminSideName').textContent = me.nickname || '管理员';
        document.getElementById('adminSideAvatar').innerHTML = UI.avatar(me.nickname, me.avatar, 'avatar-sm');
        document.getElementById('adminTopAvatar').innerHTML = UI.avatar(me.nickname, me.avatar, 'avatar-md topbar-avatar');
    }

    function setActiveNav(route) {
        document.querySelectorAll('[data-route]').forEach(el => el.classList.toggle('active', el.dataset.route === route));
        const meta = titles[route] || titles.dashboard;
        document.getElementById('adminTitle').innerHTML = UI.escapeHtml(meta[0]) + '<small>' + UI.escapeHtml(meta[1]) + '</small>';
    }

    function renderRoute() {
        const hash = (location.hash || '#dashboard').replace('#', '');
        const route = titles[hash] ? hash : 'dashboard';
        state.route = route;
        const seq = ++routeSeq;
        setActiveNav(route);
        page.onclick = null;
        UI.closeModal();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        ({
            dashboard: pageDashboard,
            applies: pageApplies,
            users: pageUsers,
            orders: pageOrders
        })[route](seq);
    }

    function current(seq) {
        return seq === routeSeq && state.route === (location.hash || '#dashboard').replace('#', '');
    }

    /* ================= 数据看板 ================= */
    async function pageDashboard(seq) {
        setPage('<div class="skeleton" style="height:110px;border-radius:16px;margin-bottom:14px"></div>' +
            '<div class="skeleton" style="height:260px;border-radius:16px"></div>');
        try {
            const data = await API.adminDashboard();
            if (!current(seq)) return;
            state.dashboard = data;
            const max = Math.max(1, ...data.trend.map(t => t.count));
            const bars = data.trend.map(t => {
                const height = Math.max(4, Math.round(t.count / max * 100));
                return '<div class="bar-col"><span class="bar-value">' + t.count + '</span>' +
                    '<div class="bar-track"><div class="bar" style="height:' + height + '%"></div></div>' +
                    '<small>' + t.date.slice(5) + '</small></div>';
            }).join('');

            const totalTypes = data.typeDistribution.reduce((sum, t) => sum + t.count, 0);
            let acc = 0;
            const segments = [];
            data.typeDistribution.forEach(t => {
                const start = totalTypes ? acc / totalTypes * 360 : 0;
                acc += t.count;
                const end = totalTypes ? acc / totalTypes * 360 : 0;
                segments.push((typeColors[t.type] || '#999') + ' ' + start.toFixed(1) + 'deg ' + end.toFixed(1) + 'deg');
            });
            const donutBg = totalTypes ? 'conic-gradient(' + segments.join(',') + ')' : '#eef0ea';
            const legend = data.typeDistribution.map(t =>
                '<div class="legend-item"><span class="swatch" style="background:' + (typeColors[t.type] || '#999') + '"></span>' +
                t.label + '<b>' + t.count + '</b></div>').join('');

            const rows = data.latestOrders.length ? data.latestOrders.map(o => {
                const status = UI.statusInfo(o.status);
                return '<tr data-order="' + o.id + '" style="cursor:pointer"><td><div class="cell-title">' + UI.escapeHtml(o.title) + '</div>' +
                    '<div class="cell-sub">' + UI.escapeHtml(o.orderNo) + '</div></td>' +
                    '<td><div class="cell-user">' + UI.avatar(o.publisherName, o.publisherAvatar, 'avatar-sm') + '<span>' + UI.escapeHtml(o.publisherName || '—') + '</span></div></td>' +
                    '<td>¥' + UI.money(o.amount) + '</td><td><span class="badge badge-' + status.cls + '">' + status.label + '</span></td>' +
                    '<td class="muted">' + UI.timeAgo(o.createdAt) + '</td></tr>';
            }).join('') : '<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--muted)">暂无订单</td></tr>';

            setPage(
                '<div class="admin-title"><div><h1>数据看板</h1><p>实时掌握校园跑的订单与用户运营情况</p></div>' +
                    '<button class="btn btn-outline btn-sm" id="refreshDashboard">' + UI.icon('refresh') + ' 刷新数据</button></div>' +
                (data.pendingApplyCount > 0 ? '<div class="notice">' + UI.icon('audit') +
                    '<span><b>有 ' + data.pendingApplyCount + ' 条跑腿员认证申请等待审核。</b> 及时审核能让同学更快开始接单。</span>' +
                    '<a class="btn btn-sm btn-amber" href="#applies">立即处理</a></div>' : '') +
                '<div class="kpi-grid">' +
                    '<div class="kpi"><span class="kpi-accent"></span><small>' + UI.icon('users') + ' 注册用户</small><b>' + data.userCount + ' <i>人</i></b><div class="kpi-trend">' + UI.icon('arrow-up-right') + ' 含管理员账号</div></div>' +
                    '<div class="kpi amber"><span class="kpi-accent"></span><small>' + UI.icon('runner') + ' 认证跑腿员</small><b>' + data.runnerCount + ' <i>人</i></b><div class="kpi-trend">校园运力储备</div></div>' +
                    '<div class="kpi blue"><span class="kpi-accent"></span><small>' + UI.icon('orders') + ' 今日订单</small><b>' + data.todayOrderCount + ' <i>单</i></b><div class="kpi-trend">累计 ' + data.orderCount + ' 单</div></div>' +
                    '<div class="kpi coral"><span class="kpi-accent"></span><small>' + UI.icon('coin') + ' 累计成交额</small><b><i>¥</i> ' + UI.money(data.turnover) + '</b><div class="kpi-trend">已完成 ' + data.completedOrderCount + ' 单</div></div>' +
                '</div>' +
                '<div class="chart-grid">' +
                    '<section class="chart-card card"><div class="chart-head"><div><h3>近 7 日订单趋势</h3><p>按下单时间统计，包含全部状态</p></div>' +
                        '<span class="badge badge-soft">' + data.orderCount + ' 单总量</span></div>' +
                        '<div class="bar-chart">' + bars + '</div></section>' +
                    '<section class="chart-card card"><div class="chart-head"><div><h3>订单类型分布</h3><p>全部订单的服务类型占比</p></div></div>' +
                        '<div class="donut-wrap"><div class="donut" style="background:' + donutBg + '"><div class="donut-center"><b>' + totalTypes + '</b><small>总订单</small></div></div>' +
                        '<div class="legend">' + legend + '</div></div></section>' +
                '</div>' +
                '<section class="table-card"><div class="table-head"><h3>最新订单</h3><a href="#orders">查看全部 →</a></div>' +
                    '<div class="table-wrap"><table class="data"><thead><tr><th>订单</th><th>发布者</th><th>金额</th><th>状态</th><th>时间</th></tr></thead>' +
                    '<tbody>' + rows + '</tbody></table></div></section>'
            );
            document.getElementById('refreshDashboard').addEventListener('click', () => pageDashboard(seq));
            page.onclick = event => {
                const row = event.target.closest('[data-order]');
                if (row) openOrderDetail(Number(row.dataset.order), seq);
            };
            refreshApplyCount();
        } catch (error) {
            if (current(seq)) setPage(UI.emptyState('alert', '看板加载失败', error.message));
        }
    }

    /* ================= 跑腿员审核 ================= */
    async function pageApplies(seq) {
        const tabs = [['PENDING', '待审核'], ['APPROVED', '已通过'], ['REJECTED', '已驳回'], ['', '全部']];
        setPage(
            '<div class="admin-title"><div><h1>跑腿员审核</h1><p>核验申请人的姓名、学号与联系方式，决定是否授予接单权限</p></div></div>' +
            '<div class="admin-toolbar"><div class="filter-chips" id="applyTabs">' +
                tabs.map(t => '<button class="chip ' + (state.applies.status === t[0] ? 'active' : '') + '" data-status="' + t[0] + '">' + t[1] + '</button>').join('') +
            '</div></div>' +
            '<div id="applyTable"><div class="skeleton" style="height:220px;border-radius:14px"></div></div>'
        );
        document.getElementById('applyTabs').addEventListener('click', event => {
            const chip = event.target.closest('[data-status]');
            if (!chip) return;
            state.applies.status = chip.dataset.status;
            state.applies.page = 1;
            document.querySelectorAll('#applyTabs .chip').forEach(c => c.classList.toggle('active', c === chip));
            loadApplies(seq);
        });
        page.onclick = event => {
            const pagerBtn = event.target.closest('[data-page]');
            if (pagerBtn) {
                state.applies.page = Number(pagerBtn.dataset.page);
                loadApplies(seq);
                return;
            }
            const action = event.target.closest('[data-audit]');
            if (action) openAuditModal(Number(action.dataset.audit), action.dataset.decision, seq);
        };
        loadApplies(seq);
    }

    async function loadApplies(seq) {
        const container = document.getElementById('applyTable');
        if (!container) return;
        container.innerHTML = '<div class="skeleton" style="height:220px;border-radius:14px"></div>';
        try {
            const data = await API.adminApplies({
                status: state.applies.status, page: state.applies.page, size: state.applies.size
            });
            if (!current(seq)) return;
            const rows = data.records.length ? data.records.map(a => {
                const statusClass = a.status === 'APPROVED' ? 'completed' : (a.status === 'REJECTED' ? 'cancelled' : 'pending');
                const actions = a.status === 'PENDING'
                    ? '<button class="btn btn-sm btn-ghost" data-audit="' + a.id + '" data-decision="APPROVED">通过</button>' +
                      '<button class="btn btn-sm btn-danger" data-audit="' + a.id + '" data-decision="REJECTED">驳回</button>'
                    : '<span class="badge badge-' + statusClass + '">' + a.statusLabel + '</span>';
                return '<tr><td><div class="cell-user">' + UI.avatar(a.nickname, a.avatar, 'avatar-sm') +
                    '<div><div class="cell-title">' + UI.escapeHtml(a.nickname || a.username) + '</div><div class="cell-sub">@' + UI.escapeHtml(a.username) + '</div></div></div></td>' +
                    '<td><div class="cell-title">' + UI.escapeHtml(a.realName) + '</div><div class="cell-sub">学号 ' + UI.escapeHtml(a.studentNo) + '</div></td>' +
                    '<td>' + UI.escapeHtml(a.phone) + '</td>' +
                    '<td style="max-width:220px"><div class="cell-sub" style="line-height:1.5">' + UI.escapeHtml(a.reason || '未填写申请理由') + '</div></td>' +
                    '<td class="muted">' + UI.fullDateTime(a.createdAt) + '</td>' +
                    '<td><span class="badge badge-' + statusClass + '">' + a.statusLabel + '</span></td>' +
                    '<td><div class="cell-actions">' + actions + '</div></td></tr>';
            }).join('') : '<tr><td colspan="7"><div class="empty" style="padding:34px"><div class="empty-icon">' + UI.icon('audit') + '</div><h3>暂无认证申请</h3><p>新的申请会出现在这里</p></div></td></tr>';
            container.innerHTML = '<div class="table-card"><div class="table-wrap"><table class="data"><thead><tr>' +
                '<th>申请人</th><th>实名信息</th><th>联系电话</th><th>申请理由</th><th>提交时间</th><th>状态</th><th style="text-align:right">操作</th>' +
                '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
                '<div class="table-footer"><span>共 ' + data.total + ' 条申请</span>' + miniPager(data) + '</div></div>';
        } catch (error) {
            if (current(seq)) container.innerHTML = UI.emptyState('alert', '申请加载失败', error.message);
        }
    }

    function openAuditModal(id, decision, seq) {
        const approve = decision === 'APPROVED';
        const modal = UI.modal({
            title: approve ? '通过跑腿员认证' : '驳回跑腿员认证',
            subtitle: approve ? '通过后该用户将立即获得接单权限' : '请填写驳回原因，申请人会收到站内通知',
            body: '<label class="field"><span class="field-label">审核备注 ' + (approve ? '<span class="hint">选填</span>' : '<span class="hint">建议填写</span>') + '</span>' +
                '<textarea class="textarea" id="auditRemark" maxlength="200" placeholder="' + (approve ? '例如：资料齐全，同意认证' : '例如：学号与姓名不匹配，请重新提交') + '"></textarea></label>' +
                '<p class="hint" style="margin-top:10px">审核结果会通过站内信通知申请人，请确保信息准确。</p>',
            footer: '<button class="btn btn-outline" data-close>取消</button>' +
                '<button class="btn ' + (approve ? 'btn-primary' : 'btn-danger') + '" id="auditConfirm">' + (approve ? '确认通过' : '确认驳回') + '</button>'
        });
        modal.querySelector('#auditConfirm').addEventListener('click', async () => {
            const remark = modal.querySelector('#auditRemark').value.trim();
            if (!approve && !remark) return UI.toast('请填写驳回原因', 'warn');
            try {
                await API.adminAudit(id, { status: decision, remark });
                UI.closeModal();
                UI.toast(approve ? '已通过认证' : '已驳回申请');
                loadApplies(seq);
                refreshApplyCount();
            } catch (error) {
                UI.toast(error.message, 'error');
            }
        });
    }

    /* ================= 用户管理 ================= */
    async function pageUsers(seq) {
        setPage(
            '<div class="admin-title"><div><h1>用户管理</h1><p>查看注册用户与跑腿身份，异常账号可临时禁用</p></div></div>' +
            '<div class="admin-toolbar">' +
                '<label class="filter-search" style="margin-left:0">' + UI.icon('search') + '<input id="userKeyword" placeholder="搜索用户名、昵称或手机号" value="' + UI.escapeHtml(state.users.keyword) + '"></label>' +
                '<select class="select" id="userStatus" style="width:130px;padding:9px 13px;font-size:11px">' +
                    '<option value="">全部状态</option><option value="1" ' + (state.users.status === '1' ? 'selected' : '') + '>正常</option>' +
                    '<option value="0" ' + (state.users.status === '0' ? 'selected' : '') + '>已禁用</option></select>' +
            '</div><div id="userTable"><div class="skeleton" style="height:240px;border-radius:14px"></div></div>'
        );
        const search = document.getElementById('userKeyword');
        search.addEventListener('input', UI.debounce(() => {
            state.users.keyword = search.value.trim();
            state.users.page = 1;
            loadUsers(seq);
        }, 350));
        document.getElementById('userStatus').addEventListener('change', event => {
            state.users.status = event.target.value;
            state.users.page = 1;
            loadUsers(seq);
        });
        page.onclick = event => {
            const pagerBtn = event.target.closest('[data-page]');
            if (pagerBtn) {
                state.users.page = Number(pagerBtn.dataset.page);
                loadUsers(seq);
                return;
            }
            const btn = event.target.closest('[data-toggle-user]');
            if (btn) toggleUser(Number(btn.dataset.toggleUser), Number(btn.dataset.status), seq);
        };
        loadUsers(seq);
    }

    async function loadUsers(seq) {
        const container = document.getElementById('userTable');
        if (!container) return;
        container.innerHTML = '<div class="skeleton" style="height:240px;border-radius:14px"></div>';
        try {
            const data = await API.adminUsers({
                keyword: state.users.keyword, status: state.users.status,
                page: state.users.page, size: state.users.size
            });
            if (!current(seq)) return;
            const rows = data.records.length ? data.records.map(u => {
                const runnerBadge = u.runnerStatus === 2
                    ? '<span class="badge badge-completed">认证跑腿员</span>'
                    : (u.runnerStatus === 1 ? '<span class="badge badge-pending">审核中</span>' : '<span class="badge badge-cancelled">普通用户</span>');
                const action = u.role === 'ADMIN'
                    ? '<span class="badge badge-soft">管理员</span>'
                    : '<button class="btn btn-sm ' + (u.status === 1 ? 'btn-danger' : 'btn-ghost') + '" data-toggle-user="' + u.id + '" data-status="' + (u.status === 1 ? 0 : 1) + '">' + (u.status === 1 ? '禁用' : '恢复') + '</button>';
                return '<tr><td><div class="cell-user">' + UI.avatar(u.nickname, u.avatar, 'avatar-sm') +
                    '<div><div class="cell-title">' + UI.escapeHtml(u.nickname) + '</div><div class="cell-sub">@' + UI.escapeHtml(u.username) + '</div></div></div></td>' +
                    '<td>' + UI.escapeHtml(u.phone) + '</td><td>' + runnerBadge + '</td>' +
                    '<td><span class="status-dot ' + (u.status === 1 ? '' : 'off') + '"></span>' + (u.status === 1 ? '正常' : '已禁用') + '</td>' +
                    '<td class="num">¥' + UI.money(u.balance) + '</td><td>' + u.creditScore + '</td>' +
                    '<td class="muted">' + UI.fullDateTime(u.createdAt).slice(0, 10) + '</td>' +
                    '<td><div class="cell-actions">' + action + '</div></td></tr>';
            }).join('') : '<tr><td colspan="8"><div class="empty" style="padding:34px"><h3>没有找到用户</h3><p>换个关键词试试</p></div></td></tr>';
            container.innerHTML = '<div class="table-card"><div class="table-wrap"><table class="data"><thead><tr>' +
                '<th>用户</th><th>手机号</th><th>身份</th><th>账号状态</th><th>余额</th><th>信用分</th><th>注册时间</th><th style="text-align:right">操作</th>' +
                '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
                '<div class="table-footer"><span>共 ' + data.total + ' 位用户</span>' + miniPager(data) + '</div></div>';
        } catch (error) {
            if (current(seq)) container.innerHTML = UI.emptyState('alert', '用户加载失败', error.message);
        }
    }

    async function toggleUser(id, status, seq) {
        const ok = await UI.confirmDialog({
            title: status === 1 ? '恢复该账号？' : '禁用该账号？',
            message: status === 1 ? '恢复后用户可以正常登录和使用校园跑。' : '禁用后该用户将无法登录，已发布订单不受影响。',
            confirmText: status === 1 ? '恢复账号' : '禁用账号',
            danger: status !== 1
        });
        if (!ok) return;
        try {
            await API.adminSetUserStatus(id, status);
            UI.toast(status === 1 ? '账号已恢复' : '账号已禁用');
            loadUsers(seq);
        } catch (error) {
            UI.toast(error.message, 'error');
        }
    }

    /* ================= 订单监管 ================= */
    async function pageOrders(seq) {
        const statuses = [['', '全部'], ['PENDING', '待接单'], ['ACCEPTED', '已接单'], ['PICKED_UP', '配送中'], ['DELIVERED', '已送达'], ['COMPLETED', '已完成'], ['CANCELLED', '已取消']];
        setPage(
            '<div class="admin-title"><div><h1>订单监管</h1><p>查看全量订单，对异常订单执行取消并自动退款</p></div></div>' +
            '<div class="admin-toolbar"><div class="filter-chips" id="orderTabs">' +
                statuses.map(s => '<button class="chip ' + (state.orders.status === s[0] ? 'active' : '') + '" data-status="' + s[0] + '">' + s[1] + '</button>').join('') +
            '</div><label class="filter-search">' + UI.icon('search') + '<input id="orderKeyword" placeholder="搜索订单号、标题或手机号" value="' + UI.escapeHtml(state.orders.keyword) + '"></label></div>' +
            '<div id="orderTable"><div class="skeleton" style="height:240px;border-radius:14px"></div></div>'
        );
        document.getElementById('orderTabs').addEventListener('click', event => {
            const chip = event.target.closest('[data-status]');
            if (!chip) return;
            state.orders.status = chip.dataset.status;
            state.orders.page = 1;
            document.querySelectorAll('#orderTabs .chip').forEach(c => c.classList.toggle('active', c === chip));
            loadOrders(seq);
        });
        const search = document.getElementById('orderKeyword');
        search.addEventListener('input', UI.debounce(() => {
            state.orders.keyword = search.value.trim();
            state.orders.page = 1;
            loadOrders(seq);
        }, 350));
        page.onclick = event => {
            const pagerBtn = event.target.closest('[data-page]');
            if (pagerBtn) {
                state.orders.page = Number(pagerBtn.dataset.page);
                loadOrders(seq);
                return;
            }
            const detail = event.target.closest('[data-order]');
            if (detail) {
                openOrderDetail(Number(detail.dataset.order), seq);
                return;
            }
            const cancel = event.target.closest('[data-cancel-order]');
            if (cancel) {
                event.stopPropagation();
                openAdminCancelModal(Number(cancel.dataset.cancelOrder), seq);
            }
        };
        loadOrders(seq);
    }

    async function loadOrders(seq) {
        const container = document.getElementById('orderTable');
        if (!container) return;
        container.innerHTML = '<div class="skeleton" style="height:240px;border-radius:14px"></div>';
        try {
            const data = await API.adminOrders({
                status: state.orders.status, keyword: state.orders.keyword,
                page: state.orders.page, size: state.orders.size
            });
            if (!current(seq)) return;
            const rows = data.records.length ? data.records.map(o => {
                const status = UI.statusInfo(o.status);
                const canCancel = ['PENDING', 'ACCEPTED'].includes(o.status);
                return '<tr data-order="' + o.id + '" style="cursor:pointer">' +
                    '<td><div class="cell-title">' + UI.escapeHtml(o.title) + '</div><div class="cell-sub">' + UI.escapeHtml(o.orderNo) + '</div></td>' +
                    '<td><div class="cell-sub" style="line-height:1.6">' + UI.escapeHtml(o.pickupAddress) + ' → ' + UI.escapeHtml(o.deliveryAddress) + '</div></td>' +
                    '<td>' + UI.escapeHtml(o.publisherName || '—') + '</td><td>' + UI.escapeHtml(o.runnerName || '待接单') + '</td>' +
                    '<td class="num">¥' + UI.money(o.amount) + '</td><td><span class="badge badge-' + status.cls + '">' + status.label + '</span></td>' +
                    '<td class="muted">' + UI.fullDateTime(o.createdAt).slice(5, 16) + '</td>' +
                    '<td><div class="cell-actions">' + (canCancel ? '<button class="btn btn-sm btn-danger" data-cancel-order="' + o.id + '">取消并退款</button>' : '') + '</div></td></tr>';
            }).join('') : '<tr><td colspan="8"><div class="empty" style="padding:34px"><h3>没有匹配的订单</h3><p>调整筛选条件后再试</p></div></td></tr>';
            container.innerHTML = '<div class="table-card"><div class="table-wrap"><table class="data"><thead><tr>' +
                '<th>订单</th><th>路线</th><th>发布者</th><th>跑腿员</th><th>金额</th><th>状态</th><th>下单时间</th><th style="text-align:right">操作</th>' +
                '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
                '<div class="table-footer"><span>共 ' + data.total + ' 笔订单</span>' + miniPager(data) + '</div></div>';
        } catch (error) {
            if (current(seq)) container.innerHTML = UI.emptyState('alert', '订单加载失败', error.message);
        }
    }

    async function openOrderDetail(id, seq) {
        try {
            const o = await API.orderDetail(id);
            const status = UI.statusInfo(o.status);
            const canCancel = ['PENDING', 'ACCEPTED'].includes(o.status);
            const body = '<div style="display:flex;justify-content:space-between;gap:14px;align-items:flex-start">' +
                '<div><b style="font-size:15px">' + UI.escapeHtml(o.title) + '</b><div class="tiny muted" style="margin-top:4px">' + UI.escapeHtml(o.orderNo) + '</div></div>' +
                '<span class="badge badge-' + status.cls + '">' + status.label + '</span></div>' +
                '<div class="detail-route" style="margin-top:14px"><div class="r"><span class="dot a"></span><div><b>' + UI.escapeHtml(o.pickupAddress) + '</b><small>取件</small></div></div>' +
                '<div class="r"><span class="dot b"></span><div><b>' + UI.escapeHtml(o.deliveryAddress) + '</b><small>送达</small></div></div></div>' +
                '<div class="detail-grid">' +
                    '<div class="item"><small>发布者</small><b>' + UI.escapeHtml(o.publisherName || '—') + '</b></div>' +
                    '<div class="item"><small>跑腿员</small><b>' + UI.escapeHtml(o.runnerName || '未接单') + '</b></div>' +
                    '<div class="item"><small>订单金额</small><b>¥' + UI.money(o.amount) + '</b></div>' +
                    '<div class="item"><small>平台服务费</small><b>¥' + UI.money(o.commission) + '</b></div>' +
                    '<div class="item"><small>期望送达</small><b>' + UI.fullDateTime(o.expectedTime) + '</b></div>' +
                    '<div class="item"><small>支付状态</small><b>' + UI.escapeHtml(o.payStatusLabel) + '</b></div>' +
                '</div>' +
                (o.cancelReason ? '<div class="notice" style="margin-top:12px">' + UI.icon('info') + ' ' + UI.escapeHtml(o.cancelReason) + '</div>' : '') +
                '<p class="hint" style="margin-top:12px">管理员取消待接单或已接单订单时，订单金额会自动退回发布者钱包，并通知交易双方。</p>';
            const modal = UI.modal({
                title: '订单详情', size: 'modal-lg', body,
                footer: '<button class="btn btn-outline" data-close>关闭</button>' +
                    (canCancel ? '<button class="btn btn-danger" id="adminCancelOrder">取消订单并退款</button>' : '')
            });
            const cancelBtn = modal.querySelector('#adminCancelOrder');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => openAdminCancelModal(id, seq));
            }
        } catch (error) {
            UI.toast(error.message, 'error');
        }
    }

    function openAdminCancelModal(id, seq) {
        const modal = UI.modal({
            title: '取消订单并退款', subtitle: '该操作会立即取消订单，并将订单金额退回发布者钱包',
            body: '<label class="field"><span class="field-label">取消原因</span>' +
                '<textarea class="textarea" id="adminCancelReason" maxlength="100" placeholder="例如：跑腿员长时间未送达，经核实后取消"></textarea></label>' +
                '<div class="notice" style="margin-top:12px;margin-bottom:0">' + UI.icon('alert') + ' 操作不可撤销，请与交易双方确认后再执行。</div>',
            footer: '<button class="btn btn-outline" data-close>返回</button>' +
                '<button class="btn btn-danger" id="adminCancelConfirm">确认取消并退款</button>'
        });
        modal.querySelector('#adminCancelConfirm').addEventListener('click', async () => {
            const reason = modal.querySelector('#adminCancelReason').value.trim();
            if (!reason) return UI.toast('请填写取消原因', 'warn');
            try {
                await API.adminCancelOrder(id, reason);
                UI.closeModal();
                UI.toast('订单已取消，金额已退回发布者钱包');
                if (state.route === 'dashboard') pageDashboard(seq);
                else if (state.route === 'orders') loadOrders(seq);
            } catch (error) {
                UI.toast(error.message, 'error');
            }
        });
    }

    /* ================= 通用 ================= */
    function miniPager(data) {
        if (!data || data.pages <= 1) return '';
        const pageNo = Number(data.page);
        const pages = Number(data.pages);
        let start = Math.max(1, pageNo - 1);
        let end = Math.min(pages, start + 3);
        start = Math.max(1, end - 3);
        let html = '<div class="mini-pager">';
        html += '<button data-page="' + (pageNo - 1) + '" ' + (pageNo <= 1 ? 'disabled' : '') + '>‹</button>';
        for (let i = start; i <= end; i++) html += '<button data-page="' + i + '" class="' + (i === pageNo ? 'active' : '') + '">' + i + '</button>';
        html += '<button data-page="' + (pageNo + 1) + '" ' + (pageNo >= pages ? 'disabled' : '') + '>›</button></div>';
        return html;
    }

    async function refreshApplyCount() {
        try {
            const data = await API.adminApplies({ status: 'PENDING', page: 1, size: 1 });
            const badge = document.getElementById('applyCount');
            if (badge) {
                badge.textContent = data.total;
                badge.classList.toggle('hidden', data.total === 0);
            }
        } catch (e) {}
    }

    function closeMobileMenu() {
        document.getElementById('adminSidebar').classList.remove('open');
        document.getElementById('adminMask').classList.add('hidden');
    }

    document.getElementById('adminMenuBtn').addEventListener('click', () => {
        document.getElementById('adminSidebar').classList.add('open');
        document.getElementById('adminMask').classList.remove('hidden');
    });
    document.getElementById('adminMask').addEventListener('click', closeMobileMenu);
    document.querySelectorAll('.side-nav a').forEach(link => link.addEventListener('click', closeMobileMenu));
    document.getElementById('adminTopAvatar').addEventListener('click', () => { location.hash = 'dashboard'; });
    document.getElementById('adminSideLogout').addEventListener('click', async () => {
        const ok = await UI.confirmDialog({ title: '退出管理后台？', message: '退出后需要重新登录才能进入管理台。', confirmText: '退出' });
        if (ok) API.logout();
    });
    window.addEventListener('hashchange', () => {
        closeMobileMenu();
        renderRoute();
    });

    (async function init() {
        document.getElementById('adminBrand').innerHTML = UI.icon('logo');
        UI.hydrateIcons();
        renderChrome();
        try {
            state.me = await API.profile();
            API.updateUser(state.me);
            renderChrome();
        } catch (e) {}
        if (state.me.role !== 'ADMIN') {
            location.href = 'user.html';
            return;
        }
        renderRoute();
        refreshApplyCount();
    })();
})();
