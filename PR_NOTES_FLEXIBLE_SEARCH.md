# PR Notes: Flexible Keyword-Based Nutrition Search

## Summary
This PR implements flexible keyword-based search for the nutrition search function, allowing queries with multiple words to return matches regardless of word order. For example, searching for "chickpeas canned" will now return results for "canned chickpeas" and similar variations.

## Problem
Previously, the nutrition search function required exact word order matching. Queries like "chickpeas canned" would not match foods described as "Canned chickpeas, drained" or "Chickpeas, canned, drained, rinsed". This limitation made it difficult for users to find foods unless they knew the exact phrasing used in the USDA database.

## Solution
Implemented a flexible keyword-based matching system that:
1. Splits search queries into individual keywords
2. Fetches a larger set of results from the USDA API (25 instead of 5)
3. Filters results client-side to match foods containing ALL keywords in ANY order
4. Returns the top 5 matches to the user

## Technical Details

### New Files
- **`src/utils/foodSearchUtils.js`**: Shared utility module containing:
  - `FOOD_SEARCH_CONFIG`: Configuration constants for API page size (25) and max results (5)
  - `matchesAllKeywords()`: Checks if a food description contains all keywords regardless of order
  - `parseSearchKeywords()`: Parses search query into individual keywords

### Modified Files
- **`src/components/WorkTabs/NutritionTab.jsx`**: Updated to use flexible keyword matching
- **`src/components/WorkTabs/RecipeBuilder.jsx`**: Updated to use flexible keyword matching

### How It Works
1. User enters a search query (e.g., "chickpeas canned")
2. Query is parsed into keywords: `["chickpeas", "canned"]`
3. USDA API is queried for 25 results (increased from 5)
4. Results are filtered client-side to include only foods with ALL keywords
5. Top 5 matches are displayed to the user

### Example Matches
**Query: "chickpeas canned"**
- ✅ Matches: "Canned chickpeas, drained"
- ✅ Matches: "Chickpeas, canned, drained, rinsed"
- ✅ Matches: "Garbanzo beans (chickpeas), canned"
- ❌ Does not match: "Chickpeas, raw" (missing "canned")
- ❌ Does not match: "Canned tomatoes" (missing "chickpeas")

**Query: "beef ground"**
- ✅ Matches: "Beef, ground, 85% lean"
- ✅ Matches: "Ground beef, 80% lean meat / 20% fat"
- ❌ Does not match: "Turkey, ground, 93% lean" (missing "beef")

## Benefits
1. **Improved User Experience**: Users can search using natural language without worrying about exact word order
2. **More Accurate Results**: Matches are based on semantic content rather than exact string matching
3. **Maintains Performance**: Client-side filtering is fast and doesn't add noticeable latency
4. **Maintains Compatibility**: Works seamlessly with existing Foundation and SR Legacy filters
5. **No Breaking Changes**: Existing search functionality, portion entry, and nutrition calculation remain unchanged

## Testing
- Created comprehensive unit tests for the matching logic (9 test cases, all passing)
- Verified build completes successfully with no errors
- Verified no new linting issues introduced
- Manual testing confirmed the flexible matching works as expected

## Code Quality
- Extracted shared utilities to eliminate code duplication
- Used named constants instead of magic numbers for configuration
- Added comprehensive JSDoc comments for all functions
- Followed existing code style and patterns

## Security Considerations
- No security vulnerabilities introduced
- All functions are pure with no side effects
- User input is properly handled and sanitized through existing validation
- API calls remain unchanged except for page size parameter

## Compatibility
- ✅ Works with USDA FoodData Central API
- ✅ Compatible with Foundation filter
- ✅ Compatible with SR Legacy filter
- ✅ Does not affect portion entry functionality
- ✅ Does not affect nutrition calculation
- ✅ Does not affect recipe builder functionality beyond search improvement

## Configuration
The search behavior can be easily adjusted via constants in `foodSearchUtils.js`:
- `API_PAGE_SIZE`: Number of results to fetch from API (default: 25)
- `MAX_RESULTS`: Maximum results to display (default: 5)

## Future Enhancements
Potential future improvements could include:
- Fuzzy matching for typos
- Synonym support (e.g., "garbanzo" → "chickpeas")
- Relevance scoring to rank results
- User search history and preferences
