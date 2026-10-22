import os
from PIL import Image, ImageDraw

def create_squircle_mask(size, radius):
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), (size[0] - 1, size[1] - 1)], radius=radius, fill=255)
    return mask

def make_labex_icon(output_path):
    size = (512, 512)
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    
    # 1. Base Squircle with gradient
    bg = Image.new("RGBA", size, (0, 0, 0, 0))
    draw_bg = ImageDraw.Draw(bg)
    
    # Draw dark futuristic rounded background
    for y in range(512):
        r = int(11 + (30 - 11) * (y / 512.0))
        g = int(15 + (27 - 15) * (y / 512.0))
        b = int(25 + (75 - 25) * (y / 512.0))
        draw_bg.line([(0, y), (512, y)], fill=(r, g, b, 255))
        
    mask = create_squircle_mask(size, 110)
    bg.putalpha(mask)
    img.alpha_composite(bg)
    
    # Draw glossy border / glow
    draw = ImageDraw.Draw(img)
    # Border
    draw.rounded_rectangle([(10, 10), (501, 501)], radius=105, outline=(99, 102, 241, 140), width=6)
    draw.rounded_rectangle([(16, 16), (495, 495)], radius=100, outline=(168, 85, 247, 80), width=3)
    
    # Draw terminal prompt ">"
    # Points for >: (120, 160) -> (240, 256) -> (120, 352)
    pts1 = [
        (130, 150), (160, 150), (280, 256), (160, 362), (130, 362), (240, 256)
    ]
    # Draw with gradient or bright violet/cyan
    draw.polygon(pts1, fill=(99, 102, 241, 255)) # Indigo-500
    
    # Inner bright core for >
    pts1_core = [
        (145, 175), (165, 175), (255, 256), (165, 337), (145, 337), (230, 256)
    ]
    draw.polygon(pts1_core, fill=(56, 189, 248, 255)) # Cyan-400
    
    # Draw cursor "_"
    # Box from x=300 to 410, y=320 to 362
    draw.rounded_rectangle([(290, 330), (410, 362)], radius=8, fill=(244, 63, 94, 255)) # Rose-500
    draw.rounded_rectangle([(295, 335), (405, 357)], radius=5, fill=(251, 113, 133, 255)) # Rose-400
    
    # Draw small studio dot accent at top right
    draw.ellipse([(410, 80), (440, 110)], fill=(168, 85, 247, 230))
    draw.ellipse([(418, 88), (432, 102)], fill=(236, 72, 153, 255))
    
    # Save as multi-resolution ICO
    icon_sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
    img.save(output_path, format="ICO", sizes=icon_sizes)
    print(f"Created LabEx icon at {output_path}")

def make_openquiz_icon(src_logo, output_path):
    size = (512, 512)
    # Open source logo
    logo = Image.open(src_logo).convert("RGBA")
    logo = logo.resize(size, Image.Resampling.LANCZOS)
    
    # Create modern squircle mask
    mask = create_squircle_mask(size, 110)
    
    # Composite over squircle with outer border
    icon_img = Image.new("RGBA", size, (0, 0, 0, 0))
    logo.putalpha(mask)
    icon_img.alpha_composite(logo)
    
    draw = ImageDraw.Draw(icon_img)
    # Outer subtle rounded frame
    draw.rounded_rectangle([(10, 10), (501, 501)], radius=105, outline=(59, 130, 246, 160), width=6)
    draw.rounded_rectangle([(16, 16), (495, 495)], radius=100, outline=(147, 197, 253, 90), width=3)
    
    icon_sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
    icon_img.save(output_path, format="ICO", sizes=icon_sizes)
    print(f"Created OpenQuiz icon at {output_path}")

if __name__ == "__main__":
    labex_ico = os.path.abspath("d:/Project/LabEx/client/public/labex.ico")
    openquiz_src = "d:/Project/openquiz/public/logo.png"
    openquiz_ico = os.path.abspath("d:/Project/openquiz/public/openquiz.ico")
    
    make_labex_icon(labex_ico)
    if os.path.exists(openquiz_src):
        make_openquiz_icon(openquiz_src, openquiz_ico)
    else:
        print("Openquiz logo not found")
