# BiRefNet 고품질 매트 + 워터마크 인페인팅 (alpha_matting 없이 — 균일 배경에서 트라이맵 깨짐)
import cv2, numpy as np, io, os, sys
from PIL import Image
from rembg import remove, new_session

BASE="C:/Users/solid/mystery-game"; RAW=os.path.join(BASE,"illust","raw"); OUT=os.path.join(BASE,"illust")
WM={"vivian","claude","harris","miller"}
MODEL=os.environ.get("RBG_MODEL","birefnet-general")
names=sys.argv[1:] or ["vivian","lily","harris","claude","miller","emma"]
sess=new_session(MODEL)

def inpaint_wm(img):
    H,W=img.shape[:2]; mask=np.zeros((H,W),np.uint8)
    x0,y0=int(0.56*W),int(0.92*H)
    roi=cv2.cvtColor(img[y0:H,x0:W],cv2.COLOR_BGR2GRAY)
    _,th=cv2.threshold(roi,160,255,cv2.THRESH_BINARY); mask[y0:H,x0:W]=th
    mask[0:int(0.06*H),0:int(0.10*W)]=255
    mask=cv2.dilate(mask,np.ones((5,5),np.uint8),2)
    return cv2.inpaint(img,mask,7,cv2.INPAINT_TELEA)

for name in names:
    img=cv2.imread(os.path.join(RAW,name+".png"))
    if name in WM: img=inpaint_wm(img)
    ok,buf=cv2.imencode(".png",img)
    out=remove(buf.tobytes(), session=sess, post_process_mask=True)
    im=Image.open(io.BytesIO(out)).convert("RGBA")
    # 가장자리 1px 침식으로 잔여 색 프린지만 살짝 정리
    arr=np.array(im); am=(arr[:,:,3]>10).astype(np.uint8)*255
    am=cv2.erode(am,np.ones((3,3),np.uint8),1)
    arr[:,:,3]=np.minimum(arr[:,:,3],am); im=Image.fromarray(arr)
    bbox=im.getchannel("A").getbbox()
    if bbox: im=im.crop(bbox)
    im.save(os.path.join(OUT,name+".png"))
    print("OK",name,im.size)
print("done",MODEL)
