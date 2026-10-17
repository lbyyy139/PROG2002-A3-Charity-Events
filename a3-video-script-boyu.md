# A3 Demo Video Script — Boyu Liu (24832407)

**时长目标：10–11 分钟（上限 15 分钟）**

**格式说明**
- `▶ 操作` = 屏幕上要做的事
- `>` = 要念的英文台词（照着念即可，可口语化）
- `💻 代码` = 讲解时指给镜头看的代码（不用念，指一下）

**三个必答问题（作业原文）**
1. Database and API architecture（ULO3: Plan & design）
2. Data flow and interaction between API and website（ULO1 + ULO3）
3. Website functionality demo（ULO3）

⚠️ 全程强调**你负责的部分**：数据库设计、API 全部端点、客户端网站。

---

## 开录前检查清单

- [ ] API 在线：浏览器打开 `https://24832407.it.scu.edu.au/api/events` 有 JSON
- [ ] 客户端：`https://24832407.it.scu.edu.au/`
- [ ] 管理端：`https://24832407.it.scu.edu.au/admin/`
- [ ] VS Code 打开 `A3-api` 与 `A3-clientside`
- [ ] 三个标签页按顺序排好，关掉其他窗口

---

## Part 0 — 开场（0:00 – 0:50）

▶ 操作：VS Code 展示三个目录 `A3-api` / `A3-clientside` / `A3-adminside`。

> Hello, my name is Boyu Liu, student ID 24832407. I worked in a team of two with Xiang Hu. This is Assessment 3, which extends our Assessment 2 charity events website.
>
> In A2 the site could only display events. For A3 I extended the database with a registrations table, completed the full CRUD cycle in the REST API, rebuilt the public client-side website using Angular 22 and TypeScript, and integrated the external Open-Meteo weather API. Xiang Hu developed the admin-side website.
>
> I'll structure this video around the three questions in the brief: the database and API architecture, the data flow between the API and the website, and a live demo of the functionality. Let me start with the database.

---

## Part 1 — 问题 1：数据库与 API 架构（0:50 – 4:30）

### 1a 数据库设计（0:50 – 2:10）

▶ 操作：打开 `A3-api/charityevents_db.sql`，滚到 `CREATE TABLE registrations`。

> The database has four tables: organisations, categories and events came from A2, and the new registrations table was designed for A3.
>
> Let me explain the design decisions in the new table.

💻 代码（指着念关键点）：
```sql
registration_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT uq_reg_event_email UNIQUE (event_id, email)
```

> Three decisions are worth explaining.
>
> First, the registration date uses DEFAULT CURRENT_TIMESTAMP, so MySQL sets the timestamp — the browser never sends it. A client therefore cannot forge or backdate a registration.
>
> Second, the UNIQUE constraint on event_id and email enforces the rule from the brief: one user may register for many events, but only once per event. I deliberately enforced this in the database, not just in the interface, because the API is public and someone could call it directly. The database is the last line of defence.
>
> Third, event_id is a foreign key to the events table, so a registration can never point at an event that does not exist.

▶ 操作：滚到 events 表，指出 `latitude` / `longitude`。

> I also added latitude and longitude to the events table. That exists specifically to support the external weather API, which needs coordinates.

▶ 操作：切到 `https://24832407.it.scu.edu.au/api/events/all`。

> The seed data contains 3 organisations, 5 categories, 11 events and 10 registrations — meeting the required minimum of 10 registrations.

### 1b API 架构（2:10 – 3:40）

▶ 操作：打开 `A3-api/server.js`，慢慢滚过各个路由。

> The API is a Node.js and Express application exposing ten resource-based endpoints covering the full CRUD cycle.

💻 代码（逐个指）：
```
GET    /api/events                    即将进行的活动（客户端首页）
GET    /api/events/all                全部活动 + 报名数（管理端）
GET    /api/events/search             按日期/地点/分类筛选
GET    /api/events/:id                单个活动详情
POST   /api/events                    新建活动
PUT    /api/events/:id                更新活动
DELETE /api/events/:id                删除活动（有报名则阻止）
POST   /api/events/:id/registrations  提交报名
GET    /api/categories                分类下拉框
GET    /api/organisations             机构下拉框
```

> Each page of the website maps to a specific endpoint: Home uses GET /api/events, Search uses GET /api/events/search, and the Details page uses GET /api/events/:id.

▶ 操作：打开 `A3-api/event_db.js`，指出连接池和 `?` 占位符。

> All ten endpoints share a single MySQL connection pool, so requests reuse connections instead of opening a new one each time.
>
> Every SQL statement uses ? placeholders rather than string concatenation. The database driver escapes the values, which is what protects the API from SQL injection.

### 1c 实测一个端点（3:40 – 4:30）

▶ 操作：浏览器地址栏输入
`https://24832407.it.scu.edu.au/api/events/search?categoryId=1`

> Let me test the search endpoint directly. Here I filter by category id 1 and the API returns only the matching events as JSON.
>
> Testing the API on its own, without the website, proves the endpoint works independently — that is how I verified each route during development.

---

## Part 2 — 问题 2：数据流（4:30 – 6:40）

