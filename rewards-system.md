# Fitness App Rewards System: Comprehensive Design Specification

This document describes, in plain language, how the **achievement badges**, **point system**, and **level progression** in the fitness app should work.

The app already:
- Tracks strength, cardio, and yoga sessions.
- Tracks per-session details including time, strength training volume/tonnage, and streaks with rest-aware logic.
- Uses a weekly block of **Sunday–Saturday**.

What follows is a **behavioral spec** only: all logic described here assumes the underlying tracking is already functioning.

---

## 1. Core Design Principles

The system is designed to:

1. **Reward behaviors that are scientifically-backed** to improve health, strength, and long-term adherence:
   - Regular strength training (around 3+ sessions per week).
   - Meaningful training volume over time.
   - Cardio and yoga for heart health, mobility, and recovery.
   - Consistency over weeks, months, and years.

2. **Make incentives straightforward and understandable**:
   - Badges for clear milestones: number of workouts, tonnage lifted, time spent, streak durations.
   - Points that mainly come from completing sessions, with transparent bonuses and penalties.

3. **Support long-term engagement** (2+ years and beyond):
   - Milestones scale up over time.
   - Level progression remains achievable and satisfying even after years of consistent training.
   - There is no "end"; users always have something to strive for.

---

## 2. Achievement Badges

Badges are earned when the user reaches specific milestones. They are meant to:

- Celebrate **quantity** (how many sessions, how much time, how much weight).
- Celebrate **consistency** (streaks and weekly adherence).
- Provide **long-term goals** that match realistic, science-based training expectations.

Each badge has:
- A **name**.
- A **behavior or milestone** it recognizes.
- A **trigger condition** (when the user hits that milestone for the first time).

Badges are one-time unlocks per badge name. Higher-tier badges in the same category are designed so a user can keep unlocking new ones over months and years.

### 2.1. Strength Training Badges

#### 2.1.1. Lifetime Strength Volume (Tonnage) Badges

These badges celebrate the cumulative total amount of weight the user has lifted across all strength training sessions. This reflects **progressive overload** and long-term commitment.

- **Iron Beginner**  
  - Unlock when the user has lifted a total of **50,000 lbs** across all strength sessions.
  - Represents the first meaningful block of cumulative work.

- **Iron Novice**  
  - Unlock at **250,000 lbs** total lifted.
  - Shows the user has been consistently strength training for a while.

- **Iron Intermediate**  
  - Unlock at **1,000,000 lbs** (1 million) total lifted.
  - Indicates serious long-term commitment and significant training history.

- **Iron Veteran**  
  - Unlock at **2,500,000 lbs** total lifted.
  - Reflects years of training and accumulated work.

- **Iron Master**  
  - Unlock at **5,000,000 lbs** total lifted.
  - Represents an elite level of lifetime lifting volume that typically takes many years to achieve.

These thresholds are spaced so that:
- Early badges come fairly quickly with consistent training.
- Later badges continue to be reachable for someone who trains regularly over multiple years.

#### 2.1.2. Strength Session Count Badges

These badges reward showing up and doing strength training sessions regularly, regardless of intensity. They reinforce the habit of **regular strength work**, which is strongly linked with strength, muscle gain, and long-term health.

- **First Steps**  
  - Unlock after **10** strength training sessions.

- **Finding Rhythm**  
  - Unlock after **25** strength training sessions.

- **Building Momentum**  
  - Unlock after **50** strength training sessions.

- **Consistent Lifter**  
  - Unlock after **100** strength training sessions.

- **Dedicated Lifter**  
  - Unlock after **150** strength training sessions.

- **Committed Lifter**  
  - Unlock after **300** strength training sessions.

- **Unwavering Lifter**  
  - Unlock after **500** strength training sessions.

- **Lifetime Lifter**  
  - Unlock after **1,000** strength training sessions.

These badges scale over weeks and years of training, providing early wins for new lifters and continued progression for long-term practitioners.

#### 2.1.3. Heavy Single-Session Volume Badges

These badges are about **how much work is performed in a single strength session**. They highlight big, focused training days.

- **Heavy Session I**  
  - Unlock when a single strength workout reaches **20,000 lbs or more** of total volume.

