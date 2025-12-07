# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed - Exercise Name Format Migration (December 2024)

#### Overview
All exercise names in the application have been migrated to a consistent "Movement, Equipment" format for better clarity and usability.

#### Format Change
- **Old Format**: Equipment first (e.g., "Barbell Bench Press", "Dumbbell Romanian Deadlift")
- **New Format**: Movement first with equipment after comma (e.g., "Bench Press, Barbell", "Romanian Deadlift, Dumbbell")

#### What This Means for Users
- **No Data Loss**: All your workout history, exercise weights, target reps, and pinned exercises are automatically migrated
- **Backward Compatible**: The app automatically converts old format names when loading your data
- **Seamless Transition**: Migration runs automatically on app startup
- **Better Organization**: Exercises are now more logically grouped by movement pattern rather than equipment

#### Technical Details
- **Data Files Updated**: All CSV and JSON exercise databases
- **Automatic Migration**: localStorage and guest storage data migrated on first load
- **Comprehensive Mapping**: 108 exercise name mappings covering all equipment types:
  - 28 Barbell exercises
  - 40 Dumbbell exercises  
  - 3 Cable exercises
  - 10 Kettlebell exercises
  - 5 Landmine exercises
  - 4 Slam Ball exercises
  - 3 Rope exercises

#### Migration Files
- `scripts/migrate-exercise-names.js` - CSV data migration script
- `src/utils/exerciseNameMigration.js` - User data migration utility
- `src/utils/exerciseNameNormalizer.js` - Name normalization and mapping

#### Testing
All migration scripts have been tested to ensure:
- Zero data loss
- Idempotent operations (safe to run multiple times)
- Backward compatibility maintained
- All 147 exercises properly formatted

---

For questions or issues related to this migration, please open an issue on GitHub.
