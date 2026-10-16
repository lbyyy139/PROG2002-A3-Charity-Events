# PROG2002 A3 Demo Video Script（详细版，目标 13–14 分钟，上限 15）

**格式说明**
- `▶ 操作` = 屏幕上要做的事
- `>` = 你要念的英文讲解词
- `💻 代码` = 讲解时要指给镜头看的代码片段（不用念，指一下即可）

**A3 视频的三个必答问题（作业原文）**
1. Database and API architecture（ULO3 计划与设计）
2. Data flow and interaction between API and website（ULO1 + ULO3）
3. Website functionality demo（ULO3 完整动态网站）

⚠️ 全程要强调**你个人负责的部分**（作业要求 "Focus on your individual contributions"）。

---

## 开录前检查清单

- [ ] MySQL 已启动，`charityevents_db`（A3 版，含 registrations 表，14 条报名）已导入
- [ ] `cd A3-api && node server.js` 运行中（端口 3000）
- [ ] `cd A3-clientside && npm start`（端口 4200）
- [ ] `cd A3-adminside && npm start -- --port 4201`（端口 4201）
- [ ] 浏览器开好标签：① `localhost:3000/api/events` ② `localhost:4200` ③ `localhost:4201`
- [ ] Postman 打开（或准备用浏览器演示 POST）
- [ ] VS Code 打开 A3-api 与 A3-clientside
- [ ] 关掉其他无关窗口，通知免打扰

---

## Part 0 — 开场（0:00 – 0:40）

▶ 操作：VS Code，展示三个文件夹 `A3-api` / `A3-clientside` / `A3-adminside`。

> Hello, my name is Boyu Liu, student ID 24832407, and my team member is Xiang Hu. This is Assignment 3, built on top of our Assignment 2 charity events website.
>
> In A2 we could only display events. For A3 we extended the database with a registrations table, completed the full CRUD cycle in the REST API, rebuilt the client-side website with Angular 22 and TypeScript, and developed a brand-new admin-side website so staff can manage events. I also integrated the external Open-Meteo weather API.
>
> I'll structure this video around the three questions in the brief: the database and API architecture, the data flow between the API and the websites, and a live demo of the functionality. Let me start with the database.

---

## Part 1 — 问题 1：数据库与 API 架构（0:40 – 4:20）

### 1a 数据库设计（0:40 – 1:50）

▶ 操作：打开 `A3-api/charityevents_db.sql`，滚到 `CREATE TABLE registrations`。

> The database is called charityevents_db and now has four tables: organisations, categories, events — those three came from A2 — and the new registrations table.
>
> Let me explain the design of the new table. It stores a unique registration id, the user's full name, email address and phone number, the number of tickets they purchased, and the registration date.

💻 代码（指着念关键点）：
```sql
registration_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT uq_reg_event_email UNIQUE (event_id, email)
```

> Two decisions are worth explaining. First, the registration date uses DEFAULT CURRENT_TIMESTAMP, so MySQL sets it — the browser never sends it. That means a client cannot forge or backdate a registration.
>
> Second, the UNIQUE constraint on event_id and email enforces the rule from the brief: one person may register for many events, but only once per event. I deliberately enforced this in the database, not just in the interface, because the API is public and someone could call it directly — the database is the last line of defence.
>
> event_id is a foreign key to the events table, so a registration can never point at an event that does not exist.

▶ 操作：滚到 events 表，指出 `latitude` / `longitude` 两行。

> I also added latitude and longitude to the events table. That exists specifically for the external weather API, which needs coordinates.

▶ 操作：切到 MySQL 或终端，跑一次计数（或提前准备好结果）。

> The seed data contains 3 organisations, 5 categories, 11 events and 14 registrations — above the required minimum of 10.

### 1b API 架构（1:50 – 3:30）

▶ 操作：打开 `A3-api/server.js`，从上往下慢慢滚，让镜头看到各个 `app.get / app.post / app.put / app.delete`。

> The API is a Node.js and Express application. It now exposes ten resource-based endpoints covering the full CRUD cycle.

💻 代码（逐个指）：
```
GET    /api/events                    当前/即将进行（客户端首页）
GET    /api/events/all                全部活动 + 报名数（管理端）
GET    /api/events/search             按日期/地点/类别筛选
GET    /api/events/:id                单个活动 + 报名列表
POST   /api/events                    新建
PUT    /api/events/:id                更新
DELETE /api/events/:id                删除（有报名则 409）
POST   /api/events/:id/registrations  报名
GET    /api/categories
GET    /api/organisations
```

> Let me explain the HTTP method choices. GET is safe, idempotent and cacheable, so every read uses it and I can test it straight in a browser. POST creates a new resource and is not idempotent, so it fits both creating an event and creating a registration. PUT replaces a resource at a known URL and is idempotent, which suits editing an event. DELETE removes a resource — and where data integrity forbids it, it returns 409 Conflict rather than pretending to succeed.

