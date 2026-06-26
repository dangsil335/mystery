# 인물별 무드 변형을 공통 캔버스에 정렬: 머리폭으로 크기 정규화 + 머리꼭대기Y·가로중심 일치
# → 무드 교체 시 얼굴이 위아래/좌우로 튀지 않음. raw/ → illust/ (베이스도 무드셋에 맞춰 재정렬)
import io, os, sys, numpy as np, cv2
from PIL import Image
from rembg import remove, new_session

BASE = "C:/Users/solid/mystery-game"; RAW = os.path.join(BASE, "illust", "raw"); OUT = os.path.join(BASE, "illust")
sess = new_session(os.environ.get("RBG_MODEL", "birefnet-general"))
WM_BASE = {"vivian", "claude", "harris", "miller"}   # 옛 베이스: 원본 서비스 워터마크(하단 바 + 좌상단)
CHARS = {
    "vivian": ["vivian", "vivian_sharp", "vivian_soft"],
    "lily":   ["lily", "lily_calm", "lily_sad", "lily_surprise"],
    "claude": ["claude", "claude_despair", "claude_fear"],
    "miller": ["miller", "miller_sad", "miller_shock"],
    "emma":   ["emma", "emma_despair", "emma_fear"],
    "harris": ["harris", "harris_sad"],
}

def inpaint_wide(img):   # 옛 베이스 워터마크(하단 바 + 좌상단)
    H, W = img.shape[:2]; mask = np.zeros((H, W), np.uint8)
    x0, y0 = int(0.56 * W), int(0.92 * H)
    roi = cv2.cvtColor(img[y0:H, x0:W], cv2.COLOR_BGR2GRAY)
    _, th = cv2.threshold(roi, 160, 255, cv2.THRESH_BINARY); mask[y0:H, x0:W] = th
    mask[0:int(0.06 * H), 0:int(0.10 * W)] = 255
    mask = cv2.dilate(mask, np.ones((5, 5), np.uint8), 2)
    return cv2.inpaint(img, mask, 7, cv2.INPAINT_TELEA)

def inpaint_corner(img):  # 새 이미지 우하단 ✦ 스파클
    H, W = img.shape[:2]; mask = np.zeros((H, W), np.uint8)
    x0, y0 = int(0.80 * W), int(0.86 * H)
    roi = cv2.cvtColor(img[y0:H, x0:W], cv2.COLOR_BGR2GRAY)
    _, th = cv2.threshold(roi, 170, 255, cv2.THRESH_BINARY); mask[y0:H, x0:W] = th
    mask = cv2.dilate(mask, np.ones((5, 5), np.uint8), 2)
    return cv2.inpaint(img, mask, 7, cv2.INPAINT_TELEA)

def load_rgba(name):
    img = cv2.imread(os.path.join(RAW, name + ".png"))
    if "_" in name:        img = inpaint_corner(img)
    elif name in WM_BASE:  img = inpaint_wide(img)
    ok, buf = cv2.imencode(".png", img)
    out = remove(buf.tobytes(), session=sess, post_process_mask=True)
    im = Image.open(io.BytesIO(out)).convert("RGBA")
    arr = np.array(im); am = (arr[:, :, 3] > 10).astype(np.uint8) * 255
    am = cv2.erode(am, np.ones((3, 3), np.uint8), 1)
    arr[:, :, 3] = np.minimum(arr[:, :, 3], am)
    return Image.fromarray(arr)

def head_metrics(im):
    a = np.array(im)[:, :, 3]
    ys, xs = np.where(a > 30); t, b = int(ys.min()), int(ys.max())
    Hb = b - t
    band = a[t:t + int(0.16 * Hb), :] > 30          # 상단 16% = 머리 추정 밴드
    cols = np.where(band.any(axis=0))[0]
    hw = int(cols.max() - cols.min()); hcx = float((cols.min() + cols.max()) / 2)
    return dict(t=t, b=b, hw=hw, hcx=hcx)

def align_char(char, variants):
    data = []
    for n in variants:
        im = load_rgba(n); m = head_metrics(im); data.append((n, im, m))
    ref_hw = float(np.median([m["hw"] for _, _, m in data]))   # 머리폭 기준(=무드셋 다수값)
    scaled = []
    for n, im, m in data:
        s = ref_hw / m["hw"]
        sim = im.resize((max(1, int(round(im.width * s))), max(1, int(round(im.height * s)))), Image.LANCZOS)
        scaled.append((n, sim, m["t"] * s, m["b"] * s, m["hcx"] * s))
    PAD_TOP = int(ref_hw * 0.12); PAD_BOT = int(ref_hw * 0.05); PAD_SIDE = int(ref_hw * 0.28)
    bodyH = max(sb - st for _, _, st, sb, _ in scaled)
    H = PAD_TOP + int(round(bodyH)) + PAD_BOT
    CX = max(shcx for _, _, _, _, shcx in scaled) + PAD_SIDE
    Wright = max(sim.width - shcx for _, sim, _, _, shcx in scaled)
    W = int(round(CX + Wright + PAD_SIDE))
    CX = int(round(CX))
    outs = []
    for n, sim, st, sb, shcx in scaled:
        canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        xo = int(round(CX - shcx)); yo = int(round(PAD_TOP - st))
        canvas.alpha_composite(sim, (xo, yo))
        canvas.save(os.path.join(OUT, n + ".png"))
        outs.append((n, canvas))
        print(f"  {n:16} -> {W}x{H}  scale={ref_hw/head_metrics(sim)['hw']:.3f}")
    # 콘택트시트(검증용): 머리꼭대기/눈높이 가이드선
    th = 360; sheet_w = th * len(outs) + 10 * (len(outs) + 1); sheet_h = int(th * H / W) + 20
    sheet = Image.new("RGBA", (sheet_w, sheet_h), (40, 34, 30, 255))
    for i, (n, cv_) in enumerate(outs):
        thumb = cv_.resize((th, int(th * H / W)), Image.LANCZOS)
        sheet.alpha_composite(thumb, (10 + i * (th + 10), 10))
    d = np.array(sheet)
    yline = 10 + int((PAD_TOP / H) * (th * H / W))            # 머리꼭대기 가이드
    d[yline:yline + 2, :, :3] = [230, 90, 80]
    Image.fromarray(d).convert("RGB").save(os.path.join(BASE, f"_align_check_{char}.png"))
    return W, H

targets = sys.argv[1:] or list(CHARS.keys())
for ch in targets:
    print(f"[{ch}]"); align_char(ch, CHARS[ch])
print("ALL DONE")
