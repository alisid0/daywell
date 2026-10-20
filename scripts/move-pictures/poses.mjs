// What each Move workout-guide picture must show (owner, 20 October 2026): the camera, the pose or poses (start, then
// end) and the muscles to highlight. The pictures are made once in ChatGPT with prompts.mjs, kept in the app as files,
// and every picture is checked against its pose text before it goes in. See docs/move-pictures.md.

export const VIEW = { side: "Side view, facing right.", front: "Front view, facing the viewer.", above: "Seen from directly above, head at the top of the picture." };
const lighter = s => ` ${s} in a lighter pink.`;
// Highlights in plain anatomy words.
const M = {
  push: "Highlight the chest, the front of the shoulders and the triceps.",
  legs: "Highlight the quadriceps (front of the thighs) and the glutes.",
  hinge: "Highlight the glutes and the hamstrings (back of the thighs).",
  pull: "Highlight the lats (the wide muscles down the sides of the back), the upper back and the biceps.",
  abs: "Highlight the abdominal muscles.",
};

// id: the exercise in content/workouts.json. view: camera. works: highlight. poses: one or two (start, then end).
// sameAs: reuse another exercise's pictures. mirrorOf: the other exercise's picture flipped left to right.
export const exercises = [
  { id: "hip-hinge-practice", view: "side", works: M.hinge + lighter("The lower back"), poses: [
    "Hip hinge practice, starting position. Standing tall, feet hip-width apart, knees soft, hands resting on the front of the hips.",
    "Hip hinge practice, hinged position. Hips pushed back and the torso tipped forward to about 45 degrees from the hips with a long, straight back; knees softly bent, shins nearly vertical; hands slid down the front of the thighs to just above the knees; neck in line with the spine."] },
  { id: "kettlebell-deadlift", view: "side", works: M.hinge + lighter("The lower back"), poses: [
    "Kettlebell deadlift, starting position. A kettlebell sits on the floor between the feet. Feet hip-width apart, hips pushed back, knees softly bent, back long and straight, not rounded; both hands grip the kettlebell handle with straight arms; eyes on the floor a little ahead.",
    "Kettlebell deadlift, standing position. Standing tall with the hips fully extended, not leaning back; shoulders relaxed; arms straight, holding the kettlebell by its handle with both hands in front of the hips."] },
  { id: "kettlebell-goblet-squat", view: "side", works: M.legs + lighter("The abdominal muscles"), poses: [
    "Goblet squat, starting position. Standing tall, feet a little wider than the hips, holding a kettlebell by the sides of its handle close to the chest, elbows pointing down.",
    "Goblet squat, lowest position. Hips back and down until the thighs are about parallel to the floor; chest up; back straight; knees in line with the toes; heels flat; the kettlebell still held close to the chest, elbows just inside the knees."] },
  { id: "kettlebell-carry-left", view: "front", works: "Highlight the obliques (sides of the waist) and the forearm and shoulder of the arm holding the weight.", poses: [
    "Kettlebell carry, walking slowly towards the viewer with a small step. A kettlebell is held in the figure's left hand (on the right side of the picture), arm straight down at the side. Torso upright, not leaning, shoulders level, the other arm relaxed."] },
  { id: "kettlebell-carry-right", mirrorOf: "kettlebell-carry-left" },
  { id: "march-in-place", view: "side", works: "Highlight the front of the hips and the quadriceps." + lighter("The calves"), poses: [
    "Marching on the spot. Standing tall on one foot with the other knee lifted to hip height; the opposite arm swings forward and the other arm back, elbows softly bent."] },
  { id: "brisk-walk", view: "side", works: "Highlight the calves, the hamstrings and the glutes.", poses: [
    "Brisk walk, mid-stride. Upright posture, the front heel landing with the toes up, the back foot pushing off from the toes, arms swinging naturally in opposition with soft elbows."] },
  { id: "step-jacks", view: "front", works: "Highlight the shoulders." + lighter("The outer hips and the calves"), poses: [
    "Step jacks, starting position. Standing tall, feet together, arms by the sides.",
    "Step jacks, open position. One foot stepped out to the side with its toes touching down, the other foot still planted; both arms raised out to the sides and overhead in a wide V. No jumping."] },
  { id: "shadow-boxing", view: "side", works: "Highlight the shoulders and the obliques (sides of the waist)." + lighter("The chest"), poses: [
    "Shadow boxing. A relaxed boxing stance: feet staggered about shoulder-width apart, knees soft; the front hand extended in a light straight punch at shoulder height; the rear hand guarding near the chin."] },
  { id: "dance-break", view: "front", works: "Highlight nothing: all the skin stays light warm grey.", poses: [
    "Dancing for fun. A joyful, relaxed dance pose: one arm raised, the other bent at the waist, knees soft, weight on one foot, hips swaying."] },
  { id: "jumping-jacks", view: "front", works: "Highlight the calves and the shoulders." + lighter("The quadriceps"), poses: [
    "Jumping jacks, starting position. Standing tall, feet together, arms by the sides.",
    "Jumping jacks, open position. Feet landed wide apart, wider than the shoulders, on the balls of the feet with soft knees; arms straight overhead with the hands close together."] },
  { id: "high-knees", view: "side", works: "Highlight the front of the hips and the quadriceps." + lighter("The calves and the abdominal muscles"), poses: [
    "High knees. Running on the spot: on the ball of one foot, the other knee driven up to hip height; arms bent at 90 degrees, pumping in opposition; upright posture."] },
  { id: "stair-climb", view: "side", works: "Highlight the quadriceps, the glutes and the calves.", poses: [
    "Stair climbing. Walking up a short flight of four simple stairs at a steady pace: one foot on a higher step, the other pushing off a lower step; upright posture; one hand holding a simple handrail that follows the stairs."] },
  { id: "burpees", view: "side", works: "Highlight the quadriceps, the chest and the shoulders." + lighter("The abdominal muscles"), poses: [
    "Burpee, first position. Squatted down with both hands flat on the floor just in front of the feet, shoulder-width apart; back fairly flat; heels down if possible.",
    "Burpee, second position. Feet stepped back into a high plank: hands under the shoulders, arms straight, the body in one straight line from head to heels."] },
  { id: "sit-to-stand", view: "side", works: M.legs, poses: [
    "Chair sit-to-stand, starting position. Sitting near the front edge of a sturdy chair, feet flat and hip-width apart, a little behind the knees; arms crossed over the chest; leaning forward slightly from the hips with a long back.",
    "Chair sit-to-stand, standing position. Standing tall just in front of the chair, hips and knees straight, arms still crossed over the chest."] },
  { id: "calf-raise", view: "side", works: "Highlight the calves.", poses: [
    "Calf raise, starting position. Standing tall, feet hip-width apart and flat, one hand lightly resting on a plain wall in front for balance.",
    "Calf raise, top position. Risen high onto the balls of both feet with the heels lifted, body tall, the hand still lightly on the wall."] },
  { id: "glute-bridge", view: "side", works: "Highlight the glutes." + lighter("The hamstrings"), poses: [
    "Glute bridge, starting position. Lying on the back, knees bent to about 90 degrees, feet flat and hip-width apart, arms long on the floor by the sides, palms down.",
    "Glute bridge, top position. Hips lifted until the shoulders, hips and knees form one straight line; weight on the upper back and the feet; ribs down, the lower back not over-arched."] },
  { id: "squat", view: "side", works: M.legs, poses: [
    "Bodyweight squat, starting position. Standing tall, feet hip-width apart and flat on the floor, arms relaxed by the sides, spine long.",
    "Bodyweight squat, lowest position. Hips pushed back and down until the thighs are about parallel to the floor, as if sitting back onto a seat that isn't drawn; chest up; back straight and neutral, not rounded; knees in line with the toes; heels flat on the floor; arms reaching straight forward at shoulder height for balance."] },
  { id: "wall-sit", view: "side", works: "Highlight the quadriceps (front of the thighs)." + lighter("The glutes"), poses: [
    "Wall sit. The back flat against a plain wall, slid down until the knees are bent to about 90 degrees with the thighs about parallel to the floor; knees above the ankles; feet flat and hip-width apart; hands resting on the thighs."] },
  { id: "step-up", view: "side", works: M.legs, poses: [
    "Step-up, starting position. Standing in front of a low sturdy step, one whole foot placed on the step, the other foot on the floor; torso upright; arms relaxed.",
    "Step-up, top position. Standing tall on the step with both feet, hips and knees straight."] },
  { id: "reverse-lunge", view: "side", works: M.legs, poses: [
    "Reverse lunge, starting position. Standing tall, feet hip-width apart, hands on the hips.",
    "Reverse lunge, lowest position. One leg stepped back; both knees bent to about 90 degrees; the back knee hovering just above the floor; the front shin about vertical, front knee over the ankle; torso upright; hands on the hips."] },
  { id: "split-squat", view: "side", works: M.legs, poses: [
    "Split squat, starting position. Standing in a long stride, one foot forward and flat, the back foot on its toes; torso upright; hands on the hips; both legs nearly straight.",
    "Split squat, lowest position. Lowered straight down in the same stride: both knees bent to about 90 degrees, the back knee just above the floor, the front knee over the ankle, torso upright."] },
  { id: "lateral-lunge", view: "front", works: "Highlight the inner thighs, the glutes and the quadriceps.", poses: [
    "Side lunge, starting position. Standing tall, feet together, hands clasped in front of the chest.",
    "Side lunge, lowest position. A wide step out to one side, sitting the hips back into that side with that knee bent over its foot; the other leg straight with its foot flat; chest up; hands clasped in front of the chest."] },
  { id: "single-leg-bridge", view: "side", works: "Highlight the glutes." + lighter("The hamstrings"), poses: [
    "Single-leg bridge, starting position. Lying on the back, one knee bent with that foot flat; the other leg held straight out in line with the bent leg's thigh; arms long on the floor by the sides.",
    "Single-leg bridge, top position. Hips lifted on the planted foot until the shoulders, hips and the bent knee form one straight line; the other leg still straight out; hips level."] },
  { id: "bulgarian-split-squat", view: "side", works: M.legs, poses: [
    "Bulgarian split squat, starting position. Standing tall on the front leg about a long stride in front of a sturdy chair, the top of the back foot resting on the seat behind; hands on the hips.",
    "Bulgarian split squat, lowest position. The front knee bent to about 90 degrees over the ankle; the back knee lowered towards the floor; torso upright or leaning slightly forward; the back foot still on the seat."] },
  { id: "jump-squat", view: "side", works: M.legs + lighter("The calves"), poses: [
    "Jump squat, low position. Hips back and down until the thighs are about parallel to the floor, chest up, back straight, arms swung back.",
    "Jump squat, in the air. A small jump just off the floor: body extended straight, toes pointing down, arms swung forward and up."] },
  { id: "wall-push-up", view: "side", works: M.push, poses: [
    "Wall push-up, starting position. Standing about an arm's length from a plain wall, hands flat on the wall at shoulder height and shoulder-width apart, arms straight, the body in one straight line, leaning slightly forward, heels down.",
    "Wall push-up, bent position. Elbows bent, chest moved towards the wall, the body still in one straight line from head to heels."] },
  { id: "incline-push-up", view: "side", works: M.push, poses: [
    "Incline push-up, starting position. Hands on the edge of a sturdy kitchen counter at about waist height, arms straight; the body in one straight diagonal line from head to heels, feet back on their toes.",
    "Incline push-up, bent position. Elbows bent about 45 degrees from the body, chest lowered towards the counter edge, the body still in one straight line."] },
  { id: "knee-push-up", view: "side", works: M.push + lighter("The abdominal muscles"), poses: [
    "Knee push-up, top position. Hands flat under the shoulders, arms straight, knees on the floor with the lower legs resting down; one straight line from head to knees.",
    "Knee push-up, lowest position. Elbows bent about 45 degrees from the body, chest close to the floor, still one straight line from head to knees."] },
  { id: "push-up", view: "side", works: M.push + lighter("The abdominal muscles"), poses: [
    "Push-up, top position. The body is horizontal: hands flat on the floor directly under the shoulders, arms straight, legs straight with the toes on the floor. The body forms one straight line from head to heels, hips neither sagging nor raised; the neck in line with the spine, looking at the floor.",
    "Push-up, lowest position. The same straight body line from head to heels; elbows bent and angled about 45 degrees from the body; chest a fist's height above the floor."] },
  { id: "chair-dip", view: "side", works: "Highlight the triceps." + lighter("The chest and the front of the shoulders"), poses: [
    "Chair dip, starting position. A sturdy chair with its back against a plain wall. Hands on the front edge of the seat behind the body, fingers forward, arms straight; hips just in front of the seat; knees bent to 90 degrees, feet flat.",
    "Chair dip, lowest position. Elbows bent straight back to about 90 degrees, not out to the sides; hips lowered close in front of the chair; shoulders down, away from the ears."] },
  { id: "pike-push-up", view: "side", works: "Highlight the shoulders and the triceps." + lighter("The upper chest"), poses: [
    "Pike push-up, starting position. An upside-down V: hands and feet on the floor, hips high, arms and legs straight, head between the arms.",
    "Pike push-up, lowest position. Elbows bent, the top of the head lowered towards the floor just in front of the hands, hips still high."] },
  { id: "decline-push-up", view: "side", works: "Highlight the upper chest, the front of the shoulders and the triceps.", poses: [
    "Decline push-up, top position. Hands on the floor under the shoulders, arms straight, feet resting on a low step behind; the body in one straight line from head to heels, sloping down towards the head.",
    "Decline push-up, lowest position. Elbows bent about 45 degrees from the body, chest close to the floor, the body still in one straight line."] },
  { id: "superman", view: "side", works: "Highlight the lower back, the glutes and the upper back.", poses: [
    "Superman hold. Lying face down, arms reaching forward; arms, chest and legs all lifted a little off the floor; neck long, looking at the floor."] },
  { id: "prone-y-t", view: "above", works: "Highlight the upper back between the shoulder blades and the back of the shoulders.", poses: [
    "Lying Y raise. Lying face down, forehead just above the floor; both arms lifted a little off the floor overhead in a Y shape, thumbs pointing up.",
    "Lying T raise. Lying face down; both arms lifted a little off the floor straight out to the sides in a T shape, thumbs up, shoulder blades squeezed together."] },
  { id: "backpack-row", view: "side", works: M.pull + lighter("The back of the shoulders"), poses: [
    "Backpack row, starting position. Hinged forward from the hips with a flat back at about 45 degrees, knees soft; holding a loaded backpack by its top handle with both hands, arms hanging straight down.",
    "Backpack row, top position. The same hinge and flat back; elbows pulled back close to the body, the backpack pulled up to the lower ribs, shoulder blades squeezed."] },
  { id: "table-row", view: "side", works: M.pull, poses: [
    "Under-table row, starting position. Lying on the back under a very sturdy table, hands gripping the table edge about shoulder-width apart, arms straight, heels on the floor, the body in one straight line from head to heels.",
    "Under-table row, top position. Chest pulled up close to the table edge, elbows bent and back, the body still in one straight line."] },
  { id: "dead-bug", view: "side", works: M.abs + lighter("The obliques"), poses: [
    "Dead bug, starting position. Lying on the back, arms pointing straight up, hips and knees bent at 90 degrees with the shins level; the lower back pressed into the floor.",
    "Dead bug, reaching position. One arm lowered overhead and the opposite leg extended long, both hovering just above the floor; the other arm and leg stay in place; the lower back still flat on the floor."] },
  { id: "bird-dog", view: "side", works: "Highlight the lower back and the glutes." + lighter("The abdominal muscles"), poses: [
    "Bird dog, starting position. On hands and knees: hands under the shoulders, knees under the hips, a flat back, neck long.",
    "Bird dog, reaching position. One arm reaching straight forward and the opposite leg reaching straight back, both level with the back; hips square; neck long."] },
  { id: "heel-tap", view: "side", works: "Highlight the lower abdominal muscles.", poses: [
    "Heel taps, starting position. Lying on the back, hips and knees bent at 90 degrees with the shins level; arms long on the floor by the sides; the lower back flat.",
    "Heel taps, tapping position. One heel lowered to tap the floor while that knee stays bent; the other leg stays up; the lower back still flat."] },
  { id: "knee-plank", view: "side", works: M.abs + lighter("The front of the shoulders"), poses: [
    "Knee plank hold. Forearms on the floor with the elbows under the shoulders, knees on the floor; one straight line from head to knees; neck neutral."] },
  { id: "plank", view: "side", works: "Highlight the abdominal muscles and the obliques." + lighter("The glutes and the front of the shoulders"), poses: [
    "Forearm plank hold. Forearms flat on the floor with the elbows directly under the shoulders, legs straight with the toes on the floor. The body forms one straight line from head to heels; neck neutral, looking at the floor."] },
  { id: "side-plank", view: "front", works: "Highlight the obliques (sides of the waist)." + lighter("The abdominal muscles and the side of the glutes"), poses: [
    "Side plank hold. Propped on one forearm with the elbow under the shoulder, legs straight and stacked, hips lifted so the body forms one straight line from head to feet; the top hand resting on the hip."] },
  { id: "mountain-climber", view: "side", works: M.abs + lighter("The front of the hips and the shoulders"), poses: [
    "Mountain climber, first position. A high plank with hands under the shoulders and arms straight, the body straight; one knee driven in towards the chest.",
    "Mountain climber, second position. The same high plank; the other knee driven in towards the chest while the first leg is extended back."] },
  { id: "hollow-hold", view: "side", works: M.abs, poses: [
    "Hollow hold. Lying on the back with the lower back pressed into the floor; arms extended overhead and legs extended long, both lifted just off the floor; shoulders lifted slightly; a shallow banana shape."] },
  { id: "single-leg-stand", view: "side", works: "Highlight the calf and the glute of the standing leg.", poses: [
    "Single-leg balance. Standing tall on one leg beside a kitchen counter, one hand hovering just above it for safety; the other foot lifted a few centimetres off the floor with the knee bent; looking straight ahead."] },
  { id: "heel-toe-walk", view: "side", works: "Highlight the calves." + lighter("The abdominal muscles"), poses: [
    "Heel-to-toe walk. Walking along a straight line on the floor, the front heel placed directly in front of the back foot's toes; arms held slightly out to the sides for balance."] },
  { id: "cat-cow", view: "side", works: "Highlight the muscles along the spine in a lighter pink.", poses: [
    "Cat position. On hands and knees, the back rounded up towards the ceiling, head and tailbone tucked down.",
    "Cow position. On hands and knees, the back gently arched with the belly lowered, chest forward, gaze slightly forward."] },
  { id: "thoracic-rotation", view: "above", works: "Highlight the chest and the upper back in a lighter pink.", poses: [
    "Open book, starting position. Lying on one side, knees bent to 90 degrees and stacked, head resting on the floor, both arms straight out in front at shoulder height, palms together.",
    "Open book, open position. The top arm swept up and across in an arc to the other side, the chest and upper back rotated open, eyes following the hand; knees still stacked together."] },
  { id: "hip-flexor-stretch", view: "side", works: "Highlight the front of the hip of the kneeling leg.", poses: [
    "Kneeling hip stretch. Half-kneeling: one knee on the floor, the other foot flat in front with that knee bent to 90 degrees; pelvis tucked under, torso upright, hips shifted gently forward, hands resting on the front knee."] },
  { id: "hamstring-stretch", view: "side", works: "Highlight the hamstrings (back of the thigh) of the front leg.", poses: [
    "Standing hamstring stretch. One heel placed a small step forward with the toes up and that leg straight; the back knee slightly bent; hinged forward at the hips with a long, straight back; hands resting on the bent leg's thigh."] },
  { id: "doorway-chest-stretch", view: "side", works: "Highlight the chest and the front of the shoulders.", poses: [
    "Doorway chest opener. Standing in a simple open doorway, forearms resting on the door frame at shoulder height, one foot stepped gently through so the chest opens forward; body upright."] },
  { id: "neck-stretch", view: "front", works: "Highlight the side of the neck that is being stretched.", poses: [
    "Gentle neck stretch. Sitting tall on a simple stool, shoulders relaxed and down, the head tilted so one ear moves towards that shoulder, hands resting on the thighs."] },
  { id: "childs-pose", view: "side", works: "Highlight the lats and the lower back in a lighter pink.", poses: [
    "Child's pose. Kneeling with the knees wide, hips sitting back towards the heels, torso folded forward, forehead resting on the floor, arms stretched long in front on the floor."] },
  { id: "legs-up-wall", view: "side", works: "Highlight the hamstrings in a lighter pink.", poses: [
    "Legs up the wall. Lying on the back with the hips close to a plain wall, legs resting straight up the wall, arms relaxed out to the sides."] },
  { id: "goblet-squat", sameAs: "kettlebell-goblet-squat" },
  { id: "back-squat", view: "side", works: M.legs + lighter("The lower back"), poses: [
    "Barbell back squat, starting position. Standing tall with a barbell with plates resting across the upper back, hands gripping the bar just outside the shoulders, feet shoulder-width apart.",
    "Barbell back squat, lowest position. Squatted down until the thighs are about parallel to the floor; chest up; back straight; knees in line with the toes; heels flat; the bar stays over the middle of the feet."] },
  { id: "leg-press", view: "side", works: M.legs, poses: [
    "Leg press, starting position. Seated in a simple leg press machine, back against the backrest, feet shoulder-width apart on the platform, knees bent to about 90 degrees.",
    "Leg press, pressed position. Legs pushed out until nearly straight with the knees still soft, not locked; back still against the backrest."] },
  { id: "romanian-deadlift", view: "side", works: M.hinge + lighter("The lower back"), poses: [
    "Romanian deadlift, starting position. Standing tall, holding a dumbbell in each hand in front of the thighs, knees soft.",
    "Romanian deadlift, lowest position. Hips pushed back and the torso hinged forward with a flat back; the dumbbells slid down the front of the thighs to just below the knees; knees softly bent; shins nearly vertical."] },
  { id: "trap-bar-deadlift", view: "side", works: "Highlight the glutes, the quadriceps and the hamstrings." + lighter("The lower back"), poses: [
    "Trap bar deadlift, starting position. Standing inside a hexagonal trap bar with plates on the floor; hips back and knees bent; back flat; gripping the side handles with straight arms.",
    "Trap bar deadlift, standing position. Standing tall, hips and knees straight, arms straight, holding the trap bar at the sides."] },
  { id: "hip-thrust", view: "side", works: "Highlight the glutes." + lighter("The hamstrings"), poses: [
    "Hip thrust, starting position. The upper back resting across the edge of a flat bench, feet flat and hip-width apart, knees bent; a dumbbell held on the hips with both hands; hips low, near the floor.",
    "Hip thrust, top position. Hips driven up until the torso is level with the floor and the knees are bent to about 90 degrees; chin slightly tucked; the dumbbell still on the hips."] },
  { id: "leg-curl", view: "side", works: "Highlight the hamstrings (back of the thighs).", poses: [
    "Seated leg curl, starting position. Seated in a simple leg curl machine, legs straight out in front with the lower pad behind the ankles and the upper pad over the thighs, hands on the handles.",
    "Seated leg curl, curled position. Knees bent, the lower legs curled down and back under the seat, pushing the pad."] },
  { id: "db-bench-press", view: "side", works: M.push, poses: [
    "Dumbbell bench press, starting position. Lying on a flat bench, feet flat on the floor, a dumbbell in each hand pressed straight up above the chest, arms straight.",
    "Dumbbell bench press, lowest position. The dumbbells lowered to the sides of the chest, elbows bent about 45 degrees from the body, forearms vertical."] },
  { id: "bench-press", view: "side", works: M.push, poses: [
    "Barbell bench press, starting position. Lying on a flat bench, feet planted on the floor, holding a barbell with plates straight above the shoulders, arms straight, hands a little wider than the shoulders.",
    "Barbell bench press, lowest position. The bar lowered to touch the lower chest, elbows about 45 to 60 degrees from the body, forearms vertical."] },
  { id: "db-shoulder-press", view: "front", works: "Highlight the shoulders and the triceps.", poses: [
    "Dumbbell shoulder press, starting position. Standing tall, a dumbbell in each hand at shoulder height, palms facing forward, elbows under the wrists.",
    "Dumbbell shoulder press, top position. The dumbbells pressed straight overhead with the arms extended; ribs down, the lower back not arched."] },
  { id: "lat-pulldown", view: "front", works: M.pull, poses: [
    "Lat pulldown, starting position. Seated at a simple cable pulldown machine with the thighs under the pads, arms extended overhead holding a long bar, hands wider than the shoulders.",
    "Lat pulldown, pulled position. The bar pulled down to the upper chest, elbows down and back, chest up, leaning back only slightly."] },
  { id: "seated-cable-row", view: "side", works: M.pull, poses: [
    "Seated cable row, starting position. Sitting tall on a simple cable row machine, feet on the foot plates, knees soft, arms extended forward holding a V-shaped handle.",
    "Seated cable row, pulled position. The handle pulled to the stomach, elbows close to the body and behind the torso, chest up, shoulder blades squeezed, torso upright."] },
  { id: "db-row", view: "side", works: M.pull + lighter("The back of the shoulder"), poses: [
    "One-arm dumbbell row, starting position. One hand and the same-side knee on a flat bench, back flat and level with the floor, the other foot on the floor; a dumbbell hanging straight down in the free hand.",
    "One-arm dumbbell row, top position. The dumbbell rowed up to the hip, elbow bent and pulled back close to the body, back still flat."] },
  { id: "pull-up", view: "side", works: M.pull, poses: [
    "Pull-up, starting position. Hanging from a pull-up bar with straight arms, hands a little wider than the shoulders, legs straight, feet off the floor.",
    "Pull-up, top position. Chin above the bar, chest pulled towards it, elbows bent and pointing down."] },
  { id: "face-pull", view: "side", works: "Highlight the back of the shoulders and the upper back.", poses: [
    "Cable face pull, starting position. Standing tall facing a simple cable machine column, a rope attachment at upper-chest height; arms extended forward holding the rope ends, palms facing in.",
    "Cable face pull, pulled position. The rope pulled towards the face, hands apart beside the ears, elbows high and out to the sides, shoulder blades squeezed."] },
  { id: "farmer-carry", view: "front", works: "Highlight the forearms, the top of the shoulders and the obliques.", poses: [
    "Farmer's carry. Walking slowly towards the viewer, standing tall, a heavy dumbbell in each hand at the sides, arms straight, shoulders back and level."] },
  { id: "kettlebell-swing", view: "side", works: M.hinge + lighter("The abdominal muscles"), poses: [
    "Kettlebell swing, low position. Hinged at the hips with a flat back, knees soft, the kettlebell swung back between the thighs, arms straight.",
    "Kettlebell swing, top position. Hips snapped forward to stand tall, glutes squeezed; arms straight and relaxed, holding the kettlebell at chest height in front."] },
  { id: "incline-treadmill-walk", view: "side", works: "Highlight the calves, the glutes and the hamstrings.", poses: [
    "Incline treadmill walk. Walking on a simple treadmill set to a gentle incline, upright posture, natural arm swing, not holding the rails."] },
  { id: "rowing-machine", view: "side", works: "Highlight the quadriceps and the upper back." + lighter("The lats and the biceps"), poses: [
    "Rowing machine, catch position. Seated on a simple rowing machine, knees bent up with the shins vertical, arms straight reaching forward to the handle, torso leaning slightly forward from the hips.",
    "Rowing machine, finish position. Legs pushed straight, torso leaning back slightly, the handle pulled to the lower ribs with the elbows past the body."] },
  { id: "stationary-bike", view: "side", works: "Highlight the quadriceps and the calves." + lighter("The glutes"), poses: [
    "Exercise bike. Seated on a simple upright exercise bike with a straight back, hands on the handlebars, one pedal at the bottom with that knee slightly bent."] },
];
