# -*- coding: utf-8 -*-
"""
Icon Processing Script for Stay Close App
Resizes icons to all required Android dimensions
"""

from PIL import Image
import os

# Source images
SOURCE_ICON = "Iamge 1.png"
SOURCE_FEATURE = "image 2.png"

# Android icon sizes (in pixels)
ICON_SIZES = {
    "mdpi": 48,
    "hdpi": 72,
    "xhdpi": 96,
    "xxhdpi": 144,
    "xxxhdpi": 192
}

# Foreground icon sizes (for adaptive icons)
FOREGROUND_SIZES = {
    "mdpi": 108,
    "hdpi": 162,
    "xhdpi": 216,
    "xxhdpi": 324,
    "xxxhdpi": 432
}

def resize_icon(source_path, output_path, size):
    """Resize an icon to the specified size"""
    try:
        img = Image.open(source_path)
        img_resized = img.resize((size, size), Image.Resampling.LANCZOS)
        img_resized.save(output_path, "PNG")
        print("[OK] Created: {} ({}x{})".format(output_path, size, size))
        return True
    except Exception as e:
        print("[ERROR] Error creating {}: {}".format(output_path, e))
        return False

def main():
    print("Stay Close Icon Processing")
    print("=" * 50)

    # Check if source image exists
    if not os.path.exists(SOURCE_ICON):
        print("[ERROR] Source icon not found: {}".format(SOURCE_ICON))
        return

    # Get source image info
    source_img = Image.open(SOURCE_ICON)
    print("Source icon: {}x{}".format(source_img.size[0], source_img.size[1]))

    # Create store assets folder
    store_assets_dir = "../store-assets"
    os.makedirs(store_assets_dir, exist_ok=True)
    print("Created folder: {}".format(store_assets_dir))

    # 1. Create 512x512 for Play Store
    print("\n[1] Creating Play Store icon (512x512)...")
    resize_icon(SOURCE_ICON, "{}/icon-512x512.png".format(store_assets_dir), 512)

    # 2. Create all Android mipmap sizes
    print("\n[2] Creating Android launcher icons...")
    base_path = "app/src/main/res"

    for density, size in ICON_SIZES.items():
        mipmap_dir = "{}/mipmap-{}".format(base_path, density)
        os.makedirs(mipmap_dir, exist_ok=True)

        # Regular icon
        resize_icon(SOURCE_ICON, "{}/ic_launcher.png".format(mipmap_dir), size)

        # Round icon
        resize_icon(SOURCE_ICON, "{}/ic_launcher_round.png".format(mipmap_dir), size)

    # 3. Create foreground icons (for adaptive icons)
    print("\n[3] Creating foreground icons...")
    for density, size in FOREGROUND_SIZES.items():
        mipmap_dir = "{}/mipmap-{}".format(base_path, density)
        resize_icon(SOURCE_ICON, "{}/ic_launcher_foreground.png".format(mipmap_dir), size)

    # 4. Prepare feature graphic
    print("\n[4] Preparing feature graphic...")
    if os.path.exists(SOURCE_FEATURE):
        feature_img = Image.open(SOURCE_FEATURE)
        print("Feature graphic: {}x{}".format(feature_img.size[0], feature_img.size[1]))

        # Resize to 1024x500 if needed
        if feature_img.size != (1024, 500):
            feature_resized = feature_img.resize((1024, 500), Image.Resampling.LANCZOS)
            feature_resized.save("{}/feature-graphic-1024x500.png".format(store_assets_dir), "PNG")
            print("[OK] Resized feature graphic to 1024x500")
        else:
            feature_img.save("{}/feature-graphic-1024x500.png".format(store_assets_dir), "PNG")
            print("[OK] Feature graphic already correct size")

    print("\n" + "=" * 50)
    print("Icon processing complete!")
    print("Store assets saved to: {}/".format(store_assets_dir))
    print("Android icons updated in: {}/mipmap-*/".format(base_path))

if __name__ == "__main__":
    main()
