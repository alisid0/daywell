"""
Daywell mascot animation builder.
Created 2026-10-05 17:08 BST (16:08 UTC) as part of the ChatGPT handover in this folder.

Turns a handful of key poses per companion into every mood animation, using the motion that was
approved in the Daywell Mascot Lab (each companion's signature movement, tempo and squash).

Run it in ChatGPT's Python tool, or anywhere with Python 3.10+ and Pillow 10+.

Input:  key poses as transparent PNGs, named <companion>-<pose>.png, anywhere under INPUT
        (for example /mnt/data/pip-happy.png). The original portrait counts as the "neutral" pose
        and can be named <companion>.png or <companion>-neutral.png.
Output: OUTPUT/<companion>/keyposes/*.png      aligned key poses, FRAME px, for the app
        OUTPUT/<companion>/<clip>.webp          animated preview (transparent)
        OUTPUT/<companion>/<clip>.gif           preview on white, for sharing
        OUTPUT/<companion>/<clip>-sheet.webp    sprite sheet, COLUMNS frames per row
        OUTPUT/<companion>/contact-sheet.png    all key poses side by side, for checking
        Optional hand-drawn action frames named <companion>-action-01.png, -02 ... become an "action" clip.
        OUTPUT/manifest.json                    clip list with frame counts and timing
        OUTPUT.zip                              everything above
"""
import glob
import json
import math
import os
import zipfile

from PIL import Image, ImageEnhance

INPUT = "/mnt/data"
OUTPUT = "/mnt/data/daywell-mascot-animations"
FRAME = 512      # square frame size in pixels
FPS = 12
COLUMNS = 8      # frames per row in the sprite sheets
K = FRAME / 380  # the Mascot Lab measured movement at 380 px; scale it to FRAME
PIVOT = (FRAME / 2, FRAME * 0.9)  # bottom centre, where the feet touch the ground
RESAMPLE = Image.Resampling

# Each companion's way of moving, exactly as approved in the Mascot Lab.
CHARACTERS = {
    "pip":    dict(tempo=2.8, amp=1.0, squash=0.035, sig="tilt",     react="double_hop"),
    "tock":   dict(tempo=2.0, amp=0.9, squash=0.020, sig="pendulum", react="two_ticks"),
    "momo":   dict(tempo=2.4, amp=1.0, squash=0.030, sig="shuffle",  react="pat_wiggle"),
    "luma":   dict(tempo=5.5, amp=1.1, squash=0.040, sig="float",    react="glow_swell"),
    "nori":   dict(tempo=3.4, amp=0.9, squash=0.035, sig="nod",      react="deep_nod"),
    "bounce": dict(tempo=1.5, amp=1.2, squash=0.050, sig="spring",   react="big_jump"),
    "sunny":  dict(tempo=4.2, amp=1.0, squash=0.030, sig="rise",     react="rise_glow"),
}

# Moods: how much the signature movement grows or shrinks, how fast it runs, the resting lean
# (degrees), lift (px, negative is up), size, and which key pose the face uses.
MOODS = {
    "idle":        dict(amp=1.0, tempo=1.0, lean=0,  lift=0,  size=1.00, pose="neutral", blink=True),
    "listening":   dict(amp=0.5, tempo=1.2, lean=5,  lift=0,  size=1.02, pose="neutral", blink=True),
    "thinking":    dict(amp=0.6, tempo=1.5, lean=-6, lift=-4, size=1.00, pose="think"),
    "speaking":    dict(amp=0.6, tempo=1.0, lean=2,  lift=0,  size=1.00, pose="talk", talk=True),
    "happy":       dict(amp=1.8, tempo=0.55, lean=0, lift=-3, size=1.03, pose="happy"),
    "encouraging": dict(amp=1.2, tempo=0.8, lean=4,  lift=0,  size=1.02, pose="happy"),
    "sleepy":      dict(amp=0.7, tempo=1.8, lean=7,  lift=6,  size=0.98, pose="sleepy"),
    "concerned":   dict(amp=0.4, tempo=1.6, lean=6,  lift=2,  size=0.97, pose="concern"),
}
OVERRIDES = {
    "tock":   {"happy": dict(tempo=0.5)},
    "luma":   {"happy": dict(amp=0.9, tempo=0.8), "speaking": dict(tempo=0.9), "encouraging": dict(amp=0.8, tempo=0.9),
               # Luma's portrait already has closed eyes, so she listens with the "awake" pose and never blinks.
               "idle": dict(blink=False), "listening": dict(pose="awake", blink=False)},
    "bounce": {"sleepy": dict(amp=0.4, tempo=1.6), "concerned": dict(amp=0.25), "thinking": dict(amp=0.35)},
}