▶ 操作：滚到 `GET /api/events/:id`，指出 registrations 的查询与 ORDER BY。

> This endpoint was improved for A3. It now returns the event together with its complete list of registrations, ordered by the registration date descending — that is what powers the "Who is coming" section on the event page, and the brief asks for the latest purchase first.

▶ 操作：滚到 `DELETE /api/events/:id`。

> The delete endpoint is the most interesting one. Before deleting, the server counts the registrations for that event. If any exist it answers 409 Conflict with a reason, and the event is preserved. This upholds the data integrity the brief requires.

### 1c 现场测 API（3:30 – 4:20）

▶ 操作：切到浏览器 `localhost:3000/api/events`，展示 JSON。

> Let me test an endpoint directly in the browser. GET /api/events returns a JSON array — the current and upcoming events. Suspended and past events are filtered out here.

▶ 操作：地址栏改成 `localhost:3000/api/events/search?location=south&categoryId=1`。

> And this is the search filter — location and category combined. Only matching events come back.

▶ 操作：改成 `localhost:3000/api/events/search?date=banana`（演示验证失败）。

> If I send an invalid date, the API answers 400 with "Invalid date format. Expected YYYY-MM-DD." — validation happens before any query runs.

---

## Part 2 — 问题 2：数据流与前后端交互（4:20 – 6:40）

▶ 操作：打开 `A3-clientside/src/app/services/api.service.ts`。

> Both Angular websites talk to the API through one central ApiService. Each method wraps an Angular HttpClient call and returns an RxJS Observable, and every API error is converted into a readable Error object here. That means all components handle failures in one consistent way, and no component contains fetch logic of its own.

💻 代码（指 getEvent / createRegistration 之类的方法）：
```ts
getEvent(id): Observable<CharityEvent> {
  return this.http.get<CharityEvent>(`${this.apiUrl}/events/${id}`)
    .pipe(catchError(...));
}
```

▶ 操作：打开 `A3-clientside/src/app/pages/event-detail/event-detail.ts`。

> Now let me trace one complete request. On the event detail page, the component reads the event id from the route, then subscribes to the service.

💻 代码（指出订阅部分）：
```ts
this.api.getEvent(id).subscribe({
  next: (event) => { ... },
  error: (err) => { ... }
});
```

> When the response arrives, the `next` callback stores the event — including its registrations array — in a signal. Angular's change detection then re-renders the template automatically. If the request fails, the `error` callback stores the message and the template shows it. So every possible outcome ends up visible on the page.

▶ 操作：打开 `event-detail.html`，指出绑定数据的地方。

> This is the rendering side. The template is plain HTML with Angular bindings — an `@for` loop over the registrations produces one row per person, and the fundraising progress bar is computed from goal_amount and raised_amount. No manual DOM manipulation is needed; the data flows from the database, through the API, into the signal, and onto the screen.

▶ 操作：打开 `register.ts`（报名提交）。

> Finally the write direction. When the user submits the registration form, the component validates the input first, then calls the service, which POSTs the JSON body to the API. The server validates again and inserts the row, then answers 201 with the new id, and the component shows a confirmation.

> The important point: data flows one way — database to API to service to component to template — and every layer validates and handles errors.

---

## Part 3 — 问题 3：功能演示（6:40 – 12:10）

### 3a 客户端：首页与搜索（6:40 – 8:10）

▶ 操作：`localhost:4200` 首页，慢慢滚动。

> This is the Angular client-side website, rebuilt from A2 using Angular 22 and TypeScript. Same three pages — home, search and details — plus the new registration page.

▶ 操作：切到搜索页，只选类别（不选日期/地点）提交 → 出结果。

> On the search page, the category dropdown is populated from GET /api/categories. I can filter by date, location or category, or any combination.

▶ 操作：什么都不选直接点 Search（演示验证）。

> If I submit with no criterion at all, the page shows a client-side validation message instead of calling the API — that is the validation the brief asks for.

▶ 操作：选一个过去的日期 → 演示"日期不能是过去"。

> And if I pick a date in the past, it is rejected too, because only current and upcoming events exist in the results.

### 3b 详情页：报名列表 + 天气（8:10 – 9:20）

▶ 操作：点开一个活动（用 id=8 Sunrise Charity Walk，有天气 + 3 条报名），滚到天气卡片与 "Who is coming"。

> On the detail page, two things are new for A3. First, the registrations list: every person who registered, with their email, phone, number of tickets and the date — sorted by the latest purchase first, exactly as required.
>
> Second, this weather card. It calls the external Open-Meteo API using the event's latitude and longitude, then translates the numeric weather code into readable text and an icon. If the forecast is not available for that date, the card shows a friendly note instead of breaking the page.