- **Heavy Session II**  
  - Unlock when a single strength workout reaches **30,000 lbs or more**.

- **Heavy Session III**  
  - Unlock when a single strength workout reaches **40,000 lbs or more**.

These badges recognize high workload sessions that reflect higher work capacity and advanced programming, particularly relevant once the lifter becomes more experienced.

---

### 2.2. Cardio Badges

Cardio badges exist to reward behaviors that improve **cardiovascular health, endurance, and recovery**.

#### 2.2.1. Cardio Session Count Badges

- **Cardio Starter**  
  - Unlock after **10** cardio sessions.

- **Cardio Regular**  
  - Unlock after **25** cardio sessions.

- **Cardio Habit**  
  - Unlock after **75** cardio sessions.

- **Cardio Enthusiast**  
  - Unlock after **150** cardio sessions.

- **Cardio Master**  
  - Unlock after **300** cardio sessions.

These badges provide more early wins and stretch the progression to give users multiple badges to work toward as they build a cardio habit.

#### 2.2.2. Cardio Time Accumulation Badges

These badges measure **total time** spent in cardio, which tracks exposure to cardiovascular training stimulus.

Milestones are defined in total **hours** of cardio performed across the user's history:

- **5 Hours Logged**  
  - Unlock after **5 hours** of cumulative cardio.

- **10 Hours Logged**  
  - Unlock after **10 hours** of cumulative cardio.

- **30 Hours Logged**  
  - Unlock after **30 hours** of cumulative cardio.

- **50 Hours Logged**  
  - Unlock after **50 hours** of cumulative cardio.

- **100 Hours Logged**  
  - Unlock after **100 hours** of cumulative cardio.

- **250 Hours Logged**  
  - Unlock after **250 hours** of cumulative cardio.

These time-based badges encourage sustainable habit-building (e.g., 20–30 minutes per session, several times per week) which research supports for heart health and aerobic fitness. Earlier milestones provide motivation during the ramp-up phase.

---

### 2.3. Yoga Badges

Yoga badges reward **mobility, flexibility, and active recovery**, all of which support better performance and lower injury risk in strength training.

#### 2.3.1. Yoga Session Count Badges

- **Yoga Beginner**  
  - Unlock after **5** yoga sessions.

- **Yoga Newcomer**  
  - Unlock after **10** yoga sessions.

- **Yoga Regular**  
  - Unlock after **30** yoga sessions.

- **Yoga Devotee**  
  - Unlock after **75** yoga sessions.

- **Yoga Master**  
  - Unlock after **150** yoga sessions.

Early badges (5, 10) provide early encouragement, while later badges continue the progression.

#### 2.3.2. Yoga Time Accumulation Badges

Time-based badges for yoga reward consistent practice over time, regardless of individual session duration.

- **5 Hours Logged**  
  - Unlock after **5 hours** of cumulative yoga.

- **10 Hours Logged**  
  - Unlock after **10 hours** of cumulative yoga.

- **25 Hours Logged**  
  - Unlock after **25 hours** of cumulative yoga.

- **50 Hours Logged**  
  - Unlock after **50 hours** of cumulative yoga.

- **100 Hours Logged**  
  - Unlock after **100 hours** of cumulative yoga.

These milestones scale from very early wins to meaningful long-term accumulation.

---

### 2.4. Overall Training Badges (All Session Types Combined)

These badges celebrate the **total number of workouts** across all modalities (strength + cardio + yoga). They show the user's overall training history and routine adherence.

- **Training Novice**  
  - Unlock after **25** total workouts.

- **Training Initiate**  
  - Unlock after **50** total workouts.

- **Training Enthusiast**  
  - Unlock after **150** total workouts.

- **Training Veteran**  
  - Unlock after **300** total workouts.

- **Training Legend**  
  - Unlock after **750** total workouts.

- **Training Immortal**  
  - Unlock after **1,500** total workouts.

This progression can stretch over several years of regular training and ensures that overall consistency (even with different modalities) is acknowledged, with earlier wins to keep momentum.

---

### 2.5. Weekly Consistency Badges (Strength-Focused)

These badges recognize **consistency in hitting at least 3 strength sessions per week**, which is a science-backed sweet spot for strength and hypertrophy in many programs.