▶ 操作：并排打开 `home.ts` → `api.service.ts` → `server.js` 的 GET /api/events。

> Let me trace one complete request: loading the Home page.
>
> Step one: when the page is created, Angular calls ngOnInit, which calls the load method, which calls getEvents on the ApiService.

💻 代码（指 api.service.ts）：
```ts
getEvents(): Observable<CharityEvent[]> {
    return this.http.get<CharityEvent[]>(`${this.base}/api/events`)
        .pipe(catchError(this.handleError));
}
```

> Step two: the service uses Angular's HttpClient to send a GET request to the API URL. This is asynchronous — it returns an Observable, not the data itself.
>
> Step three: Express receives the request, and the route handler asks the connection pool for a connection and runs a SELECT statement, joining events to categories and organisations.

💻 代码（指 server.js 里的 SQL）：

> Step four: MySQL returns rows, Express converts them to JSON and sends them back with a 200 status.
>
> Step five: back in the component, the next callback receives the array and stores it in a signal.

💻 代码（指 home.ts）：
```ts
this.api.getEvents().subscribe({
    next: (events) => {
        this.events.set(events);
        this.loading.set(false);
    },
```

> Step six: because the template reads that signal, Angular re-renders automatically. The template loops over the array with @for and outputs one card per event.

💻 代码（指 home.html 的 @for）：

> The important point: I never manipulate the DOM manually. I change the state, and Angular updates the view. And if the API is unreachable, the error callback runs and the page shows a clear message instead of breaking.

---

## Part 3 — 问题 3：客户端功能演示（6:40 – 9:40）

▶ 操作：打开 `https://24832407.it.scu.edu.au/`。

> This is the Home page. All cards you see were fetched live from the API — nothing here is hard-coded.

▶ 操作：点 Search，演示按日期 / 地点 / 分类筛选。

> The Search page builds query parameters and calls the search endpoint. Let me filter by category...

▶ 操作：**故意留空必填项**点搜索，展示校验提示。

> If I submit without the required criteria, the page shows a validation message instead of sending a useless request.

▶ 操作：点进一个活动详情页，指出报名列表和天气预报。

> The Details page shows the event, the list of everyone who has registered, and the weather forecast for the event location.
>
> The forecast comes from Open-Meteo, an external API. I pass the event's latitude and longitude, which is exactly why I added those columns to the database.

▶ 操作：点 Register → 填表 → 演示空姓名 / 错误邮箱 / 票数 0 或 99。

> The registration form validates the name, the email format and the ticket count. Tickets must be a whole number between 1 and 20 — I'll show that error now.

▶ 操作：正确填写 → 提交 → 展示成功确认。

> With valid input, the form posts to the registrations endpoint and shows a confirmation. If I register the same email again for the same event, the database UNIQUE constraint rejects it and the API reports that clearly.

---

## Part 4 — 收尾（9:40 – 10:30）

> To summarise my individual contributions: I designed the registrations table and adapted the existing schema; I implemented and tested all ten REST endpoints with a shared connection pool and parameterised queries; I rebuilt the client-side website in Angular 22 with TypeScript, including Home, Search, Details and Register; and I integrated the Open-Meteo weather API.
>
> Everything is deployed and running live on my SCU cPanel account, and the full source code is in our GitHub repository. Thank you for watching.

---

# 常见追问与标准答案

**Q1: 为什么报名时间不让前端传？**
> Because a client can send anything. If the browser sent the date, someone could backdate or forge registrations. Letting MySQL fill it with CURRENT_TIMESTAMP makes the timestamp trustworthy and set by the server only.

**Q2: 怎么防止同一个人重复报名同一活动？**
> A UNIQUE constraint on (event_id, email) in the database. I didn't rely on the interface alone, because the API can be called directly. If the insert violates the constraint, MySQL rejects it and the API turns that into a clear error message.

**Q3: 你们怎么防 SQL 注入？**
> Every query uses ? placeholders instead of concatenating strings. The mysql2 driver escapes the values before they reach MySQL, so user input is always treated as data, never as executable SQL.

**Q4: 为什么用连接池？**
> Opening a new connection per request is slow and exhausts MySQL's connection limit. The pool keeps connections open and reuses them, which is faster and more stable under load.

**Q5: 删除活动时为什么要返回 409？**
> 409 Conflict is the correct status for "the request conflicts with the current state". The event still has registrations, so deleting it would break data integrity. The API refuses and explains why, instead of silently destroying records.

**Q6: 为什么客户端和管理端分成两个 Angular 项目？**
> They have different audiences and responsibilities. The public site is read-oriented for visitors; the admin site manages data. Separating them keeps each app smaller, and the admin interface can be deployed and restricted independently.

**Q7: 天气 API 挂了会怎样？**
> The page still renders the event and registrations. The weather block shows an error message rather than breaking the page — I handled that failure path deliberately.

**Q8: A3 相对 A2 最大的技术变化是什么？**
> Moving from static HTML and vanilla JavaScript to a component-based Angular architecture with TypeScript. That gives compile-time type checking, reusable components, and reactive state with signals.
