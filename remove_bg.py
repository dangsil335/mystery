# illust/raw/*.png 의 배경을 제거해 illust/<name>.png 로 저장 (애니 전용 isnet-anime, 원본 해상도 유지)
# 사용: python remove_bg.py
import os, io, glob
from PIL import Image
from rembg import remove, new_session

BASE = os.path.dirname(os.path.abspath(__file__))
RAW  = os.path.join(BASE, "illust", "raw")
OUT  = os.path.join(BASE, "illust")

sess = new_session("isnet-anime")   # 애니 캐릭터 컷아웃에 최적
files = [f for f in glob.glob(os.path.join(RAW, "*.png")) if not os.path.basename(f).startswith("_")]
if not files:
    print("illust/raw/ 에 처리할 PNG가 없습니다.")
for f in files:
    name = os.path.basename(f)
    with open(f, "rb") as fp:
        out = remove(fp.read(), session=sess, post_process_mask=True)
    img = Image.open(io.BytesIO(out)).convert("RGBA")
    # 투명 여백을 잘라 캐릭터를 꽉 채움(선택)
    bbox = img.getchannel("A").getbbox()
    if bbox:
        img = img.crop(bbox)
    dst = os.path.join(OUT, name)
    img.save(dst)
    print(f"OK  {name}  {img.size}  -> illust/{name}")
print("done")
