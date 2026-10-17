"""Package current tracked A3 sources; exclude credentials and local build files."""
import argparse
import hashlib
from pathlib import Path
import shutil
import subprocess
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument('--student-id', required=True)
parser.add_argument('--output', type=Path, required=True)
parser.add_argument('--git', default='git')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
if not args.student_id.isdecimal():
    parser.error('student-id must contain digits only')
out = args.output.resolve()
if out.exists():
    parser.error('Output already exists; choose a new folder to preserve previous packages')

tracked = subprocess.check_output(
    [args.git, 'ls-files', '-z'], cwd=root).decode('utf-8').split('\0')
revision = subprocess.check_output(
    [args.git, 'rev-parse', 'HEAD'], cwd=root).decode().strip()
report = root / 'reports' / f'{args.student_id}A3-report.docx'
if not report.exists():
    parser.error(f'Missing individual report: {report}')

forbidden = {'node_modules', 'dist', '.angular', '.git', '.build-node', '.playwright-cli'}
manifest = {}
for part in ['clientside', 'adminside', 'api']:
    prefix = f'A3-{part}/'
    files = sorted(p for p in tracked if p.startswith(prefix))
    assert files, f'No tracked files for {part}'
    for rel in files:
        path = Path(rel)
        assert not forbidden.intersection(path.parts), rel
        assert path.name != 'db-config.js' and not path.name.startswith('.env'), rel
        assert (root / rel).is_file(), rel
    manifest[part] = files

out.mkdir(parents=True)
for part, files in manifest.items():
    dest = out / f'{args.student_id}A3-{part}.zip'
    prefix = f'A3-{part}/'
    with zipfile.ZipFile(dest, 'w', zipfile.ZIP_DEFLATED) as archive:
        for rel in files:
            archive.write(root / rel, rel[len(prefix):])
    with zipfile.ZipFile(dest) as archive:
        assert archive.testzip() is None
        for rel in files:
            assert archive.read(rel[len(prefix):]) == (root / rel).read_bytes(), rel
        if part == 'api':
            assert 'db-config.example.js' in archive.namelist()
            assert 'charityevents_db.sql' in archive.namelist()
            assert 'charityevents_db_cpanel.sql' in archive.namelist()
        else:
            assert 'src/main.ts' in archive.namelist()
            assert 'package-lock.json' in archive.namelist()
    print(dest.name, len(files), 'verified source files')

shutil.copy2(report, out / report.name)
shutil.copy2(root / 'A3-api/charityevents_db_cpanel.sql', out / f'{args.student_id}A3-database.sql')
site = f'https://{args.student_id}.it.scu.edu.au'
(out / '提交链接.txt').write_text(
    f'GitHub（小组共用）：https://github.com/lbyyy139/PROG2002-A3-Charity-Events\n'
    f'源码提交版本：{revision}\n'
    f'客户端：{site}/\n管理端：{site}/admin/\nAPI：{site}/api/events\n'
    '视频链接由本人另行提供，本次未整理视频或互评表。\n', encoding='utf-8-sig')
(out / '提交前必读.txt').write_text(
    f'PROG2002 A3 提交材料：Xiang Hu（{args.student_id}）\n\n'
    '1. 在 Blackboard 作业提交入口上传三个源代码 ZIP，以及个人项目报告。\n'
    '   Brief 写了“2 zip”但实际列出客户端、管理端、API 三种文件，因此这里准备三个 ZIP。\n'
    '2. API ZIP 已含完整数据库结构和数据。外面的 database.sql 是同一份 cPanel 版本，便于单独查看或上传。\n'
    '3. 把“提交链接.txt”中的共享 GitHub 链接填入提交说明；网站地址可一并提供。\n'
    '4. 视频与互评表按你的要求未整理，仍需你自己按课程要求完成。\n'
    '5. ZIP 文件名暂按项目现有习惯使用学号前缀。若老师要求 username 使用 xhu21，\n'
    '   将三个文件的 24832203 前缀改为 xhu21 即可，内容无需改变。\n\n'
    '报告检查：正文、表格和 9 张既有截图已保留。当前缺少排版渲染组件，\n'
    '提交前请在 Word 中检查分页、表格、截图，并确认个人贡献描述准确。\n'
    '报告里的截图来自先前开发版本；金额标签和最新管理搜索排序等以当前源码为准。\n\n'
    '版本检查：此文件夹对应链接文件中的提交版本。GitHub 更新不会自动部署 cPanel；\n'
    '后续若美化或修改代码，需要重新构建、部署并重新生成这三个 ZIP。\n'
    '两个账户都应部署最终版本并完成实际报名、更新和删除保护验证。\n'
    '本次自动化测试使用数据库替身，不代表已完成所有线上数据库写入验收。\n\n'
    '仓库：小组共用一个仓库即可，各自保留真实提交。仓库所有者还需将公开仓库改为私有，\n'
    '并保证队友和评分者可以访问；本次没有变更仓库可见性。\n\n'
    '文件安全：未包含真实 db-config.js、依赖目录、Git 历史、浏览器缓存或本地 Node 工具。\n'
    'SQL 含建表及初始化操作，会删除并重建应用表，仅用于空数据库或已有备份的环境。\n'
    'checksums.sha256 仅供核对文件完整性，不属于必须上传的作业文件。\n', encoding='utf-8-sig')

checksums = []
for p in sorted(out.iterdir()):
    checksums.append(f'{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.name}')
(out / 'checksums.sha256').write_text('\n'.join(checksums) + '\n', encoding='utf-8')
print('Submission folder:',out)
print('Source revision:',revision)
