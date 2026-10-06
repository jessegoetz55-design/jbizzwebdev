#!/usr/bin/env python3
"""Batch 3: website upgrade kit for jbizzwebdev.com (same slots, branded assets)."""
from PIL import Image, ImageDraw, ImageFont
import os, random

A = os.path.dirname(os.path.abspath(__file__))
NAVY, GOLD, DARK, WHITE, GREY = (20,47,77), (164,142,94), (10,26,45), (248,249,250), (196,195,191)
random.seed(7)

def font(sz, bold=True):
    for p in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]:
        if os.path.exists(p): return ImageFont.truetype(p, sz)
    return ImageFont.load_default()

def vgrad(w, h, c1, c2):
    img = Image.new("RGB", (w, h), c1)
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / h
        d.line([(0,y),(w,y)], fill=tuple(int(c1[i]+(c2[i]-c1[i])*t) for i in range(3)))
    return img

def circuits(d, w, h, color, n=14, alpha=60):
    for _ in range(n):
        x, y = random.randint(0,w), random.randint(0,h)
        pts = [(x,y)]
        for _ in range(4):
            if random.random() < .5: x += random.randint(-160,160)
            else: y += random.randint(-120,120)
            pts.append((x,y))
        d.line(pts, fill=color+(alpha,), width=2)
        d.ellipse([pts[-1][0]-5, pts[-1][1]-5, pts[-1][0]+5, pts[-1][1]+5], outline=color+(alpha,), width=2)

def motif_leadgen(w, h):
    img = vgrad(w, h, DARK, NAVY).convert("RGBA")
    d = ImageDraw.Draw(img, "RGBA")
    circuits(d, w, h, GOLD, 10, 40)
    pts = [(120, h-140)]
    x = 120
    for dx, dy in [(180,-90),(170,-40),(180,-120),(170,-60),(150,-110)]:
        x += dx; pts.append((x, pts[-1][1]+dy))
    d.line(pts, fill=GOLD+(255,), width=10, joint="curve")
    for p in pts[1:]:
        d.ellipse([p[0]-16,p[1]-16,p[0]+16,p[1]+16], fill=GOLD+(255,))
        d.ellipse([p[0]-7,p[1]-7,p[0]+7,p[1]+7], fill=DARK+(255,))
    # arrow head
    ex, ey = pts[-1]
    d.polygon([(ex,ey),(ex-46,ey+6),(ex-12,ey+44)], fill=GOLD+(255,))
    return img.convert("RGB")

def motif_aichat(w, h):
    img = vgrad(w, h, DARK, NAVY).convert("RGBA")
    d = ImageDraw.Draw(img, "RGBA")
    circuits(d, w, h, GOLD, 10, 40)
    # big bubble
    d.rounded_rectangle([w//2-330, 150, w//2+330, 430], radius=60, fill=(255,255,255,255))
    d.polygon([(w//2-220,425),(w//2-260,500),(w//2-140,425)], fill=(255,255,255,255))
    for i, x in enumerate([w//2-90, w//2, w//2+90]):
        d.ellipse([x-28, 265, x+28, 321], fill=NAVY+(255,))
    # small reply bubble
    d.rounded_rectangle([w//2-40, 560, w//2+380, 680], radius=40, fill=GOLD+(255,))
    d.polygon([(w//2+220,680),(w//2+260,745),(w//2+300,680)], fill=GOLD+(255,))
    d.text((w//2+170, 600), "24 / 7", font=font(56), fill=DARK+(255,), anchor="mm")
    return img.convert("RGB")

def motif_portfolio(w, h):
    img = vgrad(w, h, DARK, NAVY).convert("RGBA")
    d = ImageDraw.Draw(img, "RGBA")
    circuits(d, w, h, GOLD, 10, 40)
    x0, y0, x1, y1 = w//2-380, 170, w//2+380, 640
    d.rounded_rectangle([x0,y0,x1,y1], radius=28, fill=(255,255,255,255))
    d.rounded_rectangle([x0,y0,x1,y0+90], radius=28, fill=GREY+(255,))
    d.rectangle([x0, y0+60, x1, y0+90], fill=GREY+(255,))
    for i, c in enumerate([(220,80,80),(230,180,60),(90,200,120)]):
        d.ellipse([x0+34+i*44, y0+28, x0+62+i*44, y0+56], fill=c+(255,))
    d.rounded_rectangle([x0+180, y0+24, x1-40, y0+66], radius=20, fill=(255,255,255,255))
    # content lines
    for i, (ww, col) in enumerate([(520, NAVY),(440, GOLD),(480, NAVY),(300, GREY)]):
        yy = y0+150+i*90
        d.rounded_rectangle([x0+60, yy, x0+60+ww, yy+34], radius=17, fill=col+(255,))
    return img.convert("RGB")

def badge():
    s = 600
    img = Image.new("RGBA", (s,s), (0,0,0,0))
    d = ImageDraw.Draw(img)
    d.ellipse([20,20,s-20,s-20], outline=GOLD+(255,), width=14)
    d.ellipse([54,54,s-54,s-54], outline=GOLD+(200,), width=4)
    d.ellipse([70,70,s-70,s-70], fill=NAVY+(255,))
    d.text((s//2, s//2-52), "7-DAY", font=font(96), fill=(255,255,255,255), anchor="mm")
    d.text((s//2, s//2+52), "GUARANTEE", font=font(52), fill=GOLD+(255,), anchor="mm")
    return img

def store_hero():
    w, h = 1920, 600
    img = vgrad(w, h, DARK, NAVY).convert("RGBA")
    d = ImageDraw.Draw(img, "RGBA")
    circuits(d, w, h, GOLD, 16, 50)
    icon = Image.open(os.path.join(A, "jbizz-logo-new.png")).convert("RGBA")
    icon.thumbnail((300,300))
    img.alpha_composite(icon, (120, (h-icon.height)//2))
    d.text((480, h//2-70), "JBIZZ STORE", font=font(110), fill=(255,255,255,255))
    d.text((484, h//2+60), "Tools we build. Tools we sell.", font=font(48), fill=GOLD+(255,))
    return img.convert("RGB")

# 1. new logo into Assets
from shutil import copyfile
copyfile("/home/hatch/workspace/jbizz-hq/Brand/logo-pack/00-master-transparent.png",
         os.path.join(A, "jbizz-logo-new.png"))
# 2. favicon
icon = Image.open(os.path.join(A, "jbizz-logo-new.png"))
icon.save(os.path.join(A, "favicon-32x32.png"))
# 3. service images (16:10)
motif_leadgen(1248, 780).save(os.path.join(A, "service-leadgen.jpg"), quality=88)
motif_aichat(1248, 780).save(os.path.join(A, "service-aichat.jpg"), quality=88)
motif_portfolio(1248, 780).save(os.path.join(A, "service-portfolio.jpg"), quality=88)
# 4. badge + store hero
badge().save(os.path.join(A, "badge-guarantee.png"))
store_hero().save(os.path.join(A, "store-hero-1920x600.jpg"), quality=88)
print("website kit built")
