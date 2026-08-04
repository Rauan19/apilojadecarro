from collections import deque
from pathlib import Path
from PIL import Image

src = Path(
    r"C:\Users\pcdev\.cursor\projects\d-projetos-lojaveiculorauan-apilojadecarro\assets\c__Users_pcdev_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_4_de_ago._de_2026__19_04_38-Photoroom-b4bedaac-e6dd-41fe-b4a8-08c267aff641.png"
)
out = Path(r"D:\projetos\lojaveiculorauan\apilojadecarro\frontend\public\brand\estoqueauto-logo.png")
fav = Path(r"D:\projetos\lojaveiculorauan\apilojadecarro\frontend\public\favicon.png")

img = Image.open(src).convert("RGBA")
w, h = img.size
px = img.load()
print("mode", img.mode, "size", w, h)
for p in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
    print("corner", p, px[p])


def is_bg(c):
    r, g, b, a = c
    return a < 20 or (r <= 28 and g <= 28 and b <= 28)


visited = [[False] * h for _ in range(w)]
q: deque[tuple[int, int]] = deque()
for x in range(w):
    for y in (0, h - 1):
        if is_bg(px[x, y]):
            q.append((x, y))
for y in range(h):
    for x in (0, w - 1):
        if is_bg(px[x, y]):
            q.append((x, y))

while q:
    x, y = q.popleft()
    if x < 0 or y < 0 or x >= w or y >= h or visited[x][y]:
        continue
    if not is_bg(px[x, y]):
        continue
    visited[x][y] = True
    r, g, b, _ = px[x, y]
    px[x, y] = (r, g, b, 0)
    q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

for x in range(w):
    for y in range(h):
        r, g, b, a = px[x, y]
        if a == 0:
            continue
        if r <= 40 and g <= 40 and b <= 40:
            neigh = False
            for dx, dy in (
                (1, 0),
                (-1, 0),
                (0, 1),
                (0, -1),
                (1, 1),
                (-1, -1),
                (1, -1),
                (-1, 1),
            ):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] == 0:
                    neigh = True
                    break
            if neigh:
                lum = (r + g + b) / 3
                na = int(max(0, min(255, (lum / 40) * 255)))
                px[x, y] = (r, g, b, na)

img.save(out, "PNG")
img.save(fav, "PNG")
alphas = {px[x, y][3] for x in range(0, w, 6) for y in range(0, h, 6)}
print("has transparent", 0 in alphas, "alpha range", min(alphas), max(alphas))
print("saved", out, out.stat().st_size)
