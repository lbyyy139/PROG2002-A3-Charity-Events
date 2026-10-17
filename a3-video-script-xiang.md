# A3 Demo Video Script — Xiang Hu

**时长目标：10–11 分钟（上限 15 分钟）**

**格式说明**
- `▶ 操作` = 屏幕上要做的事
- `>` = 要念的英文台词（照着念即可，可口语化）
- `💻 代码` = 讲解时指给镜头看的代码（不用念，指一下）

**三个必答问题（作业原文）**
1. Database and API architecture（ULO3: Plan & design）
2. Data flow and interaction between API and website（ULO1 + ULO3）
3. Website functionality demo（ULO3）

⚠️ 全程强调**你负责的部分**：管理端网站（列表 / 新建 / 编辑 / 删除）、测试与质量保证、cPanel 部署。

---

## 开录前检查清单

- [ ] 管理端：`https://24832407.it.scu.edu.au/admin/` 能打开、列表有数据
- [ ] API 在线：`/api/events/all` 返回 JSON
- [ ] VS Code 打开 `A3-adminside`
- [ ] 准备好一个「有报名记录」的活动（演示删除被阻止）
- [ ] 关掉其他窗口

---

## Part 0 — 开场（0:00 – 0:50）

▶ 操作：VS Code 展示 `A3-adminside/src/app` 目录结构。

> Hello, my name is Xiang Hu. I worked in a team of two with Boyu Liu, student ID 24832407. This is Assessment 3 for PROG2002, which extends our Assessment 2 charity events website.
>
> My responsibility was the admin-side website — the interface staff use to create, edit and delete events — plus testing and the deployment to SCU cPanel. Boyu Liu designed the database, implemented the REST API and built the public client-side website.
>
> I'll follow the three questions in the brief: the database and API architecture, the data flow between the API and the website, and a live demo of the functionality.

---

## Part 1 — 问题 1：数据库与 API 架构（0:50 – 4:00）

### 1a 数据库结构（0:50 – 2:00）

▶ 操作：打开 `A3-api/charityevents_db.sql`，展示四个 `CREATE TABLE`。

> The database has four tables. organisations, categories and events were designed in A2; the registrations table is the A3 addition.
>
> The relationship that matters most for my admin interface is events to registrations: one event can have many registrations, and registration.event_id is a foreign key to events.

💻 代码（指着念）：
```sql
CONSTRAINT uq_reg_event_email UNIQUE (event_id, email)
```

> Two design decisions directly shape how my admin interface behaves.
>
> First, the UNIQUE constraint on event_id and email means each person can register for an event only once. It is enforced by the database, not by the interface — so even a direct API call cannot create a duplicate.
>
> Second, that foreign key is exactly why deleting an event is not always allowed. If an event still has registrations, deleting it would orphan those records. The API refuses with a 409 Conflict, and my dashboard shows that message to the user.

▶ 操作：指出 events 表里的 `latitude` / `longitude`。

> The events table also carries latitude and longitude, which the public Details page uses to request the weather forecast from Open-Meteo.

### 1b API 架构（2:00 – 3:20）

▶ 操作：打开 `A3-api/server.js`，滚过各个路由。

> The API is a Node.js and Express application with ten resource-based endpoints. My admin site uses five of them directly.

💻 代码（逐个指）：
```
GET    /api/events/all                全部活动 + 报名数   ← 管理端列表
GET    /api/events/:id                单个活动详情       ← 编辑页回填
POST   /api/events                    新建活动           ← 新建页
PUT    /api/events/:id                更新活动           ← 编辑页
DELETE /api/events/:id                删除活动           ← 列表删除按钮
```

> Notice the difference between the two list endpoints. The public Home page uses GET /api/events, which deliberately returns only upcoming, non-suspended events. The admin dashboard uses GET /api/events/all, which returns every event regardless of status — because staff need to see past and suspended events too.

💻 代码（指 /events/all 里的子查询）：
```sql
(SELECT COUNT(*) FROM registrations r
 WHERE r.event_id = admin_events.event_id) AS registration_count
```

> This correlated subquery counts the registrations for each event, which is what lets the dashboard show the registration count next to every row.

### 1c 实测端点（3:20 – 4:00）

▶ 操作：浏览器打开 `https://24832407.it.scu.edu.au/api/events/all`

> Here is the raw JSON from that endpoint. You can see each event carries its registration_count. The dashboard renders exactly this data — testing the endpoint on its own is how I confirmed the API before wiring it to the interface.

---

## Part 2 — 问题 2：数据流（4:00 – 6:30）

▶ 操作：并排打开 `event-form.ts` → `event-new.ts` → `server.js` 的 POST。

> Let me trace saving a new event, which is my module.
>
> Step one: the shared form component binds each input with ngModel, so the model object is updated as the user types.

💻 代码（指 event-form.html）：
```html
<input id="f-name" type="text" name="eventName" maxlength="150"
       [(ngModel)]="model().event_name">
```

> Step two: when the user presses Save, the form emits the values to the parent page.

💻 代码（指 event-form.ts 的 submit）：

> Step three: the parent page validates the required fields first — name, date, location, venue, description and purpose, plus the organisation and category dropdowns. If something is missing it shows a message and never sends the request.

💻 代码（指 event-new.ts 的 save 校验）：

> Step four: with valid data it calls the ApiService, which uses Angular's HttpClient to POST the object as JSON.

💻 代码（指 api.service.ts 的 createEvent）：