def signature(sig, a):
    """Keyframes (t, x, y, rotation) for one loop of a signature movement. x and y in Lab px."""
    if sig == "tilt":
        return [(0, 0, 0, 0), (.18, 0, -a * .3, -a * 1.3), (.38, 0, -a * .3, -a * 1.3), (.5, 0, 0, 0), (.68, 0, -a * .2, a), (.86, 0, 0, a), (1, 0, 0, 0)]
    if sig == "pendulum":
        return [(0, 0, 0, -a), (.5, 0, 0, a), (1, 0, 0, -a)]
    if sig == "shuffle":
        return [(0, 0, 0, 0), (.2, -a, 0, -a * .7), (.3, -a, -a * .4, -a * .7), (.5, 0, 0, 0), (.7, a, 0, a * .7), (.8, a, -a * .4, a * .7), (1, 0, 0, 0)]
    if sig == "float":
        return [(0, 0, 0, -a * .3), (.5, 0, -a * 2.2, a * .3), (1, 0, 0, -a * .3)]
    if sig == "nod":
        return [(0, 0, 0, 0), (.25, 0, a * .4, a * .8), (.4, 0, 0, 0), (.6, 0, 0, 0), (.75, 0, 0, -a * .4), (1, 0, 0, 0)]
    if sig == "spring":
        return [(0, 0, 0, 0), (.12, 0, 0, 0), (.45, 0, -a * 3.4, 0), (.8, 0, 0, 0), (1, 0, 0, 0)]
    if sig == "rise":
        return [(0, 0, 0, 0), (.5, 0, -a * 1.6, 0), (1, 0, 0, 0)]
    raise ValueError(sig)


SPRING_BODY = [(0, 1.06, .92), (.12, 1.06, .92), (.25, .96, 1.05), (.45, 1, 1), (.78, 1, 1), (.84, 1.08, .9), (1, 1.06, .92)]
RISE_GLOW = [(0, 1.0), (.5, 1.07), (1, 1.0)]

# One-off reactions: duration in seconds and keyframes (t, x, y, rotation, scale x, scale y, brightness).
REACTIONS = {
    "double_hop": (0.76, [(0, 0, 0, 0, 1, 1, 1), (.15, 0, 0, 0, 1.06, .93, 1), (.3, 0, -18, 0, .97, 1.04, 1), (.45, 0, 0, 0, 1.05, .95, 1), (.6, 0, -10, 0, 1, 1, 1), (.8, 0, 0, 0, 1.03, .97, 1), (1, 0, 0, 0, 1, 1, 1)]),
    "two_ticks":  (0.90, [(0, 0, 0, 0, 1, 1, 1), (.12, 0, 0, 7, 1, 1, 1), (.3, 0, 0, 0, 1, 1, 1), (.5, 0, 0, 7, 1, 1, 1), (.68, 0, 0, 0, 1, 1, 1), (1, 0, 0, 0, 1, 1, 1)]),
    "pat_wiggle": (0.90, [(0, 0, 0, 0, 1, 1, 1), (.15, -6, 0, -4, 1, 1, 1), (.3, 6, 0, 4, 1, 1, 1), (.45, -4, 0, -3, 1, 1, 1), (.6, 4, 0, 3, 1, 1, 1), (.8, 0, 0, 0, 1.05, .95, 1), (1, 0, 0, 0, 1, 1, 1)]),
    "glow_swell": (1.70, [(0, 0, 0, 0, 1, 1, 1), (.5, 0, -6, 0, 1.06, 1.06, 1.16), (1, 0, 0, 0, 1, 1, 1)]),
    "deep_nod":   (1.20, [(0, 0, 0, 0, 1, 1, 1), (.35, 0, 6, 10, 1, 1, 1), (.55, 0, 6, 10, 1, 1, 1), (1, 0, 0, 0, 1, 1, 1)]),
    "big_jump":   (0.90, [(0, 0, 0, 0, 1, 1, 1), (.15, 0, 0, 0, 1.14, .84, 1), (.45, 0, -42, 0, .9, 1.12, 1), (.75, 0, 0, 0, 1.12, .88, 1), (.88, 0, 0, 0, .98, 1.02, 1), (1, 0, 0, 0, 1, 1, 1)]),
    "rise_glow":  (1.30, [(0, 0, 0, 0, 1, 1, 1), (.5, 0, -16, 0, 1, 1, 1.18), (1, 0, 0, 0, 1, 1, 1)]),
}


