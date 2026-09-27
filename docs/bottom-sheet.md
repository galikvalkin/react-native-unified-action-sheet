# Bottom sheets

`presentationStyle: 'bottom'` presents a native bottom sheet on both platforms: a drag handle, swipe down to cancel, and a long list that opens part-way and drags up to expand. Cancel is the last row. Swipe down and a tap on the dimmed backdrop (and back, on Android) resolve the cancel index, or `-1` if there is no cancel button. `anchor` is ignored.

| | iOS | Android |
| --- | --- | --- |
| Component | `UISheetPresentationController` | Material 3 `BottomSheetDialog` |
| Setup | none | [enable Material](#enabling-material-android) |
| Short list | Opens at its own height (iOS 16+; half height on iOS 15) | Opens at its own height |
| iPad | Presents the action sheet's popover instead, as a sheet on iPad is a centered form sheet | n/a |

```ts
await showActionSheetWithOptions({
  options: [...],
  presentationStyle: 'bottom',
});
```

## Enabling Material (Android)

The bottom sheet needs `com.google.android.material`, which this library does not add unless you ask for it.

**React Native CLI:**

```properties
# android/gradle.properties
unifiedActionSheet.material=true
```

**Expo:** use the config plugin instead, then rebuild with `npx expo prebuild` or `npx expo run:android`:

```json
{
  "expo": {
    "plugins": [["react-native-unified-action-sheet", { "material": true }]]
  }
}
```

Without it, `'bottom'` falls back to the centered dialog, and a warning in development tells you what to set.

## Material version

The library pins a tested Material version (1.12.0). If your app already uses Material, Gradle resolves the two to the higher version. To choose one yourself, use any of:

- `ext.materialVersion` in `android/build.gradle`
- `unifiedActionSheet.materialVersion` in `gradle.properties`
- `materialVersion` in the Expo plugin's options

The sheet brings its own Material 3 theme, so your app's theme can stay plain AppCompat.

## Limitations

Prompts don't support `'bottom'` and always present centered.
