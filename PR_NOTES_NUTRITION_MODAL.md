# Transform Nutrition Tracking into Full-Screen Modal with Improved USDA SR Legacy Search

## Overview
This PR transforms the nutrition tracking/logging flow into a full-screen modal titled "Log a Meal" that is modeled after and visually adapted from the workout builder's interface. It includes intelligent USDA SR Legacy search with automatic detection of food types (meat/seafood vs vegetables/fruits) to provide relevant, contextual results.

## Objectives Achieved

### 1. Full-Screen Modal Implementation
✅ Created `LogMealModal` component using workout builder's visual style system
✅ Minimalist, full-screen modal with clear sections for:
- Search functionality
- Meal details
- Nutrition entry
- Recent foods (suggestions from previously logged items)
- Favorites (placeholder for future enhancement)

### 2. Improved USDA SR Legacy Search

#### API Query Restrictions
✅ All API queries restricted to SR Legacy only (`dataType: ['SR Legacy']`)
✅ SR Legacy filtering hidden from user (implementation detail not exposed)

#### Intelligent Search Query Building
✅ **For Meats/Seafood:** Automatically adds "cooked" to search terms
- Covers: chicken, beef, pork, lamb, fish, shrimp, crab, lobster, duck, veal, etc.
- Prioritizes common cooked forms (roasted, grilled, baked, boiled, steamed, sautéed)
- Example: "chicken" → searches for "chicken cooked"
- User sees: "Showing cooked forms by default"

✅ **For Vegetables/Fruits:** Allows raw and cooked forms
- Covers: carrot, broccoli, spinach, apple, banana, etc.
- Searches by food name only
- Example: "carrot" → searches for "carrot" (shows raw, cooked, canned, etc.)
- User sees: "Showing raw and cooked forms"

#### Result Processing
✅ Deduplication: Collapses near-identical results
✅ Relevance sorting: Elevates cooked meats, shows all unfiltered veggies/fruits
✅ Contextual hints: Clear messaging based on food type detection

### 3. User Experience Defaults
✅ Meats assumed cooked by default
✅ Vegetables/fruits show raw and cooked options
✅ Previously logged foods available in "Recent" tab
✅ Favorites tab (placeholder for future: commonly used foods for quick logging)

## Technical Implementation

### New Files
- **`src/components/LogMealModal.jsx`** (586 lines)
  - Full-screen modal component
  - Three tabs: Search Foods, Recent, Favorites
  - Integrated search with contextual hints
  - Portion size entry and nutrition display

### Enhanced Files
- **`src/utils/foodSearchUtils.js`** (+190 lines)
  - `isMeatOrSeafood()` - Detects meat/seafood keywords
  - `isVegetableOrFruit()` - Detects vegetable/fruit keywords
  - `buildOptimizedQuery()` - Builds smart queries based on food type
  - `deduplicateFoods()` - Removes near-identical food entries
  - `scoreFoodRelevance()` - Scores foods for relevance with named constants
  - `sortByRelevance()` - Sorts results by relevance score
  - `RELEVANCE_SCORE` - Named constants for scoring thresholds

- **`src/components/WorkTabs/NutritionTab.jsx`** (+50 lines)
  - Added prominent "Log a Meal" button at top
  - Integrated LogMealModal
  - Added `getRecentFoods()` - Extracts unique foods from last 30 days

## Search Logic Details

### Meat/Seafood Detection
```javascript
const MEAT_SEAFOOD_KEYWORDS = [
  'chicken', 'beef', 'pork', 'lamb', 'turkey', 'duck', 'veal', 'venison',
  'fish', 'salmon', 'tuna', 'cod', 'tilapia', 'halibut', 'trout', 'bass',
  'shrimp', 'prawn', 'crab', 'lobster', 'scallop', 'oyster', 'mussel', 'clam',
  'sausage', 'bacon', 'ham', 'steak', 'ground beef', 'ground turkey', 'ground chicken',
];
```

### Vegetable/Fruit Detection
```javascript
const VEGETABLE_FRUIT_KEYWORDS = [
  'carrot', 'broccoli', 'spinach', 'kale', 'lettuce', 'tomato', 'cucumber',
  'pepper', 'onion', 'garlic', 'potato', 'sweet potato', 'squash', 'zucchini',
  'cauliflower', 'cabbage', 'celery', 'asparagus', 'green beans', 'peas',
  'apple', 'banana', 'orange', 'grape', 'strawberry', 'blueberry', 'raspberry',
  'melon', 'watermelon', 'pear', 'peach', 'plum', 'cherry', 'mango', 'pineapple',
];
```

### Query Building Example
- User searches: "chicken"
- System detects: meat/seafood
- Query built: "chicken cooked"
- API call: `/foods/search?query=chicken%20cooked&dataType=SR%20Legacy`
- Results: Only cooked chicken forms (roasted, grilled, boiled, etc.)