The app already knows how many strength sessions occurred per Sunday–Saturday block. Using that:

- The app tracks **how many weeks in a row** the user hits at least 3 strength sessions.
- Based on consecutive weeks meeting this target, the user earns:

  - **Consistent Week I**  
    - Unlock after **4 consecutive weeks** of 3+ strength sessions per week.

  - **Consistent Week II**  
    - Unlock after **12 consecutive weeks** (about 3 months).

  - **Consistent Week III**  
    - Unlock after **26 consecutive weeks** (about 6 months).

  - **Consistent Week IV**  
    - Unlock after **52 consecutive weeks** (1 full year).

  - **Consistent Week V**  
    - Unlock after **104 consecutive weeks** (2 years).

These badges highlight adherence to a key behavior: consistently hitting that strength frequency target over extended timeframes, which aligns strongly with long-term strength progress.

---

### 2.6. Streak Badges

Streak badges reward **continuous training behavior** based on the app's existing streak logic, which already accounts for appropriate rest days.

The app already tracks how many days a user has maintained a valid streak (with your rest-aware rules). Based on that:

- **Week Streak**  
  - Unlock at a streak of **7 days**.

- **Fortnight Streak**  
  - Unlock at a streak of **14 days**.

- **Month Streak**  
  - Unlock at a streak of **30 days**.

- **Quarterly Streak**  
  - Unlock at a streak of **90 days**.

- **Biannual Streak**  
  - Unlock at a streak of **180 days**.