def sample(keys, t):
    """Smoothly interpolates keyframes (t, value, value, ...) at time t in 0..1."""
    for (t0, *v0), (t1, *v1) in zip(keys, keys[1:]):
        if t0 <= t <= t1:
            u = 0 if t1 == t0 else (t - t0) / (t1 - t0)
            u = u * u * (3 - 2 * u)
            return [a + (b - a) * u for a, b in zip(v0, v1)]
    return list(keys[-1][1:])


def alpha_box(image):
    return image.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox()


def align(pose, reference, rescale=True):
    """Scales and moves a generated pose so its body sits exactly where the reference portrait's does.
    Action frames keep their size (a raised paw changes the outline), and only their feet are lined up."""
    ref, box = alpha_box(reference), alpha_box(pose)
    scale = (ref[3] - ref[1]) / (box[3] - box[1]) if rescale else 1.0
    pose = pose.resize((round(pose.width * scale), round(pose.height * scale)), RESAMPLE.LANCZOS)
    box = alpha_box(pose)
    dx = (ref[0] + ref[2]) / 2 - (box[0] + box[2]) / 2
    dy = ref[3] - box[3]
    out = Image.new("RGBA", reference.size, (0, 0, 0, 0))
    out.paste(pose, (round(dx), round(dy)))
    return out


def render(pose, x=0.0, y=0.0, rotation=0.0, sx=1.0, sy=1.0, brightness=1.0):
    """Draws one frame: the pose scaled and rotated around the feet, then moved. x and y in Lab px."""
    image = pose
    if abs(brightness - 1) > 1e-3:
        lit = ImageEnhance.Brightness(image.convert("RGB")).enhance(brightness)
        lit.putalpha(image.getchannel("A"))
        image = lit
    image = image.convert("RGBa")  # premultiplied, so edges stay clean when scaled and rotated
    px, py = PIVOT
    scaled = image.resize((max(1, round(FRAME * sx)), max(1, round(FRAME * sy))), RESAMPLE.LANCZOS)
    layer = Image.new("RGBa", (FRAME, FRAME), (0, 0, 0, 0))
    layer.paste(scaled, (round(px - px * sx), round(py - py * sy)))
    layer = layer.rotate(-rotation, resample=RESAMPLE.BICUBIC, center=(px, py))  # CSS rotates clockwise
    frame = Image.new("RGBa", (FRAME, FRAME), (0, 0, 0, 0))
    frame.paste(layer, (round(x * K), round(y * K)))
    return frame.convert("RGBA")


def settings_for(companion, mood):
    merged = dict(MOODS[mood])
    merged.update(OVERRIDES.get(companion, {}).get(mood, {}))
    return merged