### Relevance Scoring
```javascript
const RELEVANCE_SCORE = {
  EXACT_MATCH_BONUS: 100,
  STARTS_WITH_BONUS: 50,
  COOKING_METHOD_BONUS: 30,
  RAW_PENALTY: -50,
  LONG_DESCRIPTION_WORD_THRESHOLD: 8,
  LONG_DESCRIPTION_PENALTY: -10,
};
```

## UI/UX Improvements

### Visual Design
- Full-screen modal (follows workout builder pattern)
- Clean header with title and close button
- Three-tab layout for easy navigation
- Search bar with icon and placeholder text
- Contextual info alerts (blue) for search hints
- Nutrition chips showing calories, protein, carbs, fat
- Disabled state for "Add Entry" button until food selected

### User Flow
1. User clicks "Log a Meal" button (prominent green button at top of Nutrition tab)
2. Full-screen modal opens with Search tab active
3. User types food name (e.g., "chicken" or "carrot")
4. System shows contextual hint based on food type
5. Results appear with nutrition info
6. User clicks food item to select
7. Bottom panel shows selected food with portion size input
8. User adjusts grams and clicks "Add Entry"
9. Entry saved and modal closes

### Recent Foods Feature
- Automatically populates from nutrition entries in last 30 days
- Deduplicates by food name
- Shows in "Recent" tab for quick re-logging
- Reconstructs food data for consistency

## Screenshots

### 1. Nutrition Tab with "Log a Meal" Button
![Nutrition Tab](https://github.com/user-attachments/assets/66aa2663-75c7-4d0c-914f-d5d499648d2c)

### 2. Full-Screen Log Meal Modal
![Log Meal Modal](https://github.com/user-attachments/assets/2fe5189b-e7bc-45a4-9ea0-483e19f8f9ad)

### 3. Meat Search (Chicken) - Cooked Forms Only
![Chicken Search](https://github.com/user-attachments/assets/d2f933d5-cd4a-4969-8d01-b5e0eb171fd4)
Note: Alert shows "Showing cooked forms by default" and all results are cooked

### 4. Vegetable Search (Carrot) - Raw and Cooked Forms
![Carrot Search](https://github.com/user-attachments/assets/eb72889f-8af9-4a29-b920-e8220410deec)
Note: Alert shows "Showing raw and cooked forms" and results include raw, cooked, canned

## Code Quality

### Code Review Feedback Addressed
✅ Extracted magic numbers to named constants (`RELEVANCE_SCORE`)
✅ Fixed deprecated Material-UI `ListItem` button prop (now uses `component="button"`)
✅ Improved code maintainability and readability

### Testing
✅ Build passes successfully
✅ No new lint errors introduced
✅ Manual testing completed:
  - Modal open/close behavior works correctly
  - Search functionality for meats (chicken) shows only cooked forms
  - Search functionality for vegetables (carrot) shows raw and cooked forms
  - Contextual hints display correctly based on food type
  - SR Legacy filtering works (only SR Legacy results returned)
  - Recent foods tab populates correctly

## Future Enhancements (Not Included)

### Favorites Feature
- Allow users to mark frequently logged foods as favorites
- Quick access button in modal
- Persistent storage of favorites

### Advanced Options
- Toggle to override smart defaults (e.g., show raw meat if desired)
- Custom portion size presets (1 cup, 1 serving, etc.)
- Barcode scanner integration

### Meal Templates
- Save complete meals for quick logging
- Common meal patterns (breakfast, lunch, dinner)
- Macro-based meal suggestions

## Notes

### Design Decisions
1. **SR Legacy Only**: Chose to restrict to SR Legacy for comprehensive, consistent data
2. **Simple Query Building**: Using "cooked" addition rather than complex query syntax for USDA API compatibility
3. **Client-Side Filtering**: Implementing deduplication and relevance sorting client-side for better control
4. **Contextual Hints**: Showing users what type of results they're getting builds trust and understanding

### Known Limitations
1. Favorites tab is a placeholder (future implementation)
2. Food type detection based on keyword matching (extensible but not exhaustive)
3. Does not handle all edge cases (e.g., "raw chicken" would still add "cooked" but filtering helps)

### Migration Path
- Existing nutrition logging functionality remains intact
- Old search UI still available in main nutrition tab
- New modal is opt-in via prominent button
- No breaking changes to data structure

## Summary
This PR successfully transforms the nutrition tracking experience with:
- ✅ Beautiful full-screen modal following app design patterns
- ✅ Intelligent search that understands food types
- ✅ SR Legacy only filtering (hidden from users)
- ✅ Contextual hints for better UX
- ✅ Recent foods for quick re-logging
- ✅ Clean, maintainable code with proper constants
- ✅ Comprehensive testing and validation
