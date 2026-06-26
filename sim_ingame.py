# 인게임 .dlg-img 렌더 시뮬: 3:4 박스 + contain + bottom-center. 새 정렬 이미지가 어떻게 보이는지 확인.
import numpy as np
from PIL import Image

BOX_W, BOX_H = 460, 614   # 3:4
PAIRS = [("vivian","vivian_sharp"),("lily","lily_surprise"),("claude","claude_fear"),
         ("miller","miller_shock"),("emma","emma_fear"),("harris","harris_sad")]

def contain_bottom(im, bw, bh):
    s = min(bw / im.width, bh / im.height)           # contain
    nw, nh = max(1,int(im.width*s)), max(1,int(im.height*s))
    r = im.resize((nw, nh), Image.LANCZOS)
    box = Image.new("RGBA", (bw, bh), (0,0,0,0))
    box.alpha_composite(r, ((bw-nw)//2, bh-nh))      # bottom center
    return box

cols = []
for base, mood in PAIRS:
    cell = Image.new("RGBA", (BOX_W*2+6, BOX_H), (24,20,17,255))
    for j,n in enumerate((base, mood)):
        im = Image.open(f"illust/{n}.png").convert("RGBA")
        b = contain_bottom(im, BOX_W, BOX_H)
        # 박스 경계선
        d = np.array(b); d[0:2,:, :3]=[90,76,60]; d[-2:,:, :3]=[90,76,60]; d[:,0:2,:3]=[90,76,60]; d[:,-2:,:3]=[90,76,60]
        cell.alpha_composite(Image.fromarray(d), (j*(BOX_W+6),0))
    cols.append(cell)
sheet = Image.new("RGBA",(cols[0].width*len(cols)+8*(len(cols)+1), BOX_H+16),(12,10,9,255))
for i,c in enumerate(cols): sheet.alpha_composite(c,(8+i*(c.width+8),8))
sheet.convert("RGB").save("_sim_ingame.png")
print("saved _sim_ingame.png", sheet.size)
