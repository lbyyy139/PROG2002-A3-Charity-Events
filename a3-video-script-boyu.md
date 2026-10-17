# A3 Demo Video Script — Boyu Liu (24832407)

**目标时长：6–7 分钟**（brief 上限 15 分钟）
**我负责的部分：数据库设计、REST API、客户端网站**
**录制前准备：** 打开 IDE（代码）、浏览器三个标签页（首页 / `api/events/1` / phpMyAdmin）

---

## 0:00–0:40 开场（40 秒）

**屏幕上：** 浏览器打开 `https://24832407.it.scu.edu.au/`

> "Hi, I'm Boyu Liu, student ID 24832407. This is Assessment 3 for PROG2002 — Hearts United, a complete dynamic charity events website. My teammate Xiang Hu and I split the work: he built the admin-side site, and I built **the database, the REST API and the public client-side website**. That's what I'll show today."

---

## 0:40–2:40 问题 1：数据库与 API 架构（2 分钟）

### 0:40–1:20 数据库 schema

**操作：** cPanel → phpMyAdmin → 数据库 `bliu20_charity` → 点 `registrations` 表 → 切到 **Structure** 标签
（或 IDE 打开 `A3-api/charityevents_db.sql` 第 **62** 行 `CREATE TABLE registrations`）

**指着说：**

> "This is the new table for A3. `registration_id` is the primary key, `event_id` is a foreign key to `events`, so a registration can never point at an event that doesn't exist. It stores the user's name, email, phone, the number of tickets, and `registration_date` which MySQL fills with `DEFAULT CURRENT_TIMESTAMP` — the browser never sends the date, so it can't be forged."

**指着 UNIQUE 那一行说：**

> "This is the important one: `UNIQUE (event_id, email)`. The brief says one person may register for many events, but only once for the same event. I enforce that **in the database**, not in the form — so even if you call the API directly you cannot register twice."

**切到 Browse 标签（或 SQL 文件第 197 行）：**

> "Here is the seed data — ten registrations across six events. The brief asks for a minimum of ten."

### 1:20–2:10 API 路由一览

**操作：** IDE 打开 `A3-api/server.js`，从顶部往下滚，停在每一个路由上：

| 行号 | 路由 | 一句话 |
|---|---|---|
| 136 | `GET /api/events` | 首页：当前/即将开始且未暂停的活动 |
| 156 | `GET /api/events/all` | 管理端：所有活动（含 past/suspended）+ 注册数 |
| 178 | `GET /api/events/search` | 搜索页：按日期/地点/类别过滤 |
| **228** | `GET /api/events/:id` | **详情页：单个活动 + 它的 registrations** |
| 268 | `POST /api/events` | 管理端新建 |
| 293 | `PUT /api/events/:id` | 管理端更新 |
| 327 | `DELETE /api/events/:id` | 管理端删除（有注册返回 409） |
| **361** | `POST /api/events/:id/registrations` | **注册（A3 新功能）** |
| 421 / 439 | `GET /api/categories`、`/organisations` | 下拉框数据 |

**指着 228 行说：**

> "This is the endpoint I improved for A3. It returns the event *and* its registrations in one call, ordered by registration date descending, so the event page can show 'who is coming' with the newest first — that was an explicit requirement."

**再指 16–17 行 + `event_db.js` 第 43 行：**

> "All database access goes through one module with a connection pool, and every statement is parameterised — user input is never concatenated into SQL."

### 2:10–2:40 浏览器实测一个 endpoint

**操作：** 切到标签页 `https://24832407.it.scu.edu.au/api/events/1`

> "This is the raw JSON. You can see the event fields, and at the bottom the `registrations` array — four people, sorted newest first. Nothing here is hard-coded; it's all from MySQL."

（可选，30 秒：再打开 `.../api/events/search?categoryId=2`，说明搜索过滤也在 SQL 里完成）

---

## 2:40–4:00 问题 2：数据流（API ↔ 网站，1 分 20 秒）

**操作：** IDE 打开 `A3-clientside/src/app/services/api.service.ts`

**指 19、41、65 行：**

> "Every request starts here — one service, one method per endpoint. Angular's `HttpClient` returns an Observable, so nothing happens until a component subscribes."

**操作：** 打开 `A3-clientside/src/app/pages/event-detail/event-detail.ts`，停在 **57 行 `ngOnInit` → 66 行 `this.api.getEvent(id).subscribe`**

> "The component subscribes. In the `next` callback the event and its registrations land in a signal; in the `error` callback the message is shown on the page — so a failure is never a blank screen."

**指 80 行 `loadWeather` → 86 行**：

> "Then, if the event has coordinates, it calls the external Open-Meteo API for the forecast. That's the optional bonus feature."

**操作：** 打开同目录 `event-detail.html`，指 `Who is coming` 那个 `*ngFor` 块

> "And this is where the response becomes HTML — Angular loops over the registrations the API returned. Because the SQL already ordered them, the newest registration is on top."

---

## 4:00–6:10 问题 3：功能实机演示（2 分 10 秒）

**操作：** 浏览器依次操作，边点边说

1. **首页** `https://24832407.it.scu.edu.au/`
   → "Cards come from `GET /api/events`."

2. **Search Events** → 选一个 category → 选日期 → 点搜索
   → "Filtering happens in SQL via `/api/events/search`." → 清空条件再搜一次 → "结果回到全部"

3. **点进任一个活动**（如 Sunrise Charity Walk）
   → 指着页面说：天气卡（Open-Meteo）、筹款进度条、"Who is coming" 列表（按最新排序）

4. **点 Register 按钮**
   → 注意地址栏变成 `/event/8/register`
   → "The Register button now links to the new registration page, and the event id is passed in the URL."

5. **先什么都不填，直接 Submit**
   → "Client-side validation — each invalid field shows its own message, and nothing is sent."

6. **填表**：name / email / phone / tickets = 2 → **Submit**
   → "That POSTs to `/api/events/8/registrations`. The API validates again server-side and returns 201 Created."

7. 指出确认信息 → 点回活动详情页
   → "The new registration is now at the top of the list — the round trip is complete."

8. （可选 20 秒）**用同一个邮箱再注册一次**
   → 显示 "already registered" → "That's the UNIQUE constraint: MySQL raises ER_DUP_ENTRY, I catch it in `server.js` line 409 and return 409 Conflict instead of a generic error."

---

## 6:10–7:00 收尾（50 秒）

**屏幕上：** 回到首页

> "To summarise my part: I designed and populated the database including the new `registrations` table, I wrote the complete CRUD REST API with validation and parameterised queries, and I built the public client-side website — home, search, event detail with weather and the registration list, and the registration form.
> Everything is deployed to my own cPanel: client at `24832407.it.scu.edu.au`, admin at `/admin`, and the API at `/api/events`. The code is on GitHub.
> Thanks for watching."

---

## 录制清单

- [ ] 录屏全屏，浏览器缩放 100%，IDE 字体调大（≥14px）
- [ ] 提前打开好标签页，避免现场找 URL
- [ ] 关掉微信弹窗、桌面通知
- [ ] 导出 MP4 → 上传 SCU OneDrive → 生成**分享链接**（Blackboard 交链接）
- [ ] Blackboard 提交前把链接粘到浏览器隐身窗口确认能打开