def mood_clip(companion, mood, poses):
    """A seamless loop for one mood."""
    c, m = CHARACTERS[companion], settings_for(companion, mood)
    seconds = 2.0 if m.get("talk") else c["tempo"] * m["tempo"]
    count = max(8, min(72, round(seconds * FPS)))
    keys = signature(c["sig"], 4 * c["amp"] * m["amp"])
    face = poses.get(m["pose"], poses["neutral"])
    blink_at = {round(count * .6), round(count * .6) + 1} if m.get("blink") and "blink" in poses else set()
    talk_cycles = max(1, round(seconds * 3))
    frames = []
    for i in range(count):
        t = i / count
        x, y, r = sample(keys, t)
        breath = math.sin(2 * math.pi * t)
        if c["sig"] == "spring" and not m.get("talk"):
            sx, sy = sample(SPRING_BODY, t)
        elif m.get("talk"):
            wobble = math.sin(2 * math.pi * talk_cycles * t) * (c["squash"] / .035)
            sx, sy = 1 + .015 * wobble, 1 - .02 * wobble
        else:
            sx, sy = 1 - c["squash"] * .5 * breath, 1 + c["squash"] * breath
        brightness = sample(RISE_GLOW, t)[0] if c["sig"] == "rise" else 1.0
        pose = face
        if i in blink_at:
            pose = poses["blink"]
        if m.get("talk") and (i // 2) % 2:
            pose = poses["neutral"] if companion != "luma" else poses.get("awake", poses["neutral"])
        frames.append(render(pose, x, y + m["lift"], r + m["lean"], sx * m["size"], sy * m["size"], brightness))
    return frames, True


def reaction_clip(companion, poses):
    """The one-off reaction, played when something good happens."""
    seconds, keys = REACTIONS[CHARACTERS[companion]["react"]]
    count = max(6, round(seconds * FPS))
    face = poses.get("happy", poses["neutral"])
    frames = []
    for i in range(count + 1):
        x, y, r, sx, sy, b = sample(keys, i / count)
        frames.append(render(face, x, y, r, sx, sy, b))
    return frames, False


def action_clip(poses):
    """Optional hand-drawn action: frames named <companion>-action-01.png, -02 ... played forward then back."""
    names = sorted(name for name in poses if name.startswith("action-"))
    if len(names) < 2:
        return None
    frames = [poses[name] for name in names]
    return frames + frames[-2:0:-1], True


def save_clip(folder, name, frames, loop):
    duration = round(1000 / FPS)
    frames[0].save(os.path.join(folder, f"{name}.webp"), save_all=True, append_images=frames[1:], duration=duration, loop=0 if loop else 1, quality=88, method=4)
    on_white = []
    for frame in frames:
        flat = Image.new("RGB", frame.size, (255, 255, 255))
        flat.paste(frame, mask=frame.getchannel("A"))
        on_white.append(flat)
    on_white[0].save(os.path.join(folder, f"{name}.gif"), save_all=True, append_images=on_white[1:], duration=duration, loop=0 if loop else 1)
    rows = math.ceil(len(frames) / COLUMNS)
    sheet = Image.new("RGBA", (COLUMNS * FRAME, rows * FRAME), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.paste(frame, ((index % COLUMNS) * FRAME, (index // COLUMNS) * FRAME))
    sheet.save(os.path.join(folder, f"{name}-sheet.webp"), quality=88, method=4)
    return {"file": f"{name}-sheet.webp", "preview": f"{name}.webp", "frames": len(frames), "columns": COLUMNS, "rows": rows, "fps": FPS, "loop": loop}


def find_poses(companion):
    found = {}
    for path in glob.glob(os.path.join(INPUT, "**", "*.png"), recursive=True):
        if OUTPUT in path:
            continue
        name = os.path.splitext(os.path.basename(path))[0].lower()
        if name in (companion, f"{companion}-neutral"):
            found["neutral"] = path
        elif name.startswith(f"{companion}-"):
            found[name[len(companion) + 1:]] = path
    return found


def build():
    os.makedirs(OUTPUT, exist_ok=True)
    manifest = {"version": 1, "frameSize": FRAME, "fps": FPS, "companions": {}}
    for companion in CHARACTERS:
        paths = find_poses(companion)
        if "neutral" not in paths:
            print(f"Skipping {companion}: upload {companion}.png (the original portrait) first.")
            continue
        reference = Image.open(paths["neutral"]).convert("RGBA")
        poses = {}
        for pose, path in paths.items():
            image = Image.open(path).convert("RGBA")
            image = image if pose == "neutral" else align(image, reference, rescale=not pose.startswith("action-"))
            poses[pose] = image.resize((FRAME, FRAME), RESAMPLE.LANCZOS)
        folder = os.path.join(OUTPUT, companion)
        os.makedirs(os.path.join(folder, "keyposes"), exist_ok=True)
        for pose, image in poses.items():
            image.save(os.path.join(folder, "keyposes", f"{companion}-{pose}.png"))
        contact = Image.new("RGBA", (FRAME * len(poses), FRAME), (255, 255, 255, 255))
        for index, image in enumerate(poses.values()):
            contact.alpha_composite(image, (index * FRAME, 0))
        contact.save(os.path.join(folder, "contact-sheet.png"))
        clips = {}
        for mood in MOODS:
            frames, loop = mood_clip(companion, mood, poses)
            clips[mood] = save_clip(folder, mood, frames, loop)
        frames, loop = reaction_clip(companion, poses)
        clips["reaction"] = save_clip(folder, "reaction", frames, loop)
        action = action_clip(poses)
        if action:
            clips["action"] = save_clip(folder, "action", *action)
        manifest["companions"][companion] = {"keyposes": sorted(f"keyposes/{companion}-{pose}.png" for pose in poses), "clips": clips}
        missing = sorted({"blink", "talk", "happy", "think", "concern", "sleepy"} - set(poses) - ({"blink"} if companion == "luma" else set()))
        print(f"{companion}: {len(poses)} key poses, {len(clips)} clips." + (f" Missing poses (neutral used instead): {', '.join(missing)}" if missing else ""))
    with open(os.path.join(OUTPUT, "manifest.json"), "w", encoding="utf-8") as file:
        json.dump(manifest, file, indent=2)
    with zipfile.ZipFile(OUTPUT + ".zip", "w", zipfile.ZIP_DEFLATED) as archive:
        for path in glob.glob(os.path.join(OUTPUT, "**", "*"), recursive=True):
            if os.path.isfile(path):
                archive.write(path, os.path.relpath(path, os.path.dirname(OUTPUT)))
    print(f"Done. Download {OUTPUT}.zip")


if __name__ == "__main__":
    build()
