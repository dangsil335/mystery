# Dreamina 워터마크(우하단 로고 + 좌상단 AI배지) 인페인팅 후 배경 제거.
import cv2, numpy as np, io, os
from PIL import Image
from rembg import remove, new_session

BASE="C:/Users/solid/mystery-game"
RAW=os.path.join(BASE,"illust","raw")
OUT=os.path.join(BASE,"illust")
TARGETS=["vivian","claude","harris","miller"]   # 워터마크 있는 4장만

sess=new_session("isnet-anime")
for name in TARGETS:
    f=os.path.join(RAW,name+".png")
    img=cv2.imread(f)                      # BGR
    H,W=img.shape[:2]
    mask=np.zeros((H,W),np.uint8)
    # 1) 우하단 로고: 코너 ROI 안에서 밝은 텍스트만 마스킹
    x0,y0=int(0.56*W),int(0.92*H)
    roi=cv2.cvtColor(img[y0:H,x0:W],cv2.COLOR_BGR2GRAY)
    _,th=cv2.threshold(roi,160,255,cv2.THRESH_BINARY)
    mask[y0:H,x0:W]=th
    # 2) 좌상단 AI배지: 작은 코너 박스 통째로
    mask[0:int(0.06*H),0:int(0.10*W)]=255
    mask=cv2.dilate(mask,np.ones((5,5),np.uint8),iterations=2)
    clean=cv2.inpaint(img,mask,7,cv2.INPAINT_TELEA)
    # 3) 배경 제거 + 크롭
    ok,buf=cv2.imencode(".png",clean)
    out=remove(buf.tobytes(),session=sess,post_process_mask=True)
    im=Image.open(io.BytesIO(out)).convert("RGBA")
    bbox=im.getchannel("A").getbbox()
    if bbox: im=im.crop(bbox)
    im.save(os.path.join(OUT,name+".png"))
    print("OK",name,im.size)
print("done")