### 3c 报名流程（9:20 – 10:30）

▶ 操作：点 Register → 报名页。

> The Register button now opens a dedicated registration page. It shows the selected event at the top, so the user is certain what they are registering for.

▶ 操作：先提交空表单/无效邮箱 → 展示验证提示。

> Client-side validation rejects an empty name or an invalid email immediately, before anything is sent.

▶ 操作：正常填写姓名/邮箱/电话/票数 → 提交 → 展示确认信息。

> With valid input I submit... and the API answers 201, so we get this confirmation message. The registration date was set by the database, not by this form.

▶ 操作：回到详情页刷新，指出新报名在最上方；再用同一邮箱注册一次 → 展示 409。

> Back on the detail page, the new registration is at the top of the list. And if I register again with the same email, the API answers 409 — "This email address has already registered for this event" — because of the UNIQUE constraint I showed earlier.

### 3d 管理端（10:30 – 12:10）

▶ 操作：`localhost:4201` 仪表盘。

> This is the admin-side website, also built with Angular 22. The dashboard lists every event regardless of status — upcoming, past and suspended — with a registration count for each. That is why it calls a different endpoint, /api/events/all, because the public endpoints deliberately hide suspended and past events.

▶ 操作：New Event → 填表 → 说明必填验证 → 保存 → 列表出现新活动。

> The New Event form validates the essential fields before submitting. I'll create a test event... and it appears in the list immediately.

▶ 操作：Edit 一个有报名的活动（如 id=1）→ 指出下方报名表格 → 改一个字段 → 保存。

> The edit form is pre-filled from GET /api/events/:id, and it also displays the registrations recorded for this event — name, email, phone, tickets and date — which is what staff need before changing an event.

▶ 操作：对有报名的活动点 Delete 并确认 → 展示 409 提示。

> If I try to delete an event that has registrations, the API returns 409 and the dashboard shows the exact reason. The event is preserved.

▶ 操作：删除刚创建的测试活动 → 成功。

> The event I just created has no registrations, so this time the deletion succeeds.

---

## Part 4 — 部署、个人贡献与总结（12:10 – 13:50）

▶ 操作：展示 cPanel 或部署后的公网地址（若已部署）。

> Both websites and the API are deployed to my own SCU cPanel account, each student deploys to their own. The API runs as a Node.js application, and each Angular site is built with npm run build before the output is uploaded. The only change needed for production is the apiUrl in the environment file.

▶ 操作：回到 VS Code，指出你**自己写**的部分（建议提前选定 3–4 个文件）。

> Let me finish by being clear about my individual contribution. I personally built [在这里说明：例如 registrations 表与报名 API、客户端详情页与报名页、管理端编辑页与删除拦截]。My team member Xiang Hu worked on [说明队友负责的部分]. We coordinated through GitHub and our commit history shows the progress.

▶ 操作：可选，展示 GitHub 提交历史。

> Here is our GitHub repository — the commit history shows the work progressing step by step, from the database, to the API, to the two websites.

> To summarise: the database gained a registrations table with a UNIQUE constraint that prevents duplicates at the database level; the API now implements the full CRUD cycle with parameterised queries, server-side validation and 409 responses that protect data integrity; the client site adds registration and an external weather API; and the admin site gives staff complete control over events. Both sites are built with Angular 22 and TypeScript and deployed to cPanel. Thank you for watching.

---

## 常见追问（录完自己过一遍）

1. **How do you prevent duplicate registrations?** — UNIQUE (event_id, email) in MySQL; the API catches ER_DUP_ENTRY and answers 409. Not just client-side.
2. **Why can't every event be deleted?** — Data integrity: registrations reference the event; the API counts them first and blocks with 409.
3. **Where is the registration date set?** — Server-side, DEFAULT CURRENT_TIMESTAMP. The client never sends it, so it cannot be forged.
4. **Why does the admin list use a different endpoint?** — It must include suspended and past events that the public API hides.
5. **Why parameterised queries?** — User input is never concatenated into SQL, so injection is impossible.
6. **Why Angular instead of plain JavaScript?** — Components and services separate concerns, HttpClient gives typed responses and observables, and templates re-render automatically from state.
7. **How does the weather feature behave if the API fails?** — It degrades gracefully: the card shows a note, the rest of the page still works.
8. **What happens if the event date is outside the forecast range?** — Open-Meteo returns a limited window, so the card shows "not available yet" instead of wrong data.

---

## 录制提示

- 语速别太快，关键代码**停下来指着念**
- 每个"验证失败"的演示别跳过——作业明确要求展示 filtering and validation
- 409 的三个场景要讲到：重复报名、删除被拦截、（补充）无效输入 400
- 结尾必须说清楚**你个人做了什么**，这是评分点
- 录完传到 SCU OneDrive → 右键分享 → "Anyone with the link" → 可查看 → 复制链接
