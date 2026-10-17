# A3 完整 cPanel 部署指南（Xiang Hu 自用版）

> 适用：SCU cPanel 共享主机 · Node.js + Express API · Angular 22 双前端 · MySQL
> 全程约 30–40 分钟。按顺序做，每步做完再进下一步。

---

## 第 0 步：准备好本地文件

| 文件 | 用途 |
|---|---|
| `WebDevelopment2\deploy-package\client-deploy.zip` | 客户端前端（含 .htaccess） |
| `WebDevelopment2\deploy-package\admin-deploy.zip` | 管理端前端（含 .htaccess） |
| `WebDevelopment2\A3-api\charityevents_db_cpanel.sql` | 数据库结构与种子数据 |
| `WebDevelopment2\api-upload.zip` | API 源码（不含 node_modules 和 db-config.js） |

**先生成你自己的前端包**（地址换成你的）：

```powershell
cd c:\Users\ASUS\Desktop\WebDevelopment2
powershell -ExecutionPolicy Bypass -NoProfile -File .\build-deploy.ps1 -ApiBase "https://你的学号.it.scu.edu.au"
```

跑完 `deploy-package\` 下会有两个 zip。脚本会自动还原 `environment.ts`，**不会把你的地址提交到共享仓库**。

---

## 第 1 步：建数据库

1. cPanel → **Databases** 分区 → **MySQL® Databases**
2. **Create New Database** → 填 `charity` → Create
   - 实际名字会是 `你的账号_charity`，**记下全名**
3. 往下 **Add New User** → 用户名 `charityu` → 密码用 **Password Generator** 生成 → **复制保存** → Create User

---

## 第 2 步：给用户授权（最容易漏）

1. 同页面往下 **Add User To Database** → 选你建的用户 + 你建的数据库 → **Add**
2. 勾选 **ALL PRIVILEGES** → **Make Changes**

> 少了这步，API 连得上 MySQL 但查不了表，会报 "Failed to retrieve events."

---

## 第 3 步：导入 SQL

1. cPanel → **phpMyAdmin**
2. 左侧**先点中**你的数据库 `你的账号_charity`
3. 顶部 **Import** → Choose File → 选 `charityevents_db_cpanel.sql` → 滚到底点 **Import**
4. 绿色「导入成功」即可
5. 左侧应出现 4 张表：`organisations` `categories` `events` `registrations`
   - `events` 有 11 条，`registrations` 有 10 条

---

## 第 4 步：上传 API 代码

1. **File Manager** → 左上角 **+ Folder** → `app-api` → Create
   - 必须建在**主目录**下：`/home/你的账号/app-api`
   - **不要**建在 public_html 里面
2. 进入 `app-api` → **Upload** → 选 `api-upload.zip`
3. 右键 zip → **Extract** → 确认路径是 `/home/你的账号/app-api` → Extract
4. 删掉 `api-upload.zip`

验证 `app-api` 里有：`server.js` `event_db.js` `package.json` `package-lock.json` `db-config.example.js`

---

## 第 5 步：注册 Node.js 应用

cPanel → **Software** → **Setup Node.js App** → **CREATE APPLICATION**

| 项 | 填法 |
|---|---|
| Node.js version | 列表里**可用的最高版** |
| Application mode | **Production** |
| Application root | `app-api` |
| Application URL | `api` |
| Application startup file | `server.js` |

创建后列表里状态应显示 **● started**。

---

## 第 6 步：安装依赖

**A. 界面有 "Run NPM Install" 按钮**（老版界面）  
→ 点应用左边 `>` 展开 → 点 **Run NPM Install** → 等 1～5 分钟 → 出现 `added xx packages`

**B. 界面只有铅笔/重启图标**（新版简化界面，和 Boyu 的一样）  
→ cPanel 搜索 **Terminal** 打开  
→ 回应用**详情页**，页面里有一行激活命令，形如：
```
source /home/你的账号/nodevenv/app-api/18/bin/activate && cd /home/你的账号/app-api
```
**照抄页面上的那行**（版本号以你的为准），粘贴到 Terminal 回车  
→ 再跑 `npm install` → 等出现 `added xx packages`

---

## 第 7 步：创建 db-config.js（关键）

这个文件**不在上传包里**（含密码，不能进 GitHub），必须手工建：

1. File Manager → `app-api` → **+ File** → 名字填 **`db-config.js`** → Create
2. 右键它 → **Edit** → 粘贴：

```js
module.exports = {
    host: 'localhost',
    port: 3306,
    user: '你的账号_charityu',
    password: '你生成的密码',
    database: '你的账号_charity'
};
```

3. **Save Changes** → Close
4. 确认文件名没变成 `db-config.js.txt`

> **最常见的错**：`user` 里填了数据库名。用户名和数据库名是**两个不同的值**，去 MySQL Databases 的 Current Users 里复制准确的用户名。

---

## 第 8 步：重启并测试

1. Node.js 页面 → 点 **⟳ RESTART**
2. 打开 `https://你的学号.it.scu.edu.au/api/events` → 看到 JSON 即成功 ✅

