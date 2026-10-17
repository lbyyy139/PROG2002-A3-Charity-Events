# A3 Demo Video Script — Xiang Hu (24832203)

**目标时长：6–7 分钟**（brief 上限 15 分钟）
**我负责的部分：管理端网站（CRUD 界面）、搜索与排序、测试、部署文档**
**录制前准备：** 打开 IDE（代码）、浏览器两个标签页（`/admin/` + `api/events/all`）

> ⚠️ 开始前先确认：浏览器打开 `https://24832203.it.scu.edu.au/api/events/all` **必须返回 JSON**。
> 目前它返回 404 —— 说明 Node 应用还没注册/没启动，先按文末"API 404 排查"处理，修好再录。

---

## 0:00–0:40 开场（40 秒）

**屏幕上：** 浏览器打开 `https://24832203.it.scu.edu.au/admin/`

> "Hi, I'm Xiang Hu, student ID 24832203. This is Assessment 3 — Hearts United. My teammate Boyu Liu built the database, the API and the public website; **I built the admin-side website**, plus the search and sorting on the dashboard, the test plan and the deployment documentation. That's what I'll show."

---

## 0:40–2:30 问题 1：架构 —— 管理端依赖哪些 API（1 分 50 秒）

### 0:40–1:10 管理端用到的数据

**操作：** 浏览器打开 `https://24832203.it.scu.edu.au/api/events/all`

> "The dashboard runs entirely on this one endpoint: `GET /api/events/all`. It returns **every** event — including past and suspended ones that the public site deliberately hides — and each row carries a `registration_count`."

### 1:10–2:10 打开 server.js 讲四个写操作

**操作：** IDE 打开 `A3-api/server.js`，依次停在这几行：

| 行号 | 路由 | 管理端用途 |
|---|---|---|
| 156 | `GET /api/events/all` | 列表 |
| 268 | `POST /api/events` | 新建 |
| 293 | `PUT /api/events/:id` | 编辑 |
| 327 | `DELETE /api/events/:id` | 删除 |
| **342** | 返回 409 | **有注册时拒绝删除** |

**指着 342 行说：**

> "This is the data-integrity rule from the brief: an event can only be deleted if it has no registrations. Before deleting, the API counts the registrations; if there are any it returns 409 Conflict with the reason. My job on the front end was to make that message visible to the staff member instead of failing silently."

（可选 20 秒）提到 `registrations` 表的 `UNIQUE (event_id, email)`，说明"重复注册这条规则我不需要在界面上判断，数据库已经保证"。

---

## 2:30–3:50 问题 2：数据流（1 分 20 秒）

**操作：** IDE 打开 `A3-adminside/src/app/services/api.service.ts`

**指 18、24、30、36、42 行：**

> "One method per endpoint — list, single event, create, update, delete. Each returns an Observable; nothing is sent until a component subscribes."

**操作：** 打开 `A3-adminside/src/app/pages/dashboard/dashboard.ts`

**指 25–33 行（signals）：**

> "State is held in Angular signals: loading, error, notice, and the search term typed by the user."

**指 81 行 `this.api.getAllEvents().subscribe({...})`：**

> "Here the request is actually made. On success the events land in a signal; on error the message goes into the error signal and is rendered on the page."

**指 42 行 `visibleEvents = computed(...)` 和 56–65 行：**

> "This is the part I added: search and sorting are a **computed** list derived from the signal. Filtering and re-ordering happen in memory, so typing in the search box never triggers another HTTP request — the data is fetched once."

**操作：** 打开 `dashboard.html`，指表格行

> "And this is where the data becomes HTML: one row per event, with the action buttons. The delete button on each row calls `deleteEvent` at line 106."

---

## 3:50–6:10 问题 3：功能实机演示（2 分 20 秒）

**操作：** 浏览器 `https://24832203.it.scu.edu.au/admin/` 依次操作

1. **看列表**
   → "Every event, regardless of status: Upcoming, Past and Suspended all appear — that's a requirement. Each row shows the registration count."

2. **搜索框输入一个关键词**（如 "walk"）
   → "Case-insensitive, and it searches name, location, category and organisation at the same time."

3. **切换排序**（Name / Date / Registrations / Newest）
   → "Four sort orders, all done client-side from the already-loaded list."

4. **点 New Event** → **什么都不填直接 Save**
   → "Validation: every essential field is checked before anything is sent to the API."

5. **完整填写**（name / date / location / category / organisation / price / goal）→ **Save**
   → "That's `POST /api/events`. The new event appears at the top of the list immediately."

6. **点该事件的 Edit**
   → "The form is pre-filled from `GET /api/events/:id`, and it also lists the registrations recorded for this event — name, email, phone, tickets and date — so staff can see who is coming before they change or cancel it." → **改一个字段 → Save** → "`PUT /api/events/:id`"

7. **点一个有注册数的事件的 Delete** → **确认**
   → 显示 "This event cannot be deleted because it already has N registration(s)."
   → "That's the 409 from the API; I surface the exact reason here."

8. （可选）**点一个 0 注册的事件删除**
   → "And when there are no registrations, the delete succeeds."

9. **指顶部菜单**
   → "Events and New Event are on every admin page — the brief requires menu navigation."

---

## 6:10–7:00 收尾（50 秒）

> "To summarise my part: I built the admin-side website — the dashboard that lists every event with its registration count, the new and edit forms sharing one validated component, and the delete flow that reports the API's 409 clearly. I also added in-table search and the four sort orders using Angular signals, wrote and ran the manual test plan, and wrote the cPanel deployment documentation.
> Everything is deployed to my own SCU cPanel account: admin at `24832203.it.scu.edu.au/admin`, client at the root, API at `/api`.
> Thanks for watching."

---

## 附：API 404 排查（录视频前必须修好）

`https://24832203.it.scu.edu.au/api/events/all` 现在返回 404 = **Node 应用没有在该路径上注册或没运行**。

1. cPanel → **Setup Node.js App** → 看列表里有没有你的应用
   - 没有 → 点 **CREATE**：Application root `app-api`、Application URL `api`、Startup file `server.js`
2. 有 → 点开详情，确认状态是 **started**；不是就点 **RESTART**
3. 确认 `app-api` 目录里有 `server.js`、`node_modules`、`db-config.js`
4. 没有 `node_modules` → Terminal 里跑：
   ```
   source /home/<你的cPanel用户名>/nodevenv/app-api/18/bin/activate && cd /home/<你的cPanel用户名>/app-api
   npm install
   ```
5. `db-config.js` 必须是：`user` = 你的**数据库用户全名**，不是库名；`database` = 库名
6. RESTART → 再刷 `https://24832203.it.scu.edu.au/api/events/all`
   - 出现 JSON = 修好了，可以录视频
   - 还是不行 → 把 Node.js 页面截图发出来

## 录制清单

- [ ] 修好 API（见上）
- [ ] 录屏全屏，浏览器 100%，IDE 字体 ≥14px
- [ ] 提前打开标签页，关掉弹窗通知
- [ ] 导出 MP4 → SCU OneDrive → 生成分享链接
- [ ] 隐身窗口验证链接可打开
