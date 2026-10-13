"""Нарезает большое изображение полигона на пирамиду тайлов для Leaflet.
Использование: python make_tiles.py полигон.png tiles [--skip-top] [--tile=512]
--skip-top — не сохранять самый крупный уровень (если исходник растянутый и мыльный).
Нужен Pillow (pip install pillow)."""
import sys, os, json, math
from multiprocessing import Pool
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
T = int(next((a.split("=")[1] for a in sys.argv if a.startswith("--tile=")), 512))
SRC, OUT = sys.argv[1], sys.argv[2]
SKIP_TOP = '--skip-top' in sys.argv
G = {}
def cut(args):
    z, tx, ty = args
    im = G['im']
    box = (tx*T, ty*T, min((tx+1)*T, im.width), min((ty+1)*T, im.height))
    t = im.crop(box)
    if t.getbbox() is None:          # полностью чёрный (пустой) тайл — не сохраняем
        return (tx, ty, 0)
    if t.size != (T, T):
        c = Image.new('RGB', (T, T)); c.paste(t, (0, 0)); t = c
    d = f'{OUT}/{z}/{tx}'; os.makedirs(d, exist_ok=True)
    t.save(f'{d}/{ty}.webp', 'WEBP', quality=72, method=4)
    return (tx, ty, 1)
if __name__ == '__main__':
    im = Image.open(SRC).convert('RGB')
    W, H = im.size
    maxz = math.ceil(math.log2(max(W, H) / T))
    index = {'width': W, 'height': H, 'tileSize': T, 'maxZoom': maxz,
             'nativeZoom': maxz - 1 if SKIP_TOP else maxz, 'levels': {}}
    cur = im
    for z in range(maxz, -1, -1):
        if z != maxz:
            cur = cur.resize((math.ceil(cur.width/2), math.ceil(cur.height/2)), Image.LANCZOS)
        G['im'] = cur
        if z > index['nativeZoom']:
            continue
        cols, rows = math.ceil(cur.width/T), math.ceil(cur.height/T)
        jobs = [(z, x, y) for y in range(rows) for x in range(cols)]
        with Pool(os.cpu_count()) as p:   # fork: дочерние процессы видят G['im']
            res = p.map(cut, jobs, chunksize=64)
        bits = ['0'] * (cols*rows)
        for tx, ty, ok in res:
            if ok: bits[ty*cols+tx] = '1'
        index['levels'][z] = {'cols': cols, 'rows': rows, 'mask': ''.join(bits)}
        print(f'z{z}: {cur.width}x{cur.height}, {cols}x{rows}, сохранено {bits.count("1")}', flush=True)
    with open(f'{OUT}/index.json', 'w') as f:
        json.dump(index, f, separators=(',', ':'))