---

## 第 9 步：上传前端

**先开隐藏文件**：File Manager → Settings → 勾 **Show Hidden Files (dotfiles)** → Save

**客户端**
1. 进入 `public_html`，删掉 cPanel 默认页
2. Upload `client-deploy.zip` → Extract → 删 zip
3. 确认 `public_html` 根下**直接**有 `index.html` `main-*.js` `styles-*.css` `images\` `.htaccess`
   - 若多套了一层 `browser\` 或 `dist\` → 进去全选 Move 到根目录

**管理端**
1. `public_html` 里 **+ Folder** → `admin`
2. 进入 `public_html\admin` → Upload `admin-deploy.zip` → Extract → 删 zip

---

## 第 10 步：验收清单

- [ ] `/api/events` 和 `/api/categories` 都返回 JSON
- [ ] 客户端首页显示活动卡片（**有数据**说明连上 API）
- [ ] 搜索页能筛选，空条件会提示
- [ ] 详情页显示报名列表 + 天气预报
- [ ] 报名表单：空姓名 / 错误邮箱 / 票数 0 或 99 都报错
- [ ] 报名成功有确认信息
- [ ] 管理端显示全部活动 + 报名数
- [ ] 新建、编辑成功
- [ ] 删除需两次确认
- [ ] 删除有报名的活动被阻止并提示
- [ ] **刷新子页面不 404**（验证 .htaccess）

---

## 第 11 步：故障排查

| 症状 | 原因 | 解决 |
|---|---|---|
| "Failed to retrieve events." | db-config.js 缺失或凭据错 | 检查文件存在；`user` 用**用户名**不是库名；密码 |
| git 报 "Connection was reset" | HTTP/2 被掐 | `git config --global http.version HTTP/1.1` |
| ng build 报 Node 版本不够 | 系统 Node v24.14.1 差一版 | 用 `build-deploy.ps1`（自带便携 Node 22） |
| 请求出现 `/api/api/events` | apiUrl 带了 /api，服务又拼了一次 | apiUrl 只写 `https://你的学号.it.scu.edu.au` |
| 刷新子页 404 | 缺 .htaccess | 确认已上传到对应目录 |
| 白屏 | 资源路径不对 | 管理端必须 `ng build --base-href /admin/` |

---

## 第 12 步：你最终要交的东西

1. **三个 zip**（用**你的学号**命名）
   - `你的学号A3-clientside.zip`
   - `你的学号A3-adminside.zip`
   - `你的学号A3-api.zip`（**不含** `db-config.js` 和 `node_modules`，含 SQL）
2. **GitHub 仓库链接**：`https://github.com/lbyyy139/PROG2002-A3-Charity-Events`
3. **视频 OneDrive 分享链接**（用 `a3-video-script-xiang.md`）
4. **同伴互评表**：单独发邮件给 tutor，标题 `PROG2002_A3_[TeamID]_[你的名字]`

---

## ⚠️ 两个纪律提醒

1. **不要共享 cPanel 凭据** —— 作业明文规定，违规按安全策略处理。你必须用自己的账号完整部署一遍。
2. **不要伪造提交记录** —— 评分看 GitHub 真实记录，作业原文写明："Failing to show the correct work progress will cause the assignment to fail." 你做了多少就提交多少。