These badges tap into the psychological power of streaks: once a user has gone 30, 90, or 180 days with consistent activity (within the app's rest-aware streak model), they receive tangible recognition.

---

## 3. Points System

The **points system** is the primary driver for **levels**. It should:

- Award points mainly for **completing sessions**.
- Weight strength more heavily than cardio or yoga.
- Reward consistency (weekly strength adherence, streaks).
- Add bonus points for milestones and badges.
- Apply gentle penalties for breaking streaks or missing weekly strength targets.

### 3.1. Base Points Per Session

Every time the user completes a session, they earn **base points** according to session type:

- **Strength session:** 100 points  
- **Cardio session:** 50 points  
- **Yoga session:** 40 points  

This reflects:
- Strength is primary for the app's core goal (strength and muscle).
- Cardio and yoga are complementary but still valuable.

These base values are awarded before any multipliers or bonuses.

---

### 3.2. Weekly Consistency Bonus (Strength Sessions)

The app uses a **Sunday–Saturday** week. The weekly consistency bonus is meant to reinforce the behavior of **completing at least 3 strength sessions per week**.

- Once the user has completed **3 or more strength sessions** during the current week:
  - Every session (of any type) completed **after hitting that 3-session threshold in that same week** receives a **20% points bonus**.

In practice:
- Before the user completes their 3rd strength session, sessions award only their base points (and any streak bonus, see below).
- As soon as the user logs their 3rd strength session of the week:
  - That session and any additional sessions later in that week (strength, cardio, or yoga) get a **1.20× multiplier** to their base points.
- This state resets at the beginning of the next week.

This bonus:
- Encourages hitting the "3 strength workouts per week" target.
- Continues to reward extra sessions after the target is reached.

---

### 3.3. Streak Bonus Multiplier

The **streak bonus** is based on the user's current streak length in **days**, according to the app's existing streak logic.

The longer the streak, the higher the bonus multiplier:

- Streak of **7+ days**: +10% → 1.10× multiplier
- Streak of **14+ days**: +15% → 1.15× multiplier
- Streak of **30+ days**: +20% → 1.20× multiplier
- Streak of **60+ days**: +25% → 1.25× multiplier
- Streak of **90+ days**: +30% → 1.30× multiplier
- Streak of **180+ days**: +35% → 1.35× multiplier
- Streak of **365+ days**: +40% → 1.40× multiplier

The user always gets the **highest applicable tier** based on their current streak.

This multiplier is applied after:
- Base session points.
- Weekly consistency bonus (if active).

This design:
- Makes maintaining a streak increasingly valuable.
- Reflects the idea that long-term consistency is more impactful and deserves more reward.

---

### 3.4. Badge Milestone Bonus Points

Whenever the user earns a **new badge** (any badge described in Section 2):

- They receive an additional **500 points** per badge.

If a single workout causes multiple badges to be unlocked (for example, hitting a total workouts milestone and a streak milestone at the same time), the user receives a **500-point bonus for each badge** unlocked.

This bonus:
- Ties the badge system directly into levels and progression.
- Makes milestone days feel more rewarding.

---

### 3.5. Streak Break Penalty

When the app's existing logic detects that a **streak has been broken** (i.e., the user failed to maintain the conditions for the streak), the user receives a small penalty:

- **Streak break penalty:** –100 points.

This should:
- Apply once per streak break event.
- Emphasize that streaks have value.
- Not be so punishing that missing a day becomes demoralizing.

The main "penalty" for breaking a streak is also the **loss of the streak multiplier** itself (which can be significant), so the numeric penalty stays modest.

---

### 3.6. Weekly Strength Target Failure Penalty

At the end of each Sunday–Saturday week:

- If the user **did not complete at least 3 strength sessions** that week, they incur a **weekly failure penalty**:
  - **Weekly failure penalty:** –150 points.

This penalty is:
- Applied once per week if the user misses the 3 strength session goal.
- Intended to reinforce the importance of hitting that weekly strength frequency.

Because this penalty is larger than the streak-break penalty, it emphasizes that failing to complete the planned weekly dosage of strength is a bigger deviation from the training plan.

---

### 3.7. Overall Session Points Flow

For each session the user completes, their points for that session are determined as follows:

1. **Base points**  
   - Strength: 100 points  
   - Cardio: 50 points  
   - Yoga: 40 points  

2. **Weekly consistency bonus**  
   - If the user has already completed 3 or more strength sessions in the current week:
     - Multiply the session's base points by **1.20** (20% bonus).

3. **Streak bonus**  
   - Based on the current streak length, apply the appropriate multiplier:
     - 1.10 to 1.40 depending on which streak tier they're in.
   - Multiply the result from step 2 by this streak multiplier.

4. The result is the **total points earned for that session** (before badge bonuses).

5. After calculating session points:
   - Add these points to the user's overall **total points**.

6. Then, check whether this session caused **any new badges** to be unlocked:
   - For each newly unlocked badge, add **500 points**.

7. Separately from session events:
   - At the moment a streak breaks, apply **–100 points**.
   - At the end of each week, if 3 strength sessions were not completed, apply **–150 points**.

---

## 4. Level Progression

The level system is based on **cumulative total points**.

### 4.1. General Behavior

- The user starts at **Level 1** with **0 points**.
- As they accumulate total points (from sessions, bonuses, badges, minus penalties), they cross thresholds that increase their level.
- **Levels should feel frequent early on**, then gradually spread out over longer intervals as the user advances, without ever becoming impossibly slow.

The system is designed so that:
- New users level up often in the first few weeks (to build momentum).
- Long-term users still see level increases on the order of weeks/months, not years, even after 2+ years of consistent training.

### 4.2. Example Level Thresholds

Levels are defined by **cumulative points required to reach each level**. Below is an example progression pattern:

- Level 1: **0 points** (starting point)
- Level 2: **2,000 points**
- Level 3: **4,500 points**
- Level 4: **7,500 points**
- Level 5: **11,500 points**
- Level 6: **16,500 points**
- Level 7: **22,500 points**
- Level 8: **29,500 points**
- Level 9: **37,500 points**
- Level 10: **47,500 points**
- Level 11: **59,000 points**
- Level 12: **72,000 points**
- Level 13: **87,000 points**
- Level 14: **104,500 points**
- Level 15: **125,000 points**

Further out, the thresholds continue to grow, for example:

- Level 20: around **350,000 points**
- Level 25: around **750,000 points**
- Level 30: around **1,400,000 points**

The exact thresholds can be interpreted as:
- Early levels (1–5) require small increases, so users reach them in roughly a few weeks of normal, consistent training.
- Mid-range levels (6–15) spread out steadily, roughly every 4–10 weeks for a consistent user.
- Higher levels (20, 25, 30…) are spaced so that a long-term user training regularly for 2+ years still sees meaningful progression.

### 4.3. Level-Up Behavior

Whenever the user's **total points** change (because of sessions, badges, or penalties):

- The app determines which level the user should be at based on their **new total points** and the level thresholds.
- If the new level is **higher than the current level**, the user **levels up**:
  - Their `currentLevel` increases to the new level.
  - The app can display a **level-up celebration**, highlight the behavior that led to this (e.g., consistent weekly strength, streak maintenance, etc.), and optionally unlock cosmetic perks.

The system is intended to **never feel capped**:
- There is always another level that can be reached with continued effort.
- Early levels are quick for motivation; later levels are more spaced out but still reasonably reachable with consistent engagement.

---

## 5. Long-Term Behavior and Examples

### 5.1. How This Feels for a New User (First Few Months)

- In the first few weeks:
  - The user quickly earns early badges such as:
    - Training Novice (25 total workouts).
    - First Steps or Finding Rhythm (10–25 strength sessions).
    - Cardio Starter or Yoga Beginner (if they use those modalities).
    - Early streak badges like Week Streak or Fortnight Streak.
  - They level up from Level 1 to around Levels 4–6 relatively quickly as they accumulate base points, consistency bonuses, and streak bonuses.

- They start to notice:
  - Strength sessions are more "valuable" in points.
  - Hitting 3 strength sessions per week suddenly makes all sessions more rewarding (Weekly Consistency Bonus).
  - Maintaining a streak pushes their points per session higher over time.

### 5.2. How This Feels at 3–6 Months

- The user begins to unlock:
  - Strength session badges like Building Momentum (50), Consistent Lifter (100), or Dedicated Lifter (150).
  - Cardio Habit (75) and Yoga Regular (30) if they cross those counts.
  - Consistent Week I or II for maintaining 3+ strength sessions per week.
  - Longer streak badges such as Month Streak.

- Levels:
  - They move through Levels 8–12 over this period.
  - Each level takes a few weeks to achieve but remains tangible and reachable.

### 5.3. How This Feels at 1–2 Years

- The user may unlock:
  - Iron Beginner, Iron Novice, or Iron Intermediate in total tonnage (depending on volume).
  - Dedicated Lifter or Committed Lifter (150–300 strength sessions).
  - Cardio Enthusiast (150) and Yoga Devotee (75) if maintaining those modalities.
  - Consistent Week III or IV (6–12 months of consistent weeks hitting 3+ strength sessions).
  - Quarterly Streak (90 days).

- Points and levels:
  - They might be in the Level 15–20 range.
  - Level-ups still occur every few weeks or months, so progress remains tangible.

### 5.4. How This Feels at 2+ Years

- The user may unlock:
  - Iron Intermediate, Iron Veteran, or Iron Master in total tonnage.
  - Lifetime Lifter (1,000 strength sessions) if they've been lifting 3–5x/week consistently.
  - Consistent Week V (2 years of consistent weeks hitting 3+ strength sessions) if they've truly been dialed in.
  - Longer-time badges such as Training Legend or Training Immortal depending on total workouts.
  - Biannual Streak (180 days).

- Points and levels:
  - They might be in the Level 20–30 range.
  - Level-ups still occur periodically (every few weeks or months), so progress never feels stagnant.
  - Their streak bonus and weekly consistency bonus keep session points high, so **long-term consistency is continuously rewarded**.

---

## 6. Behavioral and Scientific Alignment

The entire system is designed around behaviors that research supports:

- **Strength training at least ~3 times per week** for optimal strength and hypertrophy adaptations.
- **Progressive overload** tracked via increasing cumulative volume and making high-volume sessions meaningful.
- **Regular cardio** in line with public health recommendations (e.g., 150 minutes moderate intensity per week).
- **Mobility and yoga** as support for joint health, flexibility, and improved recovery.
- **Consistency and streaks** as the single best predictor of long-term results.

The app rewards:
- Showing up frequently, with early badges for even modest session counts (10, 25, 50).
- Hitting strength targets weekly.
- Maintaining streaks.
- Accumulating meaningful volume and time in training.
- Continuing to train year after year, with new milestones always on the horizon.

All of this is done through:
- Clear, named badges with specific milestone thresholds, including multiple early-win badges.
- A transparent, understandable points system.
- Level thresholds that provide continuous, long-term engagement.

This is how the system should work, conceptually and behaviorally, without dictating implementation details or code structure.