> Step five: Express parses the JSON body, validates it again on the server, and runs a parameterised INSERT. Note the second validation — the client can be bypassed, so the server never trusts it.
>
> Step six: MySQL confirms the insert, the API responds with the new event id, and the page navigates back to the dashboard, which reloads the list so the new event appears immediately.

💻 代码（指 event-new.ts 的 navigate）：

> The same flow runs on the edit page, except it calls PUT instead of POST.

---

## Part 3 — 问题 3：管理端功能演示（6:30 – 9:30）

▶ 操作：打开 `https://24832407.it.scu.edu.au/admin/`

> This is the dashboard. It lists every event with its registration count. The status column is derived from the data: if is_suspended is set, it's Suspended; otherwise it depends on whether the date is in the future.

💻 代码（指 dashboard.ts 的 statusOf）：

▶ 操作：点 New Event → **什么都不填直接 Save**。

> If I try to save an empty form, the page lists exactly which required fields are missing instead of sending an invalid request.

▶ 操作：正确填写一份 → Save → 回到列表指出刚建的活动。

> With valid input the event is created and appears in the list immediately, because the dashboard reloads after saving.

▶ 操作：点一个活动的 Edit → 改票价或日期 → Save。

> The edit page reuses the same shared form component, pre-filled from GET /api/events/:id. That reuse is why create and edit always stay consistent.

▶ 操作：在搜索框输入一个关键词（如 `run`）→ 展示列表即时收缩。

> Above the table I added search and sorting. The search is case-insensitive and matches the event name, location, category and organisation at once — those are the fields staff actually search on.
>
> Notice the counter: it says "Showing X of 11", so the user always knows the other rows are hidden by the filter rather than missing.

💻 代码（指 computed）：

> Filtering happens in memory through an Angular computed value. The list is fetched once; typing updates a signal and the view re-renders. If I open the Network tab you can see no new request is made — that keeps it instant even with many events.

▶ 操作：切换排序（Newest first → Most registrations）→ 点 Clear。

> Four orderings are available: newest first, oldest first, name A to Z, and most registrations. Clear resets both the filter and the order.

▶ 操作：点 Delete → 指出需要**再点一次**确认。

> Deletion needs two clicks: the first click arms the confirmation, the second actually deletes. This prevents an accidental click from destroying data.

▶ 操作：找一个**有报名记录**的活动点删除并确认 → 展示 409 提示。

> Here I try to delete an event that still has registrations. The API refuses with a 409 Conflict, and the dashboard shows the reason. This protects data integrity — I test this case every time I deploy.

---

## Part 4 — 部署（9:30 – 10:30）

▶ 操作：切到 cPanel 界面，依次展示三块。

> Everything I showed is running live on my own SCU cPanel account, as the brief requires.
>
> The database was created in MySQL Databases: a database, a user, and the user granted all privileges on that database — without that grant the API cannot query. The SQL file was then imported through phpMyAdmin.
>
> The API runs as a registered Node.js application: application root app-api, URL api, startup file server.js, then npm install to install dependencies. The database credentials live in a separate db-config.js which is git-ignored, so no password is ever committed.
>
> Both front ends are production builds. The admin site is built with --base-href /admin/ and published to public_html/admin, while the public site is published to public_html. Each folder also has an .htaccess file with rewrite rules, so refreshing a client-side route does not return a 404.

---

## Part 5 — 收尾（10:30 – 11:00）

> To summarise my individual contributions: I developed the entire admin-side Angular website — the dashboard with registration counts, the new and edit pages, and the shared form with validation and error handling. I tested every deployed route by hand, including the blocked-deletion case, and I deployed the database, the API and both front ends to my own cPanel account.
>
> The source code is in our GitHub repository. Thank you for watching.

---

# 常见追问与标准答案

**Q1: 删除活动为什么不能总是成功？**
> Because of referential integrity. A registration belongs to an event, so deleting the event would leave orphaned registrations. The API checks first and returns 409 Conflict with an explanation; staff can see which event still has registrations.

**Q2: 为什么要二次确认？**
> Deletion is irreversible. The first click only arms the confirmation and changes the button label; the second click performs the delete. It prevents losing data from a single mis-click.

**Q3: 新建和编辑为什么共用一个表单组件？**
> The fields and validation are identical, so sharing one component means one place to maintain them. The parent page decides whether to POST or PUT, and the form reports which mode it is in via an input flag.

**Q4: 前端校验之后为什么后端还要校验？**
> Client-side validation is only for user convenience — anyone can call the API directly and skip it. The server must validate every request, because it is the only layer that cannot be bypassed.

**Q5: 管理端怎么拿到报名数？**
> GET /api/events/all runs a correlated subquery that counts the registrations for each event and returns it as registration_count. The dashboard just renders that field.

**Q6: 部署时遇到过什么问题？**
> The main one was mixing up the database name and the database user name — the connection fails if they are swapped. And the client-side routes returned 404 on refresh until I added the .htaccess rewrite rules.

**Q7: 为什么两个前端要分开部署？**
> They serve different users and can be restricted independently. The admin site lives in its own subfolder, and both are built separately, so one can be updated without touching the other.

**Q8: 为什么筛选在前端做，不在后端加个搜索接口？**
> The admin list is already fully loaded, and the dataset is small, so filtering in memory avoids a network round trip and the interface responds instantly. It also keeps one source of truth: the full list stays in the signal and the displayed rows are derived from it, so clearing the filter can never lose data. For a very large dataset I would switch to a server-side search endpoint instead.

**Q9: 你们俩怎么协作？**
> We share one GitHub repository and commit our own work to it regularly, which gives a visible record of the project. We split the system vertically: Boyu owns the database, API and public site; I own the admin site, testing and deployment.
