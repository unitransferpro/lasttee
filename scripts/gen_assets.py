#!/usr/bin/env python3
# 라스트티 앱 아이콘 + 스플래시 소스 생성 (@capacitor/assets 입력용)
# python3 scripts/gen_assets.py
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets")
os.makedirs(OUT, exist_ok=True)

LIME = (214, 249, 75, 255)      # #D6F94B
PINE = (11, 59, 39, 255)        # #0B3B27
DEEP = (7, 36, 24, 255)         # #072418
WHITE = (255, 255, 255, 255)

def draw_flag(d, S, box, cx, cy, pole=PINE, ball=WHITE, ball_edge=PINE):
    """골프 깃발+공 글리프. box=글리프 전체 폭(px), (cx,cy)=중심."""
    u = box / 120.0
    X = lambda v: cx + (v - 60) * u
    Y = lambda v: cy + (v - 58) * u
    w = max(2, int(6 * u))
    # 그림자
    d.ellipse([X(40), Y(92), X(76), Y(100)], fill=(11, 59, 39, 45))
    # 깃대
    d.line([(X(52), Y(30)), (X(52), Y(90))], fill=pole, width=w)
    d.ellipse([X(52) - w/2, Y(30) - w/2, X(52) + w/2, Y(30) + w/2], fill=pole)
    # 깃발
    d.polygon([(X(55), Y(30)), (X(90), Y(41)), (X(55), Y(53))], fill=pole)
    # 공
    r = 8 * u
    bx, by = X(76), Y(87)
    d.ellipse([bx - r, by - r, bx + r, by + r], fill=ball, outline=ball_edge, width=max(2, int(3 * u)))

def rounded(size, radius, color):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=color)
    return img

# 1) icon-only (1024): 라임 라운드 배경 + 파인 깃발
icon = rounded(1024, 224, LIME)
draw_flag(ImageDraw.Draw(icon), 1024, 560, 512, 520, pole=PINE, ball=WHITE)
icon.save(os.path.join(OUT, "icon-only.png"))

# 2) icon-background (1024): 라임 단색
Image.new("RGBA", (1024, 1024), LIME).save(os.path.join(OUT, "icon-background.png"))

# 3) icon-foreground (1024): 투명 + 파인 깃발(어댑티브 세이프존 66%)
fg = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
draw_flag(ImageDraw.Draw(fg), 1024, 430, 512, 512, pole=PINE, ball=WHITE)
fg.save(os.path.join(OUT, "icon-foreground.png"))

# 4) splash (2732): 딥그린 배경 + 라임 디스크 + 파인 깃발 (앱 스플래시와 동일 톤)
def make_splash(bg):
    img = Image.new("RGBA", (2732, 2732), bg)
    d = ImageDraw.Draw(img)
    disc = 620
    cx = cy = 1366
    d.ellipse([cx - disc/2, cy - disc/2, cx + disc/2, cy + disc/2], fill=LIME)
    draw_flag(d, 2732, 340, cx, cy + 10, pole=PINE, ball=WHITE)
    return img

make_splash(DEEP).save(os.path.join(OUT, "splash.png"))
make_splash(DEEP).save(os.path.join(OUT, "splash-dark.png"))

print("assets 생성:", ", ".join(sorted(os.listdir(OUT))))
