/* 校园跑 · 用户端 */
(function () {
    'use strict';

    if (!API.requireAuth()) return;

    const page = document.getElementById('page');
    const state = {
        me: API.user(),
        route: 'hall',
        approved: false,
        hall: { type: '', keyword: '', page: 1, size: 8, data: null },
        published: { status: '', page: 1, size: 8, data: null },
        accepted: { status: '', page: 1, size: 8, data: null },
        wallet: { page: 1, size: 10, data: null },
        quote: null,
        publishType: 'EXPRESS',
        detailId: null
    };
    let routeSeq = 0;

    const titles = {
        hall: ['订单大厅', '看看有哪些顺路的请求'],
        publish: ['发布跑腿', '把琐事交给顺路的同学'],
        published: ['我发布的', '管理你发起的每一份委托'],
        accepted: ['我接的单', '按时送达，积累你的校园信用'],
        runner: ['跑腿员中心', '认证身份，解锁接单权限'],
        wallet: ['我的钱包', '托管支付与跑腿收入一目了然'],
        profile: ['个人设置', '完善资料，让交易更安心']
    };

    function refreshMe() {
        return API.profile().then(me => {
            state.me = me;
            state.approved = me.runnerStatus === 2;
            API.updateUser(me);
            renderChrome();
            return me;
        }).catch(() => state.me);
    }

    function renderChrome() {
        const me = state.me || {};
        state.approved = me.runnerStatus === 2;
        document.getElementById('sideName').textContent = me.nickname || me.username || '同学';
        document.getElementById('sideRole').textContent = me.runnerStatus === 2 ? '认证跑腿员' : '校园用户';
        const sideAvatar = document.getElementById('sideAvatar');
        sideAvatar.innerHTML = UI.avatar(me.nickname, me.avatar, 'avatar-sm');
        document.getElementById('topAvatar').innerHTML = UI.avatar(me.nickname, me.avatar, 'avatar-md topbar-avatar');
    }

    function setPage(html) {
        page.innerHTML = html;
        UI.hydrateIcons(page);
    }

    function setActiveNav(route) {
        document.querySelectorAll('[data-route]').forEach(el => {
            el.classList.toggle('active', el.dataset.route === route);
        });
        const meta = titles[route] || titles.hall;
        document.getElementById('topTitle').innerHTML = UI.escapeHtml(meta[0]) +
            '<small>' + UI.escapeHtml(meta[1]) + '</small>';
    }

    function renderRoute() {
        const hash = (location.hash || '#hall').replace('#', '');
        const route = titles[hash] ? hash : 'hall';
        state.route = route;
        const seq = ++routeSeq;
        setActiveNav(route);
        page.onclick = null;
        UI.closeModal();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const runners = {
            hall: pageHall,
            publish: pagePublish,
            published: pagePublished,
            accepted: pageAccepted,
            runner: pageRunner,
            wallet: pageWallet,
            profile: pageProfile
        };
        runners[route](seq);
    }

    function current(seq) {
        return seq === routeSeq && state.route === (location.hash || '#hall').replace('#', '');
    }

    /* ================= 订单大厅 ================= */
    function pageHall(seq) {
        const me = state.me;
        const statusText = me.runnerStatus === 2 ? '认证跑腿员' : UI.escapeHtml(me.runnerStatusLabel || '校园用户');
        setPage(
            '<section class="welcome">' +
                '<div><h1>' + UI.greeting() + '，<em>' + UI.escapeHtml(me.nickname || me.username) + '</em></h1>' +
                '<p>今天校园里又有哪些需要帮忙的小事？顺路的话，就接一单吧。</p></div>' +
                '<div class="welcome-actions">' +
                    '<a class="btn btn-outline" href="#published">' + UI.icon('list') + ' 我的发布</a>' +
                    '<a class="btn btn-primary" href="#publish">' + UI.icon('plus') + ' 发布跑腿</a>' +
                '</div>' +
            '</section>' +
            '<section class="stat-strip">' +
                '<div class="mini-stat"><span class="mini-stat-icon" data-icon="wallet"></span><div><small>钱包余额</small><b>¥ ' + UI.money(me.balance) + '</b></div></div>' +
                '<div class="mini-stat"><span class="mini-stat-icon amber" data-icon="shield"></span><div><small>校园信用分</small><b>' + (me.creditScore || 100) + ' <i>分</i></b></div></div>' +
                '<div class="mini-stat"><span class="mini-stat-icon blue" data-icon="runner"></span><div><small>跑腿身份</small><b style="font-size:12px">' + statusText + '</b></div></div>' +
            '</section>' +
            '<div class="section-head"><div><h2>正在等待帮助 <span id="hallTotal" class="muted" style="font-weight:500"></span></h2>' +
                '<p>按发布时间排序，加急订单优先展示</p></div>' +
                '<button class="btn btn-sm btn-outline" id="refreshHall">' + UI.icon('refresh') + ' 刷新</button></div>' +
            '<div class="filter-bar">' +
                '<div class="filter-chips" id="hallTypes">' +
                    '<button class="chip active" data-type="">全部</button>' +
                    '<button class="chip" data-type="EXPRESS">取快递</button>' +
                    '<button class="chip" data-type="FOOD">代买餐食</button>' +
                    '<button class="chip" data-type="PRINT">打印代办</button>' +
                    '<button class="chip" data-type="PURCHASE">代购物品</button>' +
                    '<button class="chip" data-type="OTHER">其他帮忙</button>' +
                '</div>' +
                '<label class="filter-search">' + UI.icon('search') +
                    '<input id="hallKeyword" placeholder="搜索标题或地点" value="' + UI.escapeHtml(state.hall.keyword) + '">' +
                '</label>' +
            '</div>' +
            '<div class="order-list" id="hallList">' + skeletonOrders(4) + '</div>' +
            '<div id="hallPager"></div>'
        );
        bindHall();
        loadHall(seq);
    }

    function bindHall() {
        const types = document.getElementById('hallTypes');
        types.addEventListener('click', event => {
            const chip = event.target.closest('[data-type]');
            if (!chip) return;
            state.hall.type = chip.dataset.type;
            state.hall.page = 1;
            types.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c === chip));
            loadHall(routeSeq);
        });
        const search = document.getElementById('hallKeyword');
        search.addEventListener('input', UI.debounce(() => {
            state.hall.keyword = search.value.trim();
            state.hall.page = 1;
            loadHall(routeSeq);
        }, 350));
        document.getElementById('refreshHall').addEventListener('click', () => loadHall(routeSeq));
        page.onclick = event => {
            const pagerBtn = event.target.closest('[data-page]');
            if (pagerBtn && pagerBtn.closest('#hallPager')) {
                state.hall.page = Number(pagerBtn.dataset.page);
                loadHall(routeSeq);
                return;
            }
            const action = event.target.closest('[data-act]');
            if (action) {
                event.stopPropagation();
                handleOrderAction(action.dataset.act, Number(action.dataset.id));
                return;
            }
            const card = event.target.closest('[data-view]');
            if (card) openOrderDetail(Number(card.dataset.view));
        };
    }

    async function loadHall(seq) {
        const list = document.getElementById('hallList');
        if (!list) return;
        list.innerHTML = skeletonOrders(3);
        try {
            const data = await API.hall({
                type: state.hall.type, keyword: state.hall.keyword,
                page: state.hall.page, size: state.hall.size
            });
            if (!current(seq)) return;
            state.hall.data = data;
            const total = document.getElementById('hallTotal');
            if (total) total.textContent = '· ' + data.total + ' 单';
            list.innerHTML = data.records.length
                ? data.records.map(order => renderOrderCard(order, 'hall')).join('')
                : UI.emptyState('compass', '暂时没有顺路的订单', '换个类型看看，或者先发布一个自己的跑腿需求。',
                    '<a class="btn btn-primary btn-sm" style="margin-top:16px" href="#publish">发布跑腿</a>');
            const pager = document.getElementById('hallPager');
            if (pager) pager.innerHTML = UI.pager(data, 'hall');
        } catch (error) {
            if (!current(seq)) return;
            list.innerHTML = UI.emptyState('alert', '加载失败', error.message,
                '<button class="btn btn-outline btn-sm" style="margin-top:16px" onclick="location.reload()">重新加载</button>');
        }
    }

    /* ================= 卡片渲染 ================= */
    function renderOrderCard(order, mode) {
        const type = UI.typeInfo(order.type);
        const status = UI.statusInfo(order.status);
        const isRunner = state.me.id === order.runnerId;
        const isPublisher = state.me.id === order.publisherId;
        let actions = '';

        if (mode === 'hall') {
            if (order.canAccept) {
                actions = '<button class="btn btn-primary btn-sm" data-act="accept" data-id="' + order.id + '">立即接单 ' + UI.icon('arrow') + '</button>';
            } else if (!state.approved) {
                actions = '<a class="btn btn-ghost btn-sm" href="#runner">认证后接单</a>';
            } else {
                actions = '<span class="badge badge-cancelled">暂不可接</span>';
            }
        } else if (mode === 'published') {
            actions += '<button class="btn btn-outline btn-sm" data-act="detail" data-id="' + order.id + '">详情</button>';
            if (order.canCancel) actions += '<button class="btn btn-danger btn-sm" data-act="cancel" data-id="' + order.id + '">取消</button>';
            if (order.canComplete) actions += '<button class="btn btn-primary btn-sm" data-act="complete" data-id="' + order.id + '">确认完成</button>';
            if (order.canReview) actions += '<button class="btn btn-amber btn-sm" data-act="review" data-id="' + order.id + '">评价</button>';
            if (order.reviewed) actions += '<span class="badge badge-completed">已评价</span>';
        } else if (mode === 'accepted') {
            actions += '<button class="btn btn-outline btn-sm" data-act="detail" data-id="' + order.id + '">详情</button>';
            if (order.canPickup) actions += '<button class="btn btn-primary btn-sm" data-act="pickup" data-id="' + order.id + '">确认取件</button>';
            if (order.canDeliver) actions += '<button class="btn btn-primary btn-sm" data-act="deliver" data-id="' + order.id + '">确认送达</button>';
            if (order.status === 'DELIVERED') actions += '<span class="badge badge-delivered">等待确认</span>';
        }

        const metaPerson = mode === 'accepted'
            ? '<span>' + UI.icon('user') + ' 发布者 ' + UI.escapeHtml(order.publisherName || '同学') + '</span>'
            : (order.runnerName
                ? '<span>' + UI.icon('runner') + ' ' + UI.escapeHtml(order.runnerName) + '</span>'
                : '<span>' + UI.icon('user') + ' ' + UI.escapeHtml(order.publisherName || '同学') + '</span>');

        return '<article class="order-card" data-view="' + order.id + '">' +
            '<div class="type-icon ' + type.cls + '">' + UI.icon(type.icon) + '</div>' +
            '<div class="order-main">' +
                '<div class="order-title-row"><span class="order-title">' + UI.escapeHtml(order.title) + '</span>' +
                    (order.urgent === 1 ? '<span class="urgent-flag">加急</span>' : '') +
                    '<span class="badge badge-' + status.cls + '">' + status.label + '</span></div>' +
                '<div class="order-desc">' + UI.escapeHtml(order.description || '发布者没有留下更多备注') + '</div>' +
                '<div class="route-line"><span class="dot a"></span><span>' + UI.escapeHtml(order.pickupAddress) + '</span>' +
                    '<span class="path"></span><span class="arrow">→</span><span class="dot b"></span><span>' + UI.escapeHtml(order.deliveryAddress) + '</span></div>' +
                '<div class="order-meta">' + metaPerson +
                    '<span>' + UI.icon('clock') + ' ' + UI.dateTime(order.expectedTime) + ' 前送达</span>' +
                    '<span>' + UI.icon('box') + ' ' + UI.shortMoney(order.weight) + 'kg</span>' +
                    '<span>' + UI.icon('calendar') + ' ' + UI.timeAgo(order.createdAt) + '</span></div>' +
            '</div>' +
            '<div class="order-side"><span class="price"><small>¥</small>' + UI.money(order.amount) + '</span>' +
                '<div class="order-actions">' + actions + '</div></div>' +
            '</article>';
    }

    function skeletonOrders(count) {
        let out = '';
        for (let i = 0; i < count; i++) out += UI.skeletonOrder();
        return out;
    }

    /* ================= 详情与操作 ================= */
    async function openOrderDetail(id) {
        try {
            const order = await API.orderDetail(id);
            showOrderDetail(order);
        } catch (error) {
            UI.toast(error.message, 'error');
        }
    }

    function showOrderDetail(order) {
        state.detailId = order.id;
        const type = UI.typeInfo(order.type);
        const status = UI.statusInfo(order.status);
        let actions = '';
        if (order.canAccept) actions += '<button class="btn btn-primary" data-modal-act="accept">立即接单</button>';
        if (order.canPickup) actions += '<button class="btn btn-primary" data-modal-act="pickup">确认取件</button>';
        if (order.canDeliver) actions += '<button class="btn btn-primary" data-modal-act="deliver">确认送达</button>';
        if (order.canComplete) actions += '<button class="btn btn-primary" data-modal-act="complete">确认完成</button>';
        if (order.canReview) actions += '<button class="btn btn-amber" data-modal-act="review">评价跑腿员</button>';
        if (order.canCancel) actions += '<button class="btn btn-danger" data-modal-act="cancel">取消订单</button>';
        actions += '<button class="btn btn-outline" data-close>关闭</button>';

        const timeline = (order.logs || []).map((log, index) => {
            const isLast = index === (order.logs || []).length - 1;
            return '<div class="timeline-item done ' + (isLast ? 'current' : '') + '">' +
                '<span class="timeline-dot"></span><div class="timeline-body"><b>' + UI.escapeHtml(log.actionLabel) + '</b>' +
                '<p>' + UI.escapeHtml(log.remark || log.toStatusLabel) + '</p>' +
                '<time>' + UI.fullDateTime(log.createdAt) + '</time></div></div>';
        }).join('');

        const review = order.review
            ? '<div class="review-box"><div style="display:flex;align-items:center;justify-content:space-between">' +
                '<span class="stars">' + UI.stars(order.review.rating) + '</span><small class="muted">' + UI.escapeHtml(order.review.reviewerName) + '</small></div>' +
                '<p>' + UI.escapeHtml(order.review.content || '这位同学没有留下文字评价') + '</p></div>'
            : '';

        const body =
            '<div style="display:flex;align-items:flex-start;gap:13px">' +
                '<div class="type-icon ' + type.cls + '">' + UI.icon(type.icon) + '</div>' +
                '<div style="flex:1;min-width:0"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
                    '<b style="font-size:16px">' + UI.escapeHtml(order.title) + '</b>' +
                    '<span class="badge badge-' + status.cls + '">' + status.label + '</span>' +
                    (order.urgent === 1 ? '<span class="badge badge-urgent">加急</span>' : '') + '</div>' +
                    '<div class="tiny muted" style="margin-top:5px">订单号 ' + UI.escapeHtml(order.orderNo) + '</div></div>' +
                '<div class="price"><small>¥</small>' + UI.money(order.amount) + '</div>' +
            '</div>' +
            '<div class="detail-route" style="margin-top:16px">' +
                '<div class="r"><span class="dot a"></span><div><b>' + UI.escapeHtml(order.pickupAddress) + '</b><small>取件地点</small></div></div>' +
                '<div class="r"><span class="dot b"></span><div><b>' + UI.escapeHtml(order.deliveryAddress) + '</b><small>送达地点</small></div></div>' +
            '</div>' +
            (order.description ? '<p style="font-size:11px;line-height:1.75;color:var(--muted);margin-top:13px">' + UI.escapeHtml(order.description) + '</p>' : '') +
            '<div class="detail-grid">' +
                '<div class="item"><small>期望送达</small><b>' + UI.fullDateTime(order.expectedTime) + '</b></div>' +
                '<div class="item"><small>物品重量</small><b>' + UI.shortMoney(order.weight) + ' kg</b></div>' +
                '<div class="item"><small>发布者</small><b>' + UI.escapeHtml(order.publisherName || '同学') + '</b></div>' +
                '<div class="item"><small>跑腿员</small><b>' + UI.escapeHtml(order.runnerName || '等待接单') + '</b></div>' +
                '<div class="item"><small>联系电话</small><b><a href="tel:' + UI.escapeHtml(order.contactPhone) + '">' + UI.escapeHtml(order.contactPhone) + '</a></b></div>' +
                '<div class="item"><small>支付状态</small><b>' + UI.escapeHtml(order.payStatusLabel) + '</b></div>' +
            '</div>' +
            '<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--muted);margin-top:14px;padding:11px 13px;background:var(--bg-2);border-radius:9px">' +
                '<span>订单金额 ¥' + UI.money(order.amount) + '</span><span>平台服务费 ¥' + UI.money(order.commission) + '</span>' +
                '<span>跑腿收入 ¥' + UI.money(order.runnerIncome) + '</span></div>' +
            (order.cancelReason ? '<div class="notice" style="margin-top:14px">' + UI.icon('info') + ' 取消原因：' + UI.escapeHtml(order.cancelReason) + '</div>' : '') +
            review +
            (timeline ? '<div style="margin-top:20px"><div class="panel-title" style="font-size:12px;margin-bottom:14px">订单进度</div><div class="timeline">' + timeline + '</div></div>' : '') +
            '<p class="hint" style="margin-top:18px">请仅通过平台沟通与交易，不要提前向陌生人转账。遇到异常可联系校园服务站。</p>';

        const modal = UI.modal({
            title: '订单详情', subtitle: '查看订单信息与状态流转',
            size: 'modal-lg', body: body,
            footer: actions
        });
        modal.querySelectorAll('[data-modal-act]').forEach(btn => {
            btn.addEventListener('click', () => handleOrderAction(btn.dataset.modalAct, order.id));
        });
    }

    async function handleOrderAction(action, id) {
        if (action === 'detail') return openOrderDetail(id);
        if (action === 'cancel') return openCancelModal(id);
        if (action === 'review') return openReviewModal(id);

        const configs = {
            accept: { title: '确认接下这单？', message: '接单后请按约定时间取件并送达，发布者会收到你的接单通知。', text: '确认接单' },
            pickup: { title: '确认已经取件？', message: '确认后订单进入配送中状态，请尽快送达。', text: '确认取件' },
            deliver: { title: '确认已经送达？', message: '请确保已将物品交到发布者手中，确认后等待对方完成订单。', text: '确认送达' },
            complete: { title: '确认订单完成？', message: '确认后订单金额将结算给跑腿员，操作不可撤销。', text: '确认完成' }
        };
        const cfg = configs[action];
        if (!cfg) return;
        const ok = await UI.confirmDialog({
            title: cfg.title, message: cfg.message, confirmText: cfg.text,
            danger: action === 'complete'
        });
        if (!ok) return;
        try {
            if (action === 'accept') await API.acceptOrder(id);
            if (action === 'pickup') await API.pickupOrder(id);
            if (action === 'deliver') await API.deliverOrder(id);
            if (action === 'complete') await API.completeOrder(id);
            UI.closeModal();
            UI.toast((cfg.text.replace('确认', '') || '操作') + '成功');
            await refreshMe();
            refreshActiveCount();
            renderRoute();
        } catch (error) {
            UI.toast(error.message, 'error');
        }
    }

    function openCancelModal(id) {
        const modal = UI.modal({
            title: '取消订单', subtitle: '仅待接单状态可取消，支付金额将原路退回钱包',
            body: '<label class="field"><span class="field-label">取消原因</span>' +
                '<textarea class="textarea" id="cancelReason" maxlength="100" placeholder="告诉跑腿员为什么取消，例如：行程有变"></textarea></label>',
            footer: '<button class="btn btn-outline" data-close>再想想</button>' +
                '<button class="btn btn-danger" id="cancelConfirm">确认取消并退款</button>'
        });
        modal.querySelector('#cancelConfirm').addEventListener('click', async () => {
            const reason = modal.querySelector('#cancelReason').value.trim() || '发布者主动取消';
            try {
                await API.cancelOrder(id, reason);
                UI.closeModal();
                UI.toast('订单已取消，金额已退回钱包');
                await refreshMe();
                renderRoute();
            } catch (error) {
                UI.toast(error.message, 'error');
            }
        });
    }

    function openReviewModal(id) {
        let rating = 5;
        const modal = UI.modal({
            title: '评价这次跑腿', subtitle: '你的评价会帮助其他同学了解这位跑腿员',
            body: '<div style="text-align:center;padding:6px 0 16px">' +
                '<div class="rating-input" id="ratingInput" style="justify-content:center">' +
                    [1, 2, 3, 4, 5].map(i => '<button type="button" data-rating="' + i + '" class="' + (i <= 5 ? 'active' : '') + '">★</button>').join('') +
                '</div><div class="tiny muted" id="ratingText" style="margin-top:8px">非常满意</div></div>' +
                '<label class="field"><span class="field-label">评价内容</span>' +
                '<textarea class="textarea" id="reviewContent" maxlength="300" placeholder="说说这次跑腿体验，例如速度、沟通、物品是否完好"></textarea></label>' +
                '<label class="checkline" style="margin-top:12px"><input type="checkbox" id="reviewAnonymous"> 匿名评价（跑腿员看不到你的昵称）</label>',
            footer: '<button class="btn btn-outline" data-close>取消</button>' +
                '<button class="btn btn-amber" id="reviewSubmit">发布评价</button>'
        });
        const labels = ['', '不太满意', '有待改进', '基本满意', '很满意', '非常满意'];
        modal.querySelectorAll('[data-rating]').forEach(btn => {
            btn.addEventListener('click', () => {
                rating = Number(btn.dataset.rating);
                modal.querySelectorAll('[data-rating]').forEach(b => b.classList.toggle('active', Number(b.dataset.rating) <= rating));
                modal.querySelector('#ratingText').textContent = labels[rating];
            });
        });
        modal.querySelector('#reviewSubmit').addEventListener('click', async () => {
            const content = modal.querySelector('#reviewContent').value.trim();
            const anonymous = modal.querySelector('#reviewAnonymous').checked ? 1 : 0;
            try {
                await API.reviewOrder(id, { rating, content, anonymous });
                UI.closeModal();
                UI.toast('评价已发布，感谢你的反馈');
                renderRoute();
            } catch (error) {
                UI.toast(error.message, 'error');
            }
        });
    }

    /* ================= 发布订单 ================= */
    function pagePublish(seq) {
        const me = state.me;
        const defaultTime = UI.formatDateInput(new Date(Date.now() + 3 * 3600 * 1000));
        setPage(
            '<div class="section-head"><div><h2>发布一个跑腿需求</h2><p>填写清楚地点和时间，更容易被顺路的同学接单</p></div>' +
                '<a class="btn btn-sm btn-outline" href="#hall">' + UI.icon('compass') + ' 去大厅看看</a></div>' +
            '<form id="publishForm"><div class="page-grid">' +
                '<div>' +
                    '<section class="panel">' +
                        '<div class="panel-title"><span class="num">1</span> 选择跑腿类型</div>' +
                        '<div class="type-grid" id="typeGrid">' +
                            Object.keys(UI.typeMeta).map(key => {
                                const t = UI.typeMeta[key];
                                return '<button type="button" class="type-option ' + (key === state.publishType ? 'active' : '') + '" data-type="' + key + '">' +
                                    UI.icon(t.icon) + '<b>' + t.label + '</b><small>基础费 ¥' + feeBase(key) + '</small></button>';
                            }).join('') +
                        '</div>' +
                        '<div class="panel-title"><span class="num">2</span> 告诉我们取送地点</div>' +
                        '<div class="route-box">' +
                            '<label class="route-field"><span class="route-marker a"></span><input class="route-input" id="pickupAddress" maxlength="100" placeholder="从哪里取？例如：菜鸟驿站（东门）" required></label>' +
                            '<label class="route-field"><span class="route-marker b"></span><input class="route-input" id="deliveryAddress" maxlength="100" placeholder="送到哪里？例如：6 号宿舍楼 302" required></label>' +
                        '</div>' +
                        '<div class="form-row" style="margin-top:14px">' +
                            '<label class="field"><span class="field-label">联系人</span><input class="input" id="contactName" maxlength="20" value="' + UI.escapeHtml(me.nickname || '') + '" required></label>' +
                            '<label class="field"><span class="field-label">联系电话</span><input class="input" id="contactPhone" maxlength="11" value="' + UI.escapeHtml(me.phone || '') + '" inputmode="numeric" required></label>' +
                        '</div>' +
                    '</section>' +
                    '<section class="panel" style="margin-top:14px">' +
                        '<div class="panel-title"><span class="num">3</span> 补充订单信息</div>' +
                        '<label class="field"><span class="field-label">订单标题</span><input class="input" id="orderTitle" maxlength="50" placeholder="一句话说清楚要帮什么忙" required></label>' +
                        '<label class="field" style="margin-top:14px"><span class="field-label">备注 <span class="hint">选填</span></span>' +
                            '<textarea class="textarea" id="orderDesc" maxlength="300" placeholder="取件码、口味偏好、注意事项等，写清楚可以减少沟通成本"></textarea></label>' +
                        '<div class="form-row" style="margin-top:14px">' +
                            '<label class="field"><span class="field-label">期望送达时间</span><input class="input" id="expectedTime" type="datetime-local" value="' + defaultTime + '" required></label>' +
                            '<label class="field"><span class="field-label">物品重量（kg）</span><input class="input" id="weight" type="number" min="0.1" max="50" step="0.1" value="1" required></label>' +
                        '</div>' +
                        '<div style="margin-top:16px">' +
                            '<div class="switch-row"><div class="switch-text"><b>加急送达</b><small>加急费 ¥2，订单会优先展示在订单大厅</small></div>' +
                                '<label class="switch"><input type="checkbox" id="urgent"><span></span></label></div>' +
                        '</div>' +
                    '</section>' +
                '</div>' +
                '<aside class="fee-card">' +
                    '<div class="fee-title"><span>费用预估</span><span class="badge badge-amber" style="background:rgba(242,169,59,.14);color:#f6c568">平台托管</span></div>' +
                    '<div class="fee-total"><span class="currency">¥</span><strong id="feeTotal">—</strong><small>元</small></div>' +
                    '<div class="fee-lines" id="feeLines"><div class="fee-line"><span>正在计算…</span></div></div>' +
                    '<div class="fee-hint" id="feeRule">费用由基础价、加急费和超重费组成，订单完成后平台收取 10% 服务费。</div>' +
                    '<div class="fee-balance"><span>钱包余额</span><b>¥ ' + UI.money(me.balance) + '</b></div>' +
                    '<button class="btn btn-primary btn-block" id="publishBtn" type="submit">支付并发布 ' + UI.icon('arrow') + '</button>' +
                    '<p class="hint" style="color:rgba(255,255,255,.38);margin-top:10px">发布即从钱包扣除订单金额，取消订单会原路退回。</p>' +
                '</aside>' +
            '</div></form>'
        );
        initPublish();
    }

    function feeBase(type) {
        return { EXPRESS: 3, FOOD: 4, PRINT: 3, PURCHASE: 5, OTHER: 4 }[type] || 4;
    }

    function initPublish() {
        const grid = document.getElementById('typeGrid');
        const weight = document.getElementById('weight');
        const urgent = document.getElementById('urgent');
        grid.addEventListener('click', event => {
            const option = event.target.closest('[data-type]');
            if (!option) return;
            state.publishType = option.dataset.type;
            grid.querySelectorAll('.type-option').forEach(el => el.classList.toggle('active', el === option));
            updateQuote();
        });
        weight.addEventListener('input', UI.debounce(updateQuote, 250));
        urgent.addEventListener('change', updateQuote);
        updateQuote();

        document.getElementById('publishForm').addEventListener('submit', async event => {
            event.preventDefault();
            const btn = document.getElementById('publishBtn');
            if (btn.disabled) return;
            const payload = {
                type: state.publishType,
                title: document.getElementById('orderTitle').value.trim(),
                description: document.getElementById('orderDesc').value.trim(),
                pickupAddress: document.getElementById('pickupAddress').value.trim(),
                deliveryAddress: document.getElementById('deliveryAddress').value.trim(),
                contactName: document.getElementById('contactName').value.trim(),
                contactPhone: document.getElementById('contactPhone').value.trim(),
                expectedTime: document.getElementById('expectedTime').value,
                urgent: urgent.checked ? 1 : 0,
                weight: Number(weight.value || 1)
            };
            if (!payload.title || !payload.pickupAddress || !payload.deliveryAddress) {
                UI.toast('请填写完整的地点与标题', 'warn');
                return;
            }
            if (!/^1[3-9]\d{9}$/.test(payload.contactPhone)) {
                UI.toast('联系电话格式不正确', 'warn');
                return;
            }
            btn.disabled = true;
            btn.textContent = '正在发布…';
            try {
                const order = await API.publishOrder(payload);
                await refreshMe();
                UI.modal({
                    title: '发布成功，等待顺路的同学',
                    subtitle: '订单已支付并进入大厅，接单后会通过站内信通知你',
                    body: '<div style="text-align:center;padding:8px 0 4px"><div class="empty-icon" style="background:var(--brand-soft);color:var(--brand);margin-bottom:14px">' + UI.icon('check') + '</div>' +
                        '<b style="font-size:15px">' + UI.escapeHtml(order.title) + '</b>' +
                        '<p class="tiny muted" style="margin-top:8px">订单号 ' + UI.escapeHtml(order.orderNo) + ' · ¥' + UI.money(order.amount) + '</p></div>',
                    footer: '<button class="btn btn-outline" data-close>继续发布</button>' +
                        '<button class="btn btn-primary" id="goPublished">查看我的发布</button>'
                }).querySelector('#goPublished').addEventListener('click', () => {
                    UI.closeModal();
                    location.hash = 'published';
                });
            } catch (error) {
                UI.toast(error.message, 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = '支付并发布 ' + UI.icon('arrow');
            }
        });
    }

    async function updateQuote() {
        const total = document.getElementById('feeTotal');
        const weightInput = document.getElementById('weight');
        const urgentInput = document.getElementById('urgent');
        if (!total || !weightInput || !urgentInput) return;
        const weight = Number(weightInput.value || 1);
        const urgent = urgentInput.checked ? 1 : 0;
        try {
            const quote = await API.quote(state.publishType, urgent, weight);
            state.quote = quote;
            total.textContent = UI.money(quote.total);
            document.getElementById('feeLines').innerHTML =
                '<div class="fee-line"><span>' + quote.typeLabel + '基础价</span><b>¥ ' + UI.money(quote.baseFee) + '</b></div>' +
                '<div class="fee-line"><span>加急服务</span><b>¥ ' + UI.money(quote.urgentFee) + '</b></div>' +
                '<div class="fee-line"><span>超重费用</span><b>¥ ' + UI.money(quote.weightFee) + '</b></div>' +
                '<div class="fee-line" style="padding-top:6px;border-top:1px solid rgba(255,255,255,.1)"><span>跑腿员可得</span><b>¥ ' + UI.money(quote.total * 0.9) + '</b></div>';
            document.getElementById('feeRule').textContent = quote.ruleText + '。订单完成后平台收取 10% 服务费。';
        } catch (error) {
            total.textContent = '—';
            document.getElementById('feeRule').textContent = error.message;
        }
    }

    /* ================= 我发布的 ================= */
    function pagePublished(seq) {
        const tabs = [
            ['', '全部'], ['PENDING', '待接单'], ['ACCEPTED', '已接单'], ['PICKED_UP', '配送中'],
            ['DELIVERED', '已送达'], ['COMPLETED', '已完成'], ['CANCELLED', '已取消']
        ];
        setPage(
            '<div class="section-head"><div><h2>我发布的订单</h2><p>查看进度、确认完成或取消待接单的订单</p></div>' +
                '<a class="btn btn-primary btn-sm" href="#publish">' + UI.icon('plus') + ' 发布新跑腿</a></div>' +
            '<div class="tab-bar" id="publishedTabs">' + tabs.map(t =>
                '<button class="tab ' + (state.published.status === t[0] ? 'active' : '') + '" data-status="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>' +
            '<div class="task-list" id="publishedList">' + skeletonTasks(3) + '</div><div id="publishedPager"></div>'
        );
        const tabsEl = document.getElementById('publishedTabs');
        tabsEl.addEventListener('click', event => {
            const tab = event.target.closest('[data-status]');
            if (!tab) return;
            state.published.status = tab.dataset.status;
            state.published.page = 1;
            tabsEl.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === tab));
            loadPublished(seq);
        });
        page.onclick = event => {
            const pagerBtn = event.target.closest('[data-page]');
            if (pagerBtn && pagerBtn.closest('#publishedPager')) {
                state.published.page = Number(pagerBtn.dataset.page);
                loadPublished(seq);
                return;
            }
            const action = event.target.closest('[data-act]');
            if (action) {
                event.stopPropagation();
                handleOrderAction(action.dataset.act, Number(action.dataset.id));
                return;
            }
            const card = event.target.closest('[data-view]');
            if (card) openOrderDetail(Number(card.dataset.view));
        };
        loadPublished(seq);
    }

    async function loadPublished(seq) {
        const list = document.getElementById('publishedList');
        if (!list) return;
        list.innerHTML = skeletonTasks(3);
        try {
            const data = await API.myPublished({
                status: state.published.status, page: state.published.page, size: state.published.size
            });
            if (!current(seq)) return;
            state.published.data = data;
            list.innerHTML = data.records.length
                ? data.records.map(o => renderTaskCard(o, 'published')).join('')
                : UI.emptyState('list', '这里还没有订单', '发布一个跑腿需求，让顺路的同学帮你完成。',
                    '<a class="btn btn-primary btn-sm" style="margin-top:16px" href="#publish">去发布</a>');
            document.getElementById('publishedPager').innerHTML = UI.pager(data, 'published');
        } catch (error) {
            if (current(seq)) list.innerHTML = UI.emptyState('alert', '加载失败', error.message);
        }
    }

    function skeletonTasks(count) {
        let out = '';
        for (let i = 0; i < count; i++) {
            out += '<div class="task-card"><div class="skeleton" style="height:14px;width:38%;margin-bottom:12px"></div>' +
                '<div class="skeleton" style="height:10px;width:65%;margin-bottom:10px"></div>' +
                '<div class="skeleton" style="height:10px;width:50%"></div></div>';
        }
        return out;
    }

    function renderTaskCard(order, mode) {
        const type = UI.typeInfo(order.type);
        const status = UI.statusInfo(order.status);
        let actions = '';
        if (mode === 'published') {
            actions += '<button class="btn btn-outline btn-sm" data-act="detail" data-id="' + order.id + '">查看详情</button>';
            if (order.canCancel) actions += '<button class="btn btn-danger btn-sm" data-act="cancel" data-id="' + order.id + '">取消订单</button>';
            if (order.canComplete) actions += '<button class="btn btn-primary btn-sm" data-act="complete" data-id="' + order.id + '">确认完成</button>';
            if (order.canReview) actions += '<button class="btn btn-amber btn-sm" data-act="review" data-id="' + order.id + '">去评价</button>';
        } else {
            actions += '<button class="btn btn-outline btn-sm" data-act="detail" data-id="' + order.id + '">查看详情</button>';
            if (order.canPickup) actions += '<button class="btn btn-primary btn-sm" data-act="pickup" data-id="' + order.id + '">确认取件</button>';
            if (order.canDeliver) actions += '<button class="btn btn-primary btn-sm" data-act="deliver" data-id="' + order.id + '">确认送达</button>';
        }
        return '<article class="task-card" data-view="' + order.id + '">' +
            '<div class="task-top"><div class="type-icon ' + type.cls + '">' + UI.icon(type.icon) + '</div>' +
                '<div class="task-main"><div class="task-heading"><b>' + UI.escapeHtml(order.title) + '</b>' +
                    '<span class="badge badge-' + status.cls + '">' + status.label + '</span>' +
                    (order.urgent === 1 ? '<span class="urgent-flag">加急</span>' : '') + '</div>' +
                    '<div class="task-sub">' + UI.escapeHtml(order.pickupAddress) + ' → ' + UI.escapeHtml(order.deliveryAddress) + '</div>' +
                    '<div class="task-meta"><span>' + UI.icon('clock') + ' ' + UI.fullDateTime(order.expectedTime) + '</span>' +
                        '<span>' + UI.icon('user') + ' ' + (mode === 'accepted' ? '发布者 ' + UI.escapeHtml(order.publisherName || '同学') : (order.runnerName ? '跑腿员 ' + UI.escapeHtml(order.runnerName) : '等待接单')) + '</span>' +
                        '<span>' + UI.icon('calendar') + ' ' + UI.timeAgo(order.createdAt) + '</span></div></div>' +
                '<div class="task-price"><small>¥</small>' + UI.money(order.amount) + '</div></div>' +
            '<div class="task-foot">' + actions + '</div></article>';
    }

    /* ================= 我接的单 ================= */
    function pageAccepted(seq) {
        const tabs = [['', '全部'], ['ACCEPTED', '待取件'], ['PICKED_UP', '配送中'], ['DELIVERED', '已送达'], ['COMPLETED', '已完成']];
        const banner = state.approved ? '' :
            '<div class="notice">' + UI.icon('shield') + '<span><b>你还不是认证跑腿员。</b> 通过认证后才能接单，认证审核通常在一个工作日内完成。</span>' +
            '<a class="btn btn-sm btn-ghost" href="#runner">去认证</a></div>';
        setPage(
            banner +
            '<div class="section-head"><div><h2>我接的订单</h2><p>取件、送达后记得及时更新状态，让发布者安心</p></div>' +
                '<a class="btn btn-outline btn-sm" href="#hall">' + UI.icon('compass') + ' 去接单</a></div>' +
            '<div class="tab-bar" id="acceptedTabs">' + tabs.map(t =>
                '<button class="tab ' + (state.accepted.status === t[0] ? 'active' : '') + '" data-status="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>' +
            '<div class="task-list" id="acceptedList">' + skeletonTasks(3) + '</div><div id="acceptedPager"></div>'
        );
        const tabsEl = document.getElementById('acceptedTabs');
        tabsEl.addEventListener('click', event => {
            const tab = event.target.closest('[data-status]');
            if (!tab) return;
            state.accepted.status = tab.dataset.status;
            state.accepted.page = 1;
            tabsEl.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === tab));
            loadAccepted(seq);
        });
        page.onclick = event => {
            const pagerBtn = event.target.closest('[data-page]');
            if (pagerBtn && pagerBtn.closest('#acceptedPager')) {
                state.accepted.page = Number(pagerBtn.dataset.page);
                loadAccepted(seq);
                return;
            }
            const action = event.target.closest('[data-act]');
            if (action) {
                event.stopPropagation();
                handleOrderAction(action.dataset.act, Number(action.dataset.id));
                return;
            }
            const card = event.target.closest('[data-view]');
            if (card) openOrderDetail(Number(card.dataset.view));
        };
        loadAccepted(seq);
    }

    async function loadAccepted(seq) {
        const list = document.getElementById('acceptedList');
        if (!list) return;
        list.innerHTML = skeletonTasks(3);
        try {
            const data = await API.myAccepted({
                status: state.accepted.status, page: state.accepted.page, size: state.accepted.size
            });
            if (!current(seq)) return;
            state.accepted.data = data;
            list.innerHTML = data.records.length
                ? data.records.map(o => renderTaskCard(o, 'accepted')).join('')
                : UI.emptyState('tasks', '还没有接单记录', '去订单大厅看看，顺路的单子就在那里。',
                    '<a class="btn btn-primary btn-sm" style="margin-top:16px" href="#hall">去大厅</a>');
            document.getElementById('acceptedPager').innerHTML = UI.pager(data, 'accepted');
            refreshActiveCount();
        } catch (error) {
            if (current(seq)) list.innerHTML = UI.emptyState('alert', '加载失败', error.message);
        }
    }

    async function refreshActiveCount() {
        try {
            const data = await API.myAccepted({ page: 1, size: 30 });
            const active = data.records.filter(o => ['ACCEPTED', 'PICKED_UP'].includes(o.status)).length;
            const badge = document.getElementById('acceptedCount');
            if (badge) {
                badge.textContent = active;
                badge.classList.toggle('hidden', active === 0);
            }
        } catch (e) {
            /* 未登录或网络异常时保持原有角标 */
        }
    }

    /* ================= 跑腿员中心 ================= */
    async function pageRunner(seq) {
        setPage('<div class="skeleton" style="height:200px;border-radius:18px"></div>');
        try {
            const [apply, stats] = await Promise.all([API.myRunnerApply(), API.runnerStats()]);
            if (!current(seq)) return;
            const approved = state.me.runnerStatus === 2;
            const pending = state.me.runnerStatus === 1;
            const rejected = state.me.runnerStatus === 3;
            let content = '';

            if (approved) {
                content =
                    '<div class="profile-hero"><div style="display:flex;align-items:center;gap:16px;position:relative;z-index:1">' +
                        '<span class="avatar avatar-lg">' + UI.escapeHtml((state.me.nickname || '跑').charAt(0)) + '</span>' +
                        '<div><div class="badge" style="background:rgba(255,255,255,.12);color:#d7eee3">认证跑腿员</div>' +
                        '<h2>' + UI.escapeHtml(state.me.nickname) + '，欢迎回来</h2>' +
                        '<p>你的每一次准时送达，都在让校园变得更方便。</p></div></div></div>' +
                    '<div class="stat-grid">' +
                        '<div class="stat-box"><small>累计完成</small><b>' + stats.completedOrders + ' <i>单</i></b></div>' +
                        '<div class="stat-box"><small>跑腿收入</small><b><i>¥</i> ' + UI.money(stats.totalIncome) + '</b></div>' +
                        '<div class="stat-box"><small>平均评分</small><b>' + stats.averageRating.toFixed(1) + ' <i>分</i></b></div>' +
                        '<div class="stat-box"><small>信用分</small><b>' + stats.creditScore + ' <i>分</i></b></div>' +
                    '</div>' +
                    '<div class="page-grid" style="grid-template-columns:1.2fr .8fr">' +
                        '<section class="panel"><div class="panel-title"><span class="num">✓</span> 接单小贴士</div>' +
                            '<div class="rule-list">' +
                                '<div class="rule-item"><span>1</span><p>接单前确认路线和时间，避免因课程冲突导致超时。</p></div>' +
                                '<div class="rule-item"><span>2</span><p>取件后及时点击「确认取件」，送达后点击「确认送达」，让发布者掌握进度。</p></div>' +
                                '<div class="rule-item"><span>3</span><p>请当面交付并保护同学隐私，不要泄露手机号、宿舍号等信息。</p></div>' +
                                '<div class="rule-item"><span>4</span><p>发布者确认完成后，跑腿收入自动进入钱包；平台收取 10% 服务费。</p></div>' +
                            '</div>' +
                            '<a class="btn btn-primary" style="margin-top:18px" href="#hall">' + UI.icon('compass') + ' 去订单大厅</a></section>' +
                        '<section class="panel"><div class="panel-title"><span class="num">!</span> 认证信息</div>' +
                            (apply ? '<div class="detail-grid" style="grid-template-columns:1fr;margin-top:0">' +
                                '<div class="item"><small>真实姓名</small><b>' + UI.escapeHtml(apply.realName) + '</b></div>' +
                                '<div class="item"><small>学号</small><b>' + UI.escapeHtml(apply.studentNo) + '</b></div>' +
                                '<div class="item"><small>审核时间</small><b>' + UI.fullDateTime(apply.auditedAt) + '</b></div></div>' : '') +
                            '<p class="hint" style="margin-top:14px">如需修改认证资料或遇到账号问题，请联系校园服务站。</p></section>' +
                    '</div>';
            } else if (pending) {
                content =
                    '<div class="panel pending-box"><div class="pending-icon">' + UI.icon('clock') + '</div>' +
                        '<h3>认证申请审核中</h3><p>我们已收到你的跑腿员认证申请，审核结果会通过站内信通知。通常在一个工作日内完成，请耐心等待。</p>' +
                        (apply ? '<div class="detail-grid" style="margin-top:22px;text-align:left"><div class="item"><small>真实姓名</small><b>' + UI.escapeHtml(apply.realName) + '</b></div>' +
                            '<div class="item"><small>学号</small><b>' + UI.escapeHtml(apply.studentNo) + '</b></div>' +
                            '<div class="item"><small>申请时间</small><b>' + UI.fullDateTime(apply.createdAt) + '</b></div>' +
                            '<div class="item"><small>当前状态</small><b>审核中</b></div></div>' : '') +
                    '</div>';
            } else {
                if (rejected && apply) {
                    content += '<div class="notice">' + UI.icon('alert') + '<span><b>上次申请未通过：</b>' + UI.escapeHtml(apply.auditRemark || '资料需要补充') + '。修改后可重新提交。</span></div>';
                }
                content +=
                    '<div class="apply-card panel">' +
                        '<div><span class="badge badge-soft">RUNNER CERTIFICATION</span>' +
                            '<h3 style="margin-top:12px">成为认证跑腿员</h3>' +
                            '<p>认证后可以浏览并接下订单，利用课余时间帮助同学，同时获得一份跑腿收入。平台会保护你的个人信息，仅向交易对方展示必要联系方式。</p>' +
                            '<div class="apply-steps">' +
                                '<div class="apply-step"><span>1</span><p>填写真实姓名、学号与联系电话</p></div>' +
                                '<div class="apply-step"><span>2</span><p>管理员审核身份信息（一个工作日内）</p></div>' +
                                '<div class="apply-step"><span>3</span><p>审核通过后前往订单大厅接单</p></div>' +
                            '</div></div>' +
                        '<form id="runnerForm">' +
                            '<div class="form-row"><label class="field"><span class="field-label">真实姓名</span><input class="input" id="runnerRealName" maxlength="20" value="' + UI.escapeHtml(apply ? apply.realName : '') + '" required></label>' +
                            '<label class="field"><span class="field-label">学号</span><input class="input" id="runnerStudentNo" maxlength="20" value="' + UI.escapeHtml(apply ? apply.studentNo : '') + '" required></label></div>' +
                            '<label class="field" style="margin-top:13px"><span class="field-label">联系电话</span><input class="input" id="runnerPhone" maxlength="11" value="' + UI.escapeHtml(apply ? apply.phone : (state.me.phone || '')) + '" required></label>' +
                            '<label class="field" style="margin-top:13px"><span class="field-label">申请理由 <span class="hint">选填</span></span><textarea class="textarea" id="runnerReason" maxlength="200" placeholder="简单介绍你的课余时间与熟悉的校园路线">' + UI.escapeHtml(apply ? apply.reason || '' : '') + '</textarea></label>' +
                            '<button class="btn btn-primary btn-block" style="margin-top:16px" type="submit">提交认证申请</button>' +
                            '<p class="hint" style="margin-top:10px">提交即表示同意平台核验你的在校身份信息。</p>' +
                        '</form>' +
                    '</div>';
            }
            setPage(content);
            if (!approved && !pending) bindRunnerForm();
        } catch (error) {
            if (current(seq)) setPage(UI.emptyState('alert', '加载失败', error.message));
        }
    }

    function bindRunnerForm() {
        const form = document.getElementById('runnerForm');
        if (!form) return;
        form.addEventListener('submit', async event => {
            event.preventDefault();
            const payload = {
                realName: document.getElementById('runnerRealName').value.trim(),
                studentNo: document.getElementById('runnerStudentNo').value.trim(),
                phone: document.getElementById('runnerPhone').value.trim(),
                reason: document.getElementById('runnerReason').value.trim()
            };
            if (!/^[0-9A-Za-z]{6,20}$/.test(payload.studentNo)) return UI.toast('学号格式不正确', 'warn');
            if (!/^1[3-9]\d{9}$/.test(payload.phone)) return UI.toast('手机号格式不正确', 'warn');
            const btn = form.querySelector('button[type=submit]');
            btn.disabled = true;
            btn.textContent = '正在提交…';
            try {
                await API.applyRunner(payload);
                await refreshMe();
                UI.toast('认证申请已提交，请等待审核');
                pageRunner(routeSeq);
            } catch (error) {
                UI.toast(error.message, 'error');
                btn.disabled = false;
                btn.textContent = '提交认证申请';
            }
        });
    }

    /* ================= 钱包 ================= */
    function pageWallet(seq) {
        const me = state.me;
        setPage(
            '<div class="section-head"><div><h2>我的钱包</h2><p>订单支付由平台托管，完成后再结算给跑腿员</p></div>' +
                '<button class="btn btn-primary btn-sm" id="rechargeBtn">' + UI.icon('plus') + ' 充值</button></div>' +
            '<div class="page-grid" style="grid-template-columns:.9fr 1.1fr">' +
                '<div><div class="wallet-card">' +
                    '<div class="wallet-top"><span>可用余额</span><span>CAMPUS RUN WALLET</span></div>' +
                    '<div class="wallet-amount"><small>¥</small>' + UI.money(me.balance) + '</div>' +
                    '<div class="wallet-bottom"><span>安全托管 · 随时可查</span><span style="font-size:11px;letter-spacing:0">' + UI.escapeHtml(me.username) + '</span></div>' +
                '</div>' +
                '<div class="wallet-actions"><button class="btn btn-outline" id="rechargeBtn2">' + UI.icon('coin') + ' 模拟充值</button>' +
                    '<a class="btn btn-outline" href="#published">' + UI.icon('list') + ' 我的订单</a></div>' +
                '<div class="panel" style="margin-top:14px"><div class="panel-title" style="margin-bottom:10px;font-size:12px">资金说明</div>' +
                    '<div class="rule-list">' +
                        '<div class="rule-item"><span>1</span><p>发布订单时从余额扣除订单金额，由平台托管。</p></div>' +
                        '<div class="rule-item"><span>2</span><p>取消待接单订单，金额原路退回；跑腿收入在发布者确认完成后到账。</p></div>' +
                        '<div class="rule-item"><span>3</span><p>演示环境使用模拟充值，不接入真实支付渠道。</p></div>' +
                    '</div></div></div>' +
                '<section class="panel"><div class="section-head" style="margin-bottom:10px"><div><h2 style="font-size:14px">余额明细</h2><p>充值、支付、退款与收入流水</p></div>' +
                    '<button class="icon-btn" id="refreshWallet" title="刷新">' + UI.icon('refresh') + '</button></div>' +
                    '<div class="txn-list" id="txnList">' + skeletonTxns(4) + '</div><div id="walletPager"></div></section>' +
            '</div>'
        );
        document.getElementById('rechargeBtn').addEventListener('click', openRechargeModal);
        document.getElementById('rechargeBtn2').addEventListener('click', openRechargeModal);
        document.getElementById('refreshWallet').addEventListener('click', () => loadWallet(seq));
        page.onclick = event => {
            const pagerBtn = event.target.closest('[data-page]');
            if (pagerBtn && pagerBtn.closest('#walletPager')) {
                state.wallet.page = Number(pagerBtn.dataset.page);
                loadWallet(seq);
            }
        };
        loadWallet(seq);
    }

    function skeletonTxns(count) {
        let out = '';
        for (let i = 0; i < count; i++) out += '<div class="txn-item"><div class="skeleton" style="width:34px;height:34px;border-radius:10px"></div>' +
            '<div style="flex:1"><div class="skeleton" style="height:10px;width:45%;margin-bottom:7px"></div><div class="skeleton" style="height:8px;width:65%"></div></div></div>';
        return out;
    }

    async function loadWallet(seq) {
        const list = document.getElementById('txnList');
        if (!list) return;
        list.innerHTML = skeletonTxns(4);
        try {
            const data = await API.walletTxns(state.wallet.page, state.wallet.size);
            if (!current(seq)) return;
            state.wallet.data = data;
            if (!data.records.length) {
                list.innerHTML = UI.emptyState('wallet', '还没有流水记录', '充值后就可以发布第一个跑腿订单了。');
            } else {
                list.innerHTML = data.records.map(txn => {
                    const positive = txn.type !== 'PAY';
                    const iconName = txn.type === 'PAY' ? 'arrow-up-right' : (txn.type === 'RECHARGE' ? 'coin' : 'wallet');
                    const cls = txn.type === 'PAY' ? 'pay' : (txn.type === 'RECHARGE' ? 'recharge' : '');
                    return '<div class="txn-item"><div class="txn-icon ' + cls + '">' + UI.icon(iconName) + '</div>' +
                        '<div class="txn-main"><b>' + UI.escapeHtml(txn.typeLabel) + '</b><small>' + UI.escapeHtml(txn.remark || '') + ' · ' + UI.fullDateTime(txn.createdAt) + '</small></div>' +
                        '<div class="txn-amount ' + (positive ? 'plus' : 'minus') + '">' + (positive ? '+' : '-') + '¥' + UI.money(txn.amount) + '</div></div>';
                }).join('');
            }
            document.getElementById('walletPager').innerHTML = UI.pager(data, 'wallet');
        } catch (error) {
            if (current(seq)) list.innerHTML = UI.emptyState('alert', '加载失败', error.message);
        }
    }

    function openRechargeModal() {
        let amount = 50;
        const modal = UI.modal({
            title: '模拟充值', subtitle: '演示环境不接入真实支付，充值金额仅写入本地数据库',
            body: '<div style="text-align:center;margin-bottom:18px"><span class="hint">充值金额</span>' +
                '<div class="wallet-amount" style="color:var(--ink);font-size:38px;letter-spacing:-2px"><small style="color:var(--brand)">¥</small><span id="rechargeAmount">50.00</span></div></div>' +
                '<div class="recharge-presets" id="rechargePresets" style="justify-content:center">' +
                    [10, 20, 50, 100].map(v => '<button type="button" data-amount="' + v + '" class="' + (v === 50 ? 'active' : '') + '">¥' + v + '</button>').join('') +
                '</div>' +
                '<label class="field"><span class="field-label">自定义金额（0.01 - 10000）</span>' +
                    '<div class="input-with-prefix"><span class="prefix">¥</span><input class="input" id="rechargeCustom" type="number" min="0.01" max="10000" step="0.01" value="50"></div></label>' +
                '<p class="hint" style="margin-top:10px">充值成功后余额立即到账，可用于发布订单。</p>',
            footer: '<button class="btn btn-outline" data-close>取消</button>' +
                '<button class="btn btn-primary" id="rechargeConfirm">确认充值</button>'
        });
        const custom = modal.querySelector('#rechargeCustom');
        const amountEl = modal.querySelector('#rechargeAmount');
        const presets = modal.querySelector('#rechargePresets');
        presets.addEventListener('click', event => {
            const btn = event.target.closest('[data-amount]');
            if (!btn) return;
            amount = Number(btn.dataset.amount);
            custom.value = amount;
            amountEl.textContent = UI.money(amount);
            presets.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === btn));
        });
        custom.addEventListener('input', () => {
            amount = Number(custom.value || 0);
            amountEl.textContent = UI.money(amount);
            presets.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        });
        modal.querySelector('#rechargeConfirm').addEventListener('click', async () => {
            const value = Number(custom.value || 0);
            if (!(value > 0) || value > 10000) return UI.toast('请输入 0.01 - 10000 之间的金额', 'warn');
            try {
                state.me = await API.recharge(value.toFixed(2));
                API.updateUser(state.me);
                UI.closeModal();
                UI.toast('充值成功，余额已到账');
                renderChrome();
                pageWallet(routeSeq);
            } catch (error) {
                UI.toast(error.message, 'error');
            }
        });
    }

    /* ================= 个人设置 ================= */
    function pageProfile(seq) {
        const me = state.me;
        setPage(
            '<div class="section-head"><div><h2>个人设置</h2><p>完善资料有助于建立信任，手机号仅对交易对方展示</p></div></div>' +
            '<div class="profile-layout">' +
                '<section class="panel form-card"><h3>基本资料</h3>' +
                    '<div class="avatar-edit"><span id="profileAvatar">' + UI.avatar(me.nickname, me.avatar, 'avatar-lg') + '</span>' +
                        '<div><label class="file-label">' + UI.icon('upload') + ' 更换头像<input type="file" id="avatarFile" accept="image/jpeg,image/png,image/webp,image/gif"></label>' +
                        '<small>支持 jpg / png / webp，不超过 3MB</small></div></div>' +
                    '<form id="profileForm">' +
                        '<label class="field"><span class="field-label">昵称</span><input class="input" id="profileNickname" maxlength="20" value="' + UI.escapeHtml(me.nickname) + '" required></label>' +
                        '<label class="field" style="margin-top:13px"><span class="field-label">手机号</span><input class="input" id="profilePhone" maxlength="11" value="' + UI.escapeHtml(me.phone) + '" required></label>' +
                        '<label class="field" style="margin-top:13px"><span class="field-label">邮箱 <span class="hint">选填</span></span><input class="input" id="profileEmail" type="email" maxlength="64" value="' + UI.escapeHtml(me.email || '') + '"></label>' +
                        '<button class="btn btn-primary" style="margin-top:16px" type="submit">保存资料</button>' +
                    '</form>' +
                '</section>' +
                '<div>' +
                    '<section class="panel form-card"><h3>账号信息</h3>' +
                        '<div class="detail-grid" style="margin-top:0">' +
                            '<div class="item"><small>登录账号</small><b>' + UI.escapeHtml(me.username) + '</b></div>' +
                            '<div class="item"><small>账号角色</small><b>' + (me.role === 'ADMIN' ? '管理员' : '校园用户') + '</b></div>' +
                            '<div class="item"><small>信用分</small><b>' + me.creditScore + ' 分</b></div>' +
                            '<div class="item"><small>注册时间</small><b>' + UI.fullDateTime(me.createdAt) + '</b></div>' +
                        '</div>' +
                        '<p class="hint" style="margin-top:12px">跑腿身份：' + UI.escapeHtml(me.runnerStatusLabel) + '。前往跑腿员中心可申请认证。</p>' +
                    '</section>' +
                    '<section class="panel form-card" style="margin-top:14px"><h3>修改密码</h3>' +
                        '<form id="passwordForm">' +
                            '<label class="field"><span class="field-label">原密码</span><input class="input" id="oldPassword" type="password" autocomplete="current-password" required></label>' +
                            '<label class="field" style="margin-top:13px"><span class="field-label">新密码</span><input class="input" id="newPassword" type="password" minlength="6" maxlength="20" autocomplete="new-password" required></label>' +
                            '<button class="btn btn-outline" style="margin-top:16px" type="submit">更新密码</button>' +
                        '</form>' +
                    '</section>' +
                    '<section class="panel" style="margin-top:14px;display:flex;align-items:center;justify-content:space-between;gap:12px">' +
                        '<div><b style="font-size:12px">退出当前账号</b><p class="hint" style="margin-top:3px">退出后需要重新登录才能继续使用</p></div>' +
                        '<button class="btn btn-danger btn-sm" id="profileLogout">退出登录</button>' +
                    '</section>' +
                '</div>' +
            '</div>'
        );
        bindProfile(seq);
    }

    function bindProfile(seq) {
        const form = document.getElementById('profileForm');
        form.addEventListener('submit', async event => {
            event.preventDefault();
            const payload = {
                nickname: document.getElementById('profileNickname').value.trim(),
                phone: document.getElementById('profilePhone').value.trim(),
                email: document.getElementById('profileEmail').value.trim(),
                avatar: state.me.avatar || null
            };
            if (!/^1[3-9]\d{9}$/.test(payload.phone)) return UI.toast('手机号格式不正确', 'warn');
            try {
                state.me = await API.updateProfile(payload);
                API.updateUser(state.me);
                UI.toast('资料已保存');
                renderChrome();
                pageProfile(seq);
            } catch (error) {
                UI.toast(error.message, 'error');
            }
        });

        const fileInput = document.getElementById('avatarFile');
        fileInput.addEventListener('change', async () => {
            const file = fileInput.files[0];
            if (!file) return;
            if (file.size > 3 * 1024 * 1024) return UI.toast('图片不能超过 3MB', 'warn');
            const formData = new FormData();
            formData.append('file', file);
            try {
                const upload = await API.upload('/files/avatar', formData);
                state.me = await API.updateProfile({
                    nickname: state.me.nickname, phone: state.me.phone,
                    email: state.me.email, avatar: upload.url
                });
                API.updateUser(state.me);
                UI.toast('头像已更新');
                renderChrome();
                pageProfile(seq);
            } catch (error) {
                UI.toast(error.message, 'error');
            }
        });

        document.getElementById('passwordForm').addEventListener('submit', async event => {
            event.preventDefault();
            const oldPassword = document.getElementById('oldPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            try {
                await API.changePassword({ oldPassword, newPassword });
                UI.toast('密码已更新，请记住新密码');
                event.target.reset();
            } catch (error) {
                UI.toast(error.message, 'error');
            }
        });

        document.getElementById('profileLogout').addEventListener('click', async () => {
            const ok = await UI.confirmDialog({ title: '退出登录？', message: '下次使用需要重新输入账号密码。', confirmText: '退出' });
            if (ok) API.logout();
        });
    }

    /* ================= 通知 ================= */
    function openDrawer() {
        document.getElementById('drawerBackdrop').classList.add('show');
        document.getElementById('notifDrawer').classList.add('show');
        loadNotifications();
    }

    function closeDrawer() {
        document.getElementById('drawerBackdrop').classList.remove('show');
        document.getElementById('notifDrawer').classList.remove('show');
    }

    async function loadNotifications() {
        const list = document.getElementById('notifList');
        list.innerHTML = '<div style="padding:20px 22px"><div class="skeleton" style="height:48px;margin-bottom:10px"></div><div class="skeleton" style="height:48px"></div></div>';
        try {
            const data = await API.notifications(1, 20);
            if (!data.records.length) {
                list.innerHTML = UI.emptyState('bell', '暂时没有新消息', '订单动态和审核结果会出现在这里。');
                return;
            }
            list.innerHTML = data.records.map(n =>
                '<div class="notif-item ' + (n.readFlag === 0 ? 'unread' : '') + '" data-id="' + n.id + '">' +
                    '<span class="notif-dot"></span><div class="notif-content"><b>' + UI.escapeHtml(n.title) + '</b>' +
                    '<p>' + UI.escapeHtml(n.content) + '</p><time>' + UI.timeAgo(n.createdAt) + '</time></div></div>').join('');
            list.querySelectorAll('.notif-item').forEach(item => {
                item.addEventListener('click', async () => {
                    const id = Number(item.dataset.id);
                    item.classList.remove('unread');
                    try { await API.readNotification(id); } catch (e) {}
                    const notification = data.records.find(n => n.id === id);
                    if (notification) {
                        UI.modal({
                            title: notification.title, subtitle: UI.fullDateTime(notification.createdAt),
                            body: '<p style="font-size:12px;line-height:1.9;color:var(--ink-2)">' + UI.escapeHtml(notification.content) + '</p>',
                            footer: '<button class="btn btn-primary" data-close>知道了</button>'
                        });
                    }
                    refreshUnread();
                });
            });
            refreshUnread();
        } catch (error) {
            list.innerHTML = UI.emptyState('alert', '消息加载失败', error.message);
        }
    }

    async function refreshUnread() {
        try {
            const data = await API.unreadCount();
            const badge = document.getElementById('notifBadge');
            badge.textContent = data.count;
            badge.classList.toggle('hidden', data.count === 0);
            document.getElementById('drawerSub').textContent = data.count ? data.count + ' 条未读消息' : '所有消息均已读';
        } catch (e) {}
    }

    document.getElementById('bellBtn').addEventListener('click', openDrawer);
    document.getElementById('drawerClose').addEventListener('click', closeDrawer);
    document.getElementById('drawerBackdrop').addEventListener('click', closeDrawer);
    document.getElementById('readAllBtn').addEventListener('click', async () => {
        try {
            await API.readAllNotifications();
            UI.toast('已全部标记为已读');
            loadNotifications();
            refreshUnread();
        } catch (error) {
            UI.toast(error.message, 'error');
        }
    });

    /* ================= 壳事件与启动 ================= */
    document.getElementById('topAvatar').addEventListener('click', () => { location.hash = 'profile'; });
    document.getElementById('sideLogout').addEventListener('click', async () => {
        const ok = await UI.confirmDialog({ title: '退出登录？', message: '退出后需要重新登录才能继续使用。', confirmText: '退出' });
        if (ok) API.logout();
    });
    window.addEventListener('hashchange', () => {
        closeDrawer();
        renderRoute();
    });
    setInterval(refreshUnread, 45000);

    (async function init() {
        document.getElementById('sideBrand').innerHTML = UI.icon('logo');
        UI.hydrateIcons();
        renderChrome();
        await refreshMe();
        if (state.me.role === 'ADMIN') {
            location.href = 'admin.html';
            return;
        }
        renderRoute();
        refreshUnread();
        refreshActiveCount();
    })();
})();
