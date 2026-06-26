# 무드 변형들의 머리 꼭대기 Y / 머리 폭 / 가로중심 편차 측정 (정렬 전략 결정용)
import io, os, sys, numpy as np, cv2
from PIL import Image
from rembg import remove, new_session

BASE = "C:/Users/solid/mystery-game"; RAW = os.path.join(BASE, "illust", "raw")
sess = new_session(os.environ.get("RBG_MODEL", "birefnet-general"))

def inpaint_wm(img):  # 우하단/좌상단 워터마크(스파클) 제거
    H, W = img.shape[:2]; mask = np.zeros((H, W), np.uint8)
    x0, y0 = int(0.80 * W), int(0.86 * H)
    roi = cv2.cvtColor(img[y0:H, x0:W], cv2.COLOR_BGR2GRAY)
    _, th = cv2.threshold(roi, 170, 255, cv2.THRESH_BINARY); mask[y0:H, x0:W] = th
    mask = cv2.dilate(mask, np.ones((5, 5), np.uint8), 2)
    return cv2.inpaint(img, mask, 7, cv2.INPAINT_TELEA)

def metrics(name):
    img = cv2.imread(os.path.join(RAW, name + ".png"))
    img = inpaint_wm(img)
    ok, buf = cv2.imencode(".png", img)
    out = remove(buf.tobytes(), session=sess, post_process_mask=True)
    im = Image.open(io.BytesIO(out)).convert("RGBA")
    a = np.array(im)[:, :, 3]
    ys, xs = np.where(a > 30)
    t, b, l, r = int(ys.min()), int(ys.max()), int(xs.min()), int(xs.max())
    Hb = b - t
    band = a[t:t + int(0.16 * Hb), :] > 30          # 상단 16% = 머리 추정 밴드
    cols = np.where(band.any(axis=0))[0]
    head_w = int(cols.max() - cols.min()); head_cx = int((cols.min() + cols.max()) / 2)
    return im.size, (l, t, r, b), Hb, head_w, head_cx

names = sys.argv[1:] or ["lily", "lily_calm", "lily_sad", "lily_surprise"]
print(f"{'name':16} {'imgW':>5} {'imgH':>5} {'bboxH':>6} {'headTopY':>8} {'headW':>6} {'headCX':>6}")
for n in names:
    size, bbox, Hb, hw, hcx = metrics(n)
    print(f"{n:16} {size[0]:>5} {size[1]:>5} {Hb:>6} {bbox[1]:>8} {hw:>6} {hcx:>6}")
