#!/usr/bin/env python3
"""Bundle Shiba Days into a single self-contained HTML file: shiba-days.html"""
import re, pathlib
root = pathlib.Path(__file__).parent
html = (root / 'index.html').read_text(encoding='utf-8')
def inline(m):
    src = m.group(1)
    code = (root / src).read_text(encoding='utf-8')
    code = code.replace('</script', '<\\/script')
    return '<script>/* ' + src + ' */\n' + code + '\n</script>'
out = re.sub(r'<script src="([^"]+)"></script>', inline, html)
(root / 'shiba-days.html').write_text(out, encoding='utf-8')
print('wrote shiba-days.html', round(len(out.encode('utf-8')) / 1024), 'KB')
